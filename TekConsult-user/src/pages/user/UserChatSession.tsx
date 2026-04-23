import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, Clock, Wallet, Pause, Play, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../../contexts/AuthContext';
import { consultantAPI, chatAPI, sessionAPI, API_BASE_URL } from '@/services/api';
import { SessionState } from '@/types/enums';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import * as signalR from '@microsoft/signalr';
import { getEffectiveRate } from '@/lib/pricing';
import ReviewModal from '@/components/session/ReviewModal';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'consultant';
    timestamp: Date;
}

const SIGNALR_BASE = (API_BASE_URL || '').split('/api')[0] || window.location.origin;
const HUB_URL = `${SIGNALR_BASE}/chatHub`;

// Helper to ensure dates from server (UTC) are parsed correctly in local time
const parseServerDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null;
    const normalized = (dateStr.endsWith('Z') || dateStr.includes('+'))
        ? dateStr
        : `${dateStr}Z`;
    return new Date(normalized);
};

const UserChatSession = () => {
    const { id } = useParams(); // Consultant ID
    const navigate = useNavigate();
    const location = useLocation();
    const { user, updateWalletBalance } = useAuth();

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sessionDuration, setSessionDuration] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [isAccepted, setIsAccepted] = useState(false);
    const [peerInfo, setPeerInfo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sessionId, setSessionId] = useState<string | null>(location.state?.sessionId || null);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [maxAllowedEndTime, setMaxAllowedEndTime] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const [isSignalRConnected, setIsSignalRConnected] = useState(false);

    // =========================
    // 1. Setup SignalR Connection
    // =========================
    useEffect(() => {
        let mounted = true;
        let connection: signalR.HubConnection;

        const startConnection = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            connection = new signalR.HubConnectionBuilder()
                .withUrl(HUB_URL, { accessTokenFactory: () => token })
                .withAutomaticReconnect()
                .build();

            // Clear old handlers
            connection.off("ReceiveMessage");
            connection.off("SessionAccepted");
            connection.off("SessionEnded");
            connection.off("SessionRejected");

            // =========================
            // Receive Message
            // =========================
            connection.on("ReceiveMessage", (msg: any) => {
                if (!mounted) return;

                console.log("📩 Received message:", msg);

                // Support both PascalCase and camelCase
                const text = typeof msg === "string" ? msg : msg.content || msg.Content || msg.messageText || msg.text || "";
                const senderId = typeof msg === "string" ? null : msg.senderId || msg.SenderId;
                const msgId = typeof msg === "string" ? null : msg.messageId || msg.MessageId;
                const myId = localStorage.getItem("userId");

                const sender: "user" | "consultant" =
                    String(senderId || "").toLowerCase() === String(myId || "").toLowerCase() ? "user" : "consultant";

                const formattedMsg: Message = {
                    id: msgId || `${Date.now()}-${Math.random()}`,
                    text,
                    sender,
                    timestamp: new Date()
                };

                setMessages(prev => {
                    const duplicate = prev.some(m =>
                        m.id === formattedMsg.id ||
                        (m.text === formattedMsg.text &&
                            m.sender === formattedMsg.sender &&
                            Math.abs(m.timestamp.getTime() - formattedMsg.timestamp.getTime()) < 2000)
                    );
                    if (duplicate) return prev;
                    return [...prev, formattedMsg];
                });

                // Any message => session is accepted
                setIsAccepted(true);
            });

            // =========================
            // Session Accepted
            // =========================
            connection.on("SessionAccepted", (payload: any) => {
                if (!mounted) return;

                console.log("🚀 SessionAccepted event:", payload);

                // Update sessionId if we didn't have it
                const sId = payload?.sessionId || payload?.SessionId;
                if (sId) {
                    setSessionId(sId);
                }

                setIsAccepted(true);
                setIsActive(true);

                // Handle both PascalCase and camelCase from backend
                const maxEnd = payload?.maxAllowedEndTime || payload?.MaxAllowedEndTime;
                const start = payload?.startTime || payload?.StartTime;

                if (maxEnd) {
                    setMaxAllowedEndTime(maxEnd);
                    const endDate = parseServerDate(maxEnd);
                    if (endDate) {
                        const end = endDate.getTime();
                        const now = new Date().getTime();
                        setTimeLeft(Math.max(0, Math.floor((end - now) / 1000)));
                    }
                }

                if (start) {
                    const startTimeDate = parseServerDate(start);
                    if (startTimeDate) {
                        const now = new Date();
                        setSessionDuration(Math.max(0, Math.floor((now.getTime() - startTimeDate.getTime()) / 1000)));
                    }
                }

                toast({
                    title: "Session Started",
                    description: payload?.message || payload?.Message || "The consultant has joined."
                });

                // Join SignalR group immediately
                const targetSid = sId || sessionId;
                if (targetSid) {
                    connection.invoke("JoinSession", targetSid)
                        .catch(err => console.error("Failed to join session after acceptance:", err));
                }
            });

            // =========================
            // Session Ended
            // =========================
            connection.on("SessionEnded", () => {
                if (!mounted) return;
                setIsActive(false);
                setShowReviewModal(true);
                toast({ title: "Session Ended" });
            });

            // =========================
            // Session Rejected
            // =========================
            connection.on("SessionRejected", () => {
                if (!mounted) return;
                toast({ title: "Session Rejected", variant: "destructive" });
                navigate("/user/home");
            });

            try {
                await connection.start();
                if (!mounted) return;
                connectionRef.current = connection;
                setIsSignalRConnected(true);

                // Join if conversationId exists
                if (conversationId) {
                    connection.invoke("JoinConversation", conversationId)
                        .catch(err => console.error("Error joining conversation on connect:", err));
                }

                // Join if sessionId exists
                if (sessionId) {
                    connection.invoke("JoinSession", sessionId)
                        .catch(err => console.error("Error joining session on connect:", err));
                }

                console.log("🔌 SignalR Connected");

            } catch (err) {
                console.error("SignalR start error:", err);
            }
        };

        startConnection();

        return () => {
            mounted = false;
            if (connection) connection.stop();
            connectionRef.current = null;
            setIsSignalRConnected(false);
        };
    }, [user?.id]);

    // =========================
    // 2. Join session when sessionId is set
    // =========================
    useEffect(() => {
        if (isSignalRConnected && connectionRef.current) {
            if (conversationId) {
                connectionRef.current.invoke("JoinConversation", conversationId)
                    .catch(err => console.error("Failed to join conversation:", err));
            }
            if (sessionId) {
                connectionRef.current.invoke("JoinSession", sessionId)
                    .catch(err => console.error("Failed to join session:", err));
            }
        }
    }, [isSignalRConnected, sessionId, conversationId]);

    // =========================
    // 3. Fetch Consultant & Session Data
    // =========================
    useEffect(() => {
        let mounted = true;

        const init = async () => {
            if (!id) return;
            setIsLoading(true);

            try {
                // Consultant info
                const data = await consultantAPI.getConsultantById(id);
                if (!mounted) return;
                setPeerInfo({
                    id: data.userId,
                    name: `${data.firstName} ${data.lastName || ''}`.trim(),
                    avatar: data.profilePhotoUrl
                        ? (data.profilePhotoUrl.startsWith('http') || data.profilePhotoUrl.startsWith('data:')
                            ? data.profilePhotoUrl
                            : `${API_BASE_URL}${data.profilePhotoUrl}`)
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(data.firstName || 'C')}`,
                    rate: getEffectiveRate(data.chatRatePerMinute || 0, {
                        isDiscountActive: data.isChatDiscountActive,
                        discountedRate: data.discountedChatRate,
                        discountStart: data.discountStart,
                        discountEnd: data.discountEnd
                    }),
                });

                // 1. Get/Create Conversation
                const conv = await chatAPI.getOrCreateConversation(id!);
                if (!mounted) return;
                setConversationId(conv.id);

                // 2. Load History for the conversation
                const history = await chatAPI.getConversationMessages(conv.id);
                if (mounted && history?.length) {
                    setMessages(history.map((m: any) => ({
                        id: m.messageId || m.id,
                        text: m.content || m.messageText || m.text,
                        sender: String(m.senderId || m.SenderId).toLowerCase() === String(localStorage.getItem('userId')).toLowerCase() ? 'user' : 'consultant',
                        timestamp: parseServerDate(m.timestamp || m.sentAt) as Date,
                    })));
                }

                // 3. Check for active session
                let activeSid = sessionId;
                if (!activeSid) {
                    const response = await sessionAPI.getUserHistory(0, 5);
                    const activeSession = response.sessions.find(s => s.state < 2 && s.consultantId === id);
                    if (activeSession && mounted) {
                        activeSid = activeSession.sessionId;
                        setSessionId(activeSid);
                    }
                }

                if (activeSid) {
                    const sData = await sessionAPI.getSessionById(activeSid);
                    if (!mounted) return;

                    // Handle session state
                    if (sData.state === SessionState.Active) {
                        setIsAccepted(true);
                        setIsActive(true);
                        if (sData.appliedRate) {
                            setPeerInfo(prev => prev ? { ...prev, rate: sData.appliedRate } : null);
                        }
                        if (sData.maxAllowedEndTime) {
                            setMaxAllowedEndTime(sData.maxAllowedEndTime);
                            const endDate = parseServerDate(sData.maxAllowedEndTime);
                            if (endDate) {
                                const end = endDate.getTime();
                                const now = new Date().getTime();
                                setTimeLeft(Math.max(0, Math.floor((end - now) / 1000)));
                            }
                        }

                        if (sData.startTime) {
                            const startTimeDate = parseServerDate(sData.startTime);
                            if (startTimeDate) {
                                const start = startTimeDate.getTime();
                                const now = new Date().getTime();
                                setSessionDuration(Math.max(0, Math.floor((now - start) / 1000)));
                            }
                        }
                    } else if ([SessionState.Completed, SessionState.Rejected].includes(sData.state)) {
                        setIsActive(false);
                        navigate('/user/home');
                        toast({ title: "Session previously ended or rejected" });
                        return;
                    }
                }
            } catch (err) {
                console.error("UserChat init error:", err);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        init();
        return () => { mounted = false; };
    }, [id, user?.id]);

    // =========================
    // 4. Polling Fallback for Session Status
    // =========================
    useEffect(() => {
        // Only poll if we have a sessionId but the session isn't accepted yet
        if (!sessionId || isAccepted || !isActive) return;

        console.log("⏱️ Starting polling for session:", sessionId);

        const pollInterval = setInterval(async () => {
            try {
                const sData = await sessionAPI.getSessionById(sessionId);
                console.log("📡 Polling status for", sessionId, ":", sData.state);

                if (sData.state === SessionState.Active) {
                    console.log("🔄 Polling detected active session!");
                    setIsAccepted(true);
                    setIsActive(true);

                    if (sData.appliedRate) {
                        setPeerInfo(prev => prev ? { ...prev, rate: sData.appliedRate } : null);
                    }

                    if (sData.maxAllowedEndTime) {
                        setMaxAllowedEndTime(sData.maxAllowedEndTime);
                        const endDate = parseServerDate(sData.maxAllowedEndTime);
                        if (endDate) {
                            const end = endDate.getTime();
                            const now = new Date().getTime();
                            setTimeLeft(Math.max(0, Math.floor((end - now) / 1000)));
                        }
                    }
                    if (sData.startTime) {
                        const startTimeDate = parseServerDate(sData.startTime);
                        if (startTimeDate) {
                            const start = startTimeDate.getTime();
                            const now = new Date().getTime();
                            setSessionDuration(Math.max(0, Math.floor((now - start) / 1000)));
                        }
                    }

                    // Trigger SignalR join just in case
                    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
                        connectionRef.current.invoke("JoinSession", sessionId)
                            .catch(e => console.error("Polling SignalR join error:", e));
                    }
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 5000);

        return () => {
            console.log("🛑 Stopping polling for session:", sessionId);
            clearInterval(pollInterval);
        };
    }, [sessionId, isAccepted, isActive, isSignalRConnected]);

    // =========================
    // 4. Scroll messages
    // =========================
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // =========================
    // 5. Session timer & wallet deduction
    // =========================
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && !isPaused && isAccepted && peerInfo) {
            interval = setInterval(() => {
                setSessionDuration(prev => prev + 1);
                if (peerInfo.rate > 0 && (sessionDuration + 1) % 60 === 0) {
                    updateWalletBalance(-peerInfo.rate);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, isPaused, sessionDuration, isAccepted, peerInfo]);

    // =========================
    // 6. Countdown timer for session expiry
    // =========================
    useEffect(() => {
        if (!maxAllowedEndTime || !isActive || isPaused) return;
        const interval = setInterval(() => {
            const end = new Date(maxAllowedEndTime).getTime();
            const now = new Date().getTime();
            const diff = Math.max(0, Math.floor((end - now) / 1000));
            setTimeLeft(diff);
            if (diff <= 0) {
                setIsActive(false);
                setIsPaused(true);
                toast({ title: "Session Expired", variant: "destructive" });
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [maxAllowedEndTime, isActive, isPaused]);

    // =========================
    // Send Message
    // =========================
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !conversationId) return;
        const msgText = newMessage.trim();

        // Optimistic UI: show message immediately
        const optimisticMsg: Message = {
            id: `local-${Date.now()}-${Math.random()}`,
            text: msgText,
            sender: 'user',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage('');

        try {
            if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
                await connectionRef.current.invoke("SendMessageToConversation", conversationId, msgText, sessionId);
                console.log("✅ Message sent via SignalR");
            } else {
                throw new Error("SignalR not connected");
            }
        } catch (signalRErr) {
            console.error("❌ SignalR send failed:", signalRErr);
            // Fallback: try HTTP if needed, but SignalR is preferred for conversations
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
            setNewMessage(msgText);
            toast({ title: "Failed to send message", variant: "destructive" });
        }
    };

    // End Session
    const handleEndSession = async () => {
        if (!sessionId) { navigate('/user/home'); return; }
        try {
            setIsActive(false);
            await chatAPI.endSession(sessionId);
            setShowReviewModal(true);
        } catch (err) {
            navigate('/user/home');
        }
    };

    const formatCountdown = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!peerInfo) return <div className="h-screen flex items-center justify-center">Consultant not found</div>;

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Header */}
            <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
                <button onClick={handleEndSession}><ArrowLeft className="w-5 h-5" /></button>
                <img src={peerInfo.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                <div className="flex-1">
                    <h2 className="font-semibold">{peerInfo.name}</h2>
                    <p className="text-xs text-success">{isAccepted ? 'Connected' : 'Waiting...'}</p>
                </div>
                <Button variant="destructive" size="sm" onClick={handleEndSession} className="rounded-lg">
                    <X className="w-4 h-4 mr-1" /> End
                </Button>
            </div>

            {/* Timer & Wallet */}
            <div className="bg-primary/5 border-b border-border px-4 py-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="font-semibold">{formatCountdown(sessionDuration)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Wallet className="w-4 h-4 text-primary" />
                        <span className="font-semibold">₹{user?.walletBalance || 0}</span>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsPaused(!isPaused)} disabled={!isAccepted}>
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
                {!isAccepted && (
                    <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6 text-center">
                        <div className="max-w-xs space-y-4">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto relative scale-110">
                                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                                <Clock className="w-10 h-10 text-primary relative z-10" />
                            </div>
                            <h3 className="text-lg font-bold">Waiting for Acceptance</h3>
                            <p className="text-sm text-muted-foreground">Stay on this screen while {peerInfo.name} accepts your request.</p>
                        </div>
                    </div>
                )}
                {messages.map((message) => (
                    <div key={message.id} className={cn('flex', message.sender === 'user' ? 'justify-end' : 'justify-start')}>
                        <div className={cn('max-w-[80%] px-4 py-3 rounded-2xl', message.sender === 'user' ? 'gradient-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm')}>
                            <p>{message.text}</p>
                            <p className="text-[10px] mt-1 opacity-70">
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-card border-t flex gap-3">
                <Input
                    placeholder={isAccepted ? "Type a message..." : "Waiting..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 rounded-xl"
                    disabled={!isAccepted || isPaused}
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim() || !isAccepted} className="rounded-xl gradient-primary">
                    <Send className="w-5 h-5" />
                </Button>
            </div>

            {/* Review Modal */}
            {sessionId && peerInfo && (
                <ReviewModal
                    isOpen={showReviewModal}
                    onClose={() => navigate('/user/home')}
                    sessionId={sessionId}
                    consultantName={peerInfo.name}
                    onSuccess={() => navigate('/user/home')}
                />
            )}
        </div>
    );
};

export default UserChatSession;