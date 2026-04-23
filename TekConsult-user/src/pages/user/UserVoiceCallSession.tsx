import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Clock, Wallet, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { consultantAPI, sessionAPI, API_BASE_URL } from '@/services/api';
import { SessionState } from '@/types/enums';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import * as signalR from '@microsoft/signalr';
import { getEffectiveRate } from '@/lib/pricing';
import VoiceCallManager from '@/components/session/VoiceCallManager';
import ReviewModal from '@/components/session/ReviewModal';

const SIGNALR_BASE = (API_BASE_URL || '').split('/api')[0] || window.location.origin;
const HUB_URL = `${SIGNALR_BASE}/chatHub`;
const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || "YOUR_AGORA_APP_ID";

// Helper to ensure dates from server (UTC) are parsed correctly in local time
const parseServerDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null;
    const normalized = (dateStr.endsWith('Z') || dateStr.includes('+'))
        ? dateStr
        : `${dateStr}Z`;
    return new Date(normalized);
};

const UserVoiceCallSession = () => {
    const { id } = useParams(); // Consultant ID
    const navigate = useNavigate();
    const location = useLocation();
    const { user, updateWalletBalance } = useAuth();

    const [sessionDuration, setSessionDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [isActive, setIsActive] = useState(true);
    const [isAccepted, setIsAccepted] = useState(false);
    const [peerInfo, setPeerInfo] = useState<any>({ name: 'Consultant', rate: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [sessionId, setSessionId] = useState<string | null>(location.state?.sessionId || null);
    const [agoraToken, setAgoraToken] = useState<string | null>(null);
    const [maxAllowedEndTime, setMaxAllowedEndTime] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);

    useEffect(() => {
        console.log("Voice Call Page Mounted", { sessionId });
    }, []);

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

            connection.on("SessionAccepted", (payload: any) => {
                if (!mounted) return;
                console.log("🚀 Call Accepted:", payload);

                const sId = payload?.sessionId || payload?.SessionId;
                if (sId) setSessionId(sId);

                const aToken = payload?.agoraToken || payload?.AgoraToken;
                if (aToken) setAgoraToken(aToken);

                setIsAccepted(true);
                setIsActive(true);

                const maxEnd = payload?.maxAllowedEndTime || payload?.MaxAllowedEndTime;
                if (maxEnd) setMaxAllowedEndTime(maxEnd);

                toast({
                    title: "Call Connected",
                    description: "The consultant has joined the call."
                });

                if (sId || sessionId) {
                    connection.invoke("JoinSession", sId || sessionId).catch(console.error);
                }
            });

            connection.on("SessionEnded", () => {
                if (!mounted) return;
                setIsActive(false);
                setAgoraToken(null);
                setShowReviewModal(true);
                toast({ title: "Call Ended" });
            });

            connection.on("SessionRejected", () => {
                if (!mounted) return;
                console.log("Session rejected by consultant");
                toast({ title: "Call Rejected", variant: "destructive", description: "The consultant rejected the call." });
                navigate("/user/home");
            });

            try {
                await connection.start();
                if (!mounted) return;
                connectionRef.current = connection;
                setIsSignalRConnected(true);

                if (sessionId) {
                    connection.invoke("JoinSession", sessionId).catch(console.error);
                }
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
    // 2. Fetch Data
    // =========================
    useEffect(() => {
        let mounted = true;

        const init = async () => {
            if (!id) {
                console.error("No ID found in params!");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);

            try {
                const data = await consultantAPI.getConsultantById(id);
                if (!mounted) return;

                if (data) {
                    setPeerInfo({
                        id: data.userId,
                        name: `${data.firstName || 'Consultant'} ${data.lastName || ''}`.trim(),
                        avatar: data.profilePhotoUrl
                            ? (data.profilePhotoUrl.startsWith('http') || data.profilePhotoUrl.startsWith('data:')
                                ? data.profilePhotoUrl
                                : `${API_BASE_URL}${data.profilePhotoUrl}`)
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(data.firstName || 'C')}`,
                        rate: getEffectiveRate(data.callRatePerMinute || 0, {
                            isDiscountActive: data.isCallDiscountActive,
                            discountedRate: data.discountedCallRate,
                            discountStart: data.discountStart,
                            discountEnd: data.discountEnd
                        }),
                    });
                }

                if (sessionId) {
                    const sData = await sessionAPI.getSessionById(sessionId);
                    if (!mounted) return;

                    if (sData.state === SessionState.Active) {
                        setIsAccepted(true);
                        setIsActive(true);
                        setAgoraToken(sData.agoraToken);
                        if (sData.appliedRate) {
                            setPeerInfo(prev => prev ? { ...prev, rate: sData.appliedRate } : null);
                        }
                        if (sData.maxAllowedEndTime) setMaxAllowedEndTime(sData.maxAllowedEndTime);

                        if (sData.startTime) {
                            const start = parseServerDate(sData.startTime)?.getTime() || 0;
                            const now = new Date().getTime();
                            setSessionDuration(Math.max(0, Math.floor((now - start) / 1000)));
                        }
                    } else if (sData.state >= 2) {
                        navigate('/user/home');
                    }
                }
            } catch (err) {
                console.error("UserVoiceCall init error:", err);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        init();
        return () => { mounted = false; };
    }, [id, sessionId]);

    // =========================
    // 3. Timers
    // =========================
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && isAccepted && peerInfo) {
            interval = setInterval(() => {
                setSessionDuration(prev => prev + 1);
                if (peerInfo.rate > 0 && (sessionDuration + 1) % 60 === 0) {
                    updateWalletBalance(-peerInfo.rate);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, sessionDuration, isAccepted, peerInfo]);

    useEffect(() => {
        const endTimeDate = parseServerDate(maxAllowedEndTime);
        if (!endTimeDate || !isActive) return;

        const updateTimer = () => {
            const now = new Date();
            const diff = Math.max(0, Math.floor((endTimeDate.getTime() - now.getTime()) / 1000));
            setTimeLeft(diff);

            if (diff <= 0) {
                // Add a small 2-second buffer to allow for network sync
                // before force-ending on the UI to avoid premature closure
                const bufferTimeout = setTimeout(() => {
                    handleEndCall();
                    toast({
                        title: "Session Expired",
                        description: "The allocated time for this session has ended.",
                        variant: "destructive"
                    });
                }, 3000); // 3-second safety buffer
                return () => clearTimeout(bufferTimeout);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [maxAllowedEndTime, isActive]);

    const handleEndCall = async () => {
        if (!sessionId) { navigate('/user/home'); return; }
        try {
            setIsActive(false);
            setAgoraToken(null);
            await sessionAPI.endCallSession(sessionId);
            setShowReviewModal(true);
        } catch (err) {
            console.error("End call error:", err);
            navigate('/user/home');
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (AGORA_APP_ID === "YOUR_AGORA_APP_ID") {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-background p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <PhoneOff className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-xl font-bold mb-2">Voice Call Unavailable</h2>
                <p className="text-muted-foreground mb-6">
                    The Agora App ID is not configured. Please add <code className="bg-muted px-1 rounded">VITE_AGORA_APP_ID</code> to your <code className="bg-muted px-1 rounded">.env</code> file.
                </p>
                <Button onClick={() => navigate('/user/home')}>Go Back</Button>
            </div>
        );
    }

    if (isLoading && !peerInfo) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-[#8B5CF6] text-white">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p className="text-white/70 animate-pulse font-medium">Initializing call...</p>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-[#8B5CF6] text-white relative overflow-hidden font-sans">
            {/* Header / Avatar Section */}
            <div className="flex-1 flex flex-col items-center justify-center pt-12 pb-8">
                {/* Initials Avatar */}
                <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold mb-6 shadow-xl backdrop-blur-sm">
                    {peerInfo?.name ? peerInfo.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : '?'}
                </div>

                <div className="text-center space-y-1 mb-6">
                    <h2 className="text-2xl font-semibold tracking-tight">{peerInfo?.name || "Consultant"}</h2>
                    <p className="text-white/70 text-sm font-medium">
                        {peerInfo ? "Consultant" : "Connecting..."}
                    </p>
                </div>

                {/* Timer Pill */}
                <div className="bg-white/20 backdrop-blur-md px-6 py-1.5 rounded-full text-lg font-mono mb-12 shadow-inner">
                    {formatTime(sessionDuration)}
                </div>

                {/* Voice Visualizer */}
                {isAccepted && agoraToken && sessionId ? (
                    <VoiceCallManager
                        appId={AGORA_APP_ID}
                        channel={sessionId}
                        token={agoraToken}
                        uid={user?.id || ''}
                        onCallEnded={handleEndCall}
                    />
                ) : (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center animate-ping absolute" />
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center relative">
                                <Phone className="w-8 h-8 text-white animate-bounce" />
                            </div>
                        </div>
                        <p className="text-white/60 text-sm font-medium animate-pulse">Ringing...</p>
                    </div>
                )}
            </div>

            {/* Controls Section */}
            <div className="pb-20 flex flex-col items-center gap-8">
                <div className="flex items-center gap-8">
                    {/* Mute Button */}
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md transition-all",
                            isMuted ? "bg-white/40 shadow-lg scale-95" : "bg-white/20 hover:bg-white/30"
                        )}
                    >
                        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>

                    {/* End Call Button */}
                    <button
                        onClick={handleEndCall}
                        className="w-20 h-20 rounded-full bg-[#FF3B30] text-white flex items-center justify-center shadow-2xl hover:bg-[#FF453A] active:scale-95 transition-all"
                    >
                        <Phone className="w-10 h-10 rotate-[135deg]" />
                    </button>

                    {/* Speaker Button */}
                    <button
                        onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                        className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md transition-all",
                            !isSpeakerOn ? "bg-white/40 shadow-lg scale-95" : "bg-white/20 hover:bg-white/30"
                        )}
                    >
                        {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                    </button>
                </div>

                {/* Chat Button */}
                <button
                    onClick={() => navigate(`/user/chat/${id}`, { state: { sessionId } })}
                    className="flex flex-col items-center gap-1 group"
                >
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-all">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-white/80">Chat</span>
                </button>
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

export default UserVoiceCallSession;
