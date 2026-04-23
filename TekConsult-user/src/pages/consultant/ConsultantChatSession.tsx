import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, Phone, Clock, Wallet, Pause, Play, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../../contexts/AuthContext';
import { chatAPI, sessionAPI, userAPI, API_BASE_URL } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import * as signalR from '@microsoft/signalr';

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

const ConsultantChatSession = () => {
    const { id } = useParams(); // This is the userId (client's ID)
    const navigate = useNavigate();
    const location = useLocation();
    const { user, consultant } = useAuth(); // Destructure consultant as well

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sessionDuration, setSessionDuration] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [peerInfo, setPeerInfo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sessionId, setSessionId] = useState<string | null>(location.state?.sessionId || null);
    const [conversationId, setConversationId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const connectionRef = useRef<signalR.HubConnection | null>(null);

    // 📊 1. Initialize SignalR Connection (Only once)
    useEffect(() => {
        let mounted = true;
        let connection: signalR.HubConnection | null = null;

        const setupConnection = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            connection = new signalR.HubConnectionBuilder()
                .withUrl(HUB_URL, { accessTokenFactory: () => token })
                .withAutomaticReconnect()
                .build();

            // Register handlers BEFORE start
            connection.on("ReceiveMessage", (msg: any) => {
                if (!mounted) return;
                console.log("📩 ConsultantChat: Message received via SignalR:", msg);

                let text = typeof msg === 'string' ? msg : msg.messageText || msg.text || msg.content || JSON.stringify(msg);
                let senderId = typeof msg === 'string' ? null : (msg.senderId || msg.SenderId);
                const myId = localStorage.getItem('userId');
                const isMe = String(senderId || '').toLowerCase() === String(myId || '').toLowerCase();
                let senderRole: 'user' | 'consultant' = isMe ? 'consultant' : 'user';
                let msgId = typeof msg === 'string' ? `${Date.now()}` : (msg.messageId || msg.id || msg.MessageId || `${Date.now()}`);

                const formattedMsg: Message = {
                    id: msgId,
                    text,
                    sender: senderRole,
                    timestamp: new Date(),
                };

                setMessages(prev => {
                    const isDuplicate = prev.some(m =>
                        (m.id === formattedMsg.id && formattedMsg.id) ||
                        (m.text === formattedMsg.text && m.sender === formattedMsg.sender &&
                            Math.abs(m.timestamp.getTime() - formattedMsg.timestamp.getTime()) < 2000)
                    );
                    if (isDuplicate) return prev;
                    return [...prev, formattedMsg];
                });
            });

            connection.on("SessionEnded", (msg: any) => {
                if (!mounted) return;
                setIsActive(false);
                toast({ title: "Session Ended" });
                navigate('/consultant/dashboard');
            });

            try {
                await connection.start();
                console.log("🔌 ConsultantChat: SignalR Connected");
                if (mounted) {
                    connectionRef.current = connection;
                    if (conversationId) {
                        console.log("🚪 ConsultantChat: Joining conversation on connect:", conversationId);
                        await connection.invoke("JoinConversation", conversationId);
                    }
                    if (sessionId) {
                        console.log("🚪 ConsultantChat: Joining session on connect:", sessionId);
                        await connection.invoke("JoinSession", sessionId);
                    }
                }
            } catch (err) {
                console.error("SignalR Connection Error:", err);
            }
        };

        setupConnection();

        return () => {
            mounted = false;
            if (connection) {
                connection.stop();
                connectionRef.current = null;
            }
        };
    }, [user?.id]);

    // 🚪 2. Handle Joining Session
    useEffect(() => {
        if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
            if (conversationId) {
                console.log("🚪 ConsultantChat: Joining conversation due to ID update:", conversationId);
                connectionRef.current.invoke("JoinConversation", conversationId).catch(console.error);
            }
            if (sessionId) {
                console.log("🚪 ConsultantChat: Joining session due to ID update:", sessionId);
                connectionRef.current.invoke("JoinSession", sessionId).catch(console.error);
            }
        }
    }, [sessionId, conversationId]);

    // 📄 3. Fetch Data & Recover Session
    useEffect(() => {
        let mounted = true;
        const initData = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                // Fetch Client Info
                const userData = await userAPI.getUserById(id);
                if (!mounted) return;
                setPeerInfo({
                    id: userData.userId,
                    name: `${userData.firstName} ${userData.lastName || ''}`.trim(),
                    avatar: userData.profilePhotoUrl
                        ? (userData.profilePhotoUrl.startsWith('http') || userData.profilePhotoUrl.startsWith('data:')
                            ? userData.profilePhotoUrl
                            : `${API_BASE_URL}${userData.profilePhotoUrl}`)
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.firstName)}`,
                });

                // 1. Get/Create Conversation
                // id is client's userId (peer)
                const conv = await chatAPI.getOrCreateConversation(id!);
                if (!mounted) return;
                setConversationId(conv.id);

                // 2. Load History for the conversation
                const history = await chatAPI.getConversationMessages(conv.id);
                if (mounted && history?.length) {
                    setMessages(history.map((m: any) => ({
                        id: m.messageId || m.id,
                        text: m.content || m.messageText || m.text,
                        sender: (String(m.senderId || m.SenderId || '').toLowerCase() === String(localStorage.getItem('userId') || '').toLowerCase()) ? 'consultant' : 'user',
                        timestamp: parseServerDate(m.timestamp || m.sentAt) as Date,
                    })));
                }

                // 3. Recover Session ID
                let activeSid = sessionId;
                if (!activeSid) {
                    const [requests, response] = await Promise.all([
                        sessionAPI.getRequests(),
                        sessionAPI.getUserHistory(0, 10)
                    ]);

                    const activeSession = [...requests, ...response.sessions].find(s =>
                        s.state < 2 && (s.userId === id || s.consultantId === user?.id)
                    );

                    if (activeSession && mounted) {
                        activeSid = activeSession.sessionId;
                        setSessionId(activeSid);
                    }
                }

                // Load Session Stats
                if (activeSid) {
                    const sData = await sessionAPI.getSessionById(activeSid);
                    if (mounted) {
                        // Recover session duration
                        if (sData.startTime) {
                            const startTimeDate = parseServerDate(sData.startTime);
                            if (startTimeDate) {
                                const start = startTimeDate.getTime();
                                const now = new Date().getTime();
                                setSessionDuration(Math.max(0, Math.floor((now - start) / 1000)));
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("ConsultantChat Init Error:", err);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        initData();
        return () => { mounted = false; };
    }, [id, user?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && !isPaused && peerInfo) {
            interval = setInterval(() => {
                setSessionDuration((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, isPaused, peerInfo]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !conversationId) return;
        try {
            // ✅ Send message via SignalR - it will be broadcast back via SignalR
            if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
                await connectionRef.current.invoke("SendMessageToConversation", conversationId, newMessage.trim(), sessionId);
                setNewMessage('');
            } else {
                throw new Error("SignalR not connected");
            }
        } catch (error) {
            console.error('Send error:', error);
            toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
        }
    };

    const handleEndSession = async () => {
        if (!sessionId) {
            navigate('/consultant/dashboard');
            return;
        }
        try {
            setIsActive(false);
            await chatAPI.endSession(sessionId);
            navigate('/consultant/dashboard');
        } catch (error) {
            console.error('End session error:', error);
            navigate('/consultant/dashboard');
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!peerInfo) return <div className="h-screen flex items-center justify-center">User not found</div>;

    return (
        <div className="h-screen flex flex-col bg-background">
            <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></button>
                <img src={peerInfo.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                <div className="flex-1">
                    <h2 className="font-semibold">{peerInfo.name}</h2>
                    <p className="text-xs text-success">Active Session</p>
                </div>
                <Button variant="destructive" size="sm" onClick={handleEndSession} className="rounded-lg">
                    <X className="w-4 h-4 mr-1" /> End
                </Button>
            </div>

            <div className="bg-primary/5 border-b border-border px-4 py-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{formatTime(sessionDuration)}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsPaused(!isPaused)}>
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div key={message.id} className={cn('flex', message.sender === 'consultant' ? 'justify-end' : 'justify-start')}>
                        <div className={cn('max-w-[80%] px-4 py-3 rounded-2xl', message.sender === 'consultant' ? 'gradient-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm')}>
                            <p>{message.text}</p>
                            <p className="text-[10px] mt-1 opacity-70">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-card border-t flex gap-3">
                <Input placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} className="flex-1 rounded-xl" />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="rounded-xl gradient-primary"><Send className="w-5 h-5" /></Button>
            </div>
        </div>
    );
};

export default ConsultantChatSession;
