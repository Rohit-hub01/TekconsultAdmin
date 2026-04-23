import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Clock, Wallet, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { chatAPI, sessionAPI, userAPI, API_BASE_URL } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import * as signalR from '@microsoft/signalr';
import VoiceCallManager from '@/components/session/VoiceCallManager';

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

const ConsultantVoiceCallSession = () => {
    const { id } = useParams(); // Client ID
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [sessionDuration, setSessionDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [isActive, setIsActive] = useState(true);
    const [peerInfo, setPeerInfo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sessionId, setSessionId] = useState<string | null>(location.state?.sessionId || null);
    const [agoraToken, setAgoraToken] = useState<string | null>(null);

    const connectionRef = useRef<signalR.HubConnection | null>(null);

    useEffect(() => {
        let mounted = true;
        let connection: signalR.HubConnection | null = null;

        const startConnection = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            const signalBase = (API_BASE_URL || '').split('/api')[0] || window.location.origin;
            connection = new signalR.HubConnectionBuilder()
                .withUrl(`${signalBase}/chatHub`, { accessTokenFactory: () => token })
                .withAutomaticReconnect()
                .build();

            connection.on("SessionEnded", () => {
                if (!mounted) return;
                setIsActive(false);
                setAgoraToken(null);
                toast({ title: "Call Ended" });
                navigate('/consultant/dashboard');
            });

            try {
                await connection.start();
                if (!mounted) return;
                connectionRef.current = connection;
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
        };
    }, []);

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            if (!id) return;
            setIsLoading(true);

            try {
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

                if (sessionId) {
                    const sData = await sessionAPI.getSessionById(sessionId);
                    if (!mounted) return;

                    if (sData.agoraToken) {
                        setAgoraToken(sData.agoraToken);
                    }

                    if (sData.startTime) {
                        const start = parseServerDate(sData.startTime)?.getTime() || 0;
                        const now = new Date().getTime();
                        setSessionDuration(Math.max(0, Math.floor((now - start) / 1000)));
                    }

                    if (sData.state >= 2) {
                        navigate('/consultant/dashboard');
                    }
                }
            } catch (err) {
                console.error("ConsultantVoiceCall init error:", err);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        init();
        return () => { mounted = false; };
    }, [id, sessionId]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && peerInfo) {
            interval = setInterval(() => {
                setSessionDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, peerInfo]);

    const handleEndCall = async () => {
        if (!sessionId) { navigate('/consultant/dashboard'); return; }
        try {
            setIsActive(false);
            setAgoraToken(null);
            await sessionAPI.endCallSession(sessionId);
            navigate('/consultant/dashboard');
        } catch (err) {
            console.error("End call error:", err);
            navigate('/consultant/dashboard');
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" /></div>;
    if (!peerInfo) return <div className="h-screen flex items-center justify-center text-foreground">User not found</div>;

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
                <Button onClick={() => navigate('/consultant/dashboard')}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-[#8B5CF6] text-white relative overflow-hidden font-sans">
            {/* Header / Avatar Section */}
            <div className="flex-1 flex flex-col items-center justify-center pt-12 pb-8">
                {/* Initials Avatar */}
                <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold mb-6 shadow-xl backdrop-blur-sm">
                    {peerInfo.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </div>

                <div className="text-center space-y-1 mb-6">
                    <h2 className="text-2xl font-semibold tracking-tight">{peerInfo.name}</h2>
                    <p className="text-white/70 text-sm font-medium">User</p>
                </div>

                {/* Timer Pill */}
                <div className="bg-white/20 backdrop-blur-md px-6 py-1.5 rounded-full text-lg font-mono mb-12 shadow-inner">
                    {formatTime(sessionDuration)}
                </div>

                {/* Voice Visualizer */}
                {agoraToken && (
                    <VoiceCallManager
                        appId={AGORA_APP_ID}
                        channel={sessionId!}
                        token={agoraToken}
                        uid={user?.id || ''}
                        onCallEnded={handleEndCall}
                    />
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
                    onClick={() => navigate(`/consultant/chat/${id}`, { state: { sessionId } })}
                    className="flex flex-col items-center gap-1 group"
                >
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-all">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-white/80">Chat</span>
                </button>
            </div>
        </div>
    );
};

export default ConsultantVoiceCallSession;
