import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Phone, MapPin, Clock, Smartphone, MessageSquare, Send, ShieldAlert, Mic, Video, Settings, MonitorPlay, Camera } from 'lucide-react';
import { Session, ChatLog, api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface LiveSessionDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: Session;
}

const LiveSessionDetailsModal: React.FC<LiveSessionDetailsModalProps> = ({
    isOpen,
    onClose,
    session,
}) => {
    const [message, setMessage] = useState("");
    const [chatLog, setChatLog] = useState<ChatLog | null>(null);
    const [loadingChat, setLoadingChat] = useState(false);
    const [viewHidden, setViewHidden] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [isEndingSession, setIsEndingSession] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    React.useEffect(() => {
        if (isOpen && session.id && session.mode === 'chat') {
            setLoadingChat(true);
            api.getChatLog(session.id)
                .then(log => setChatLog(log))
                .catch(err => console.error("Failed to fetch chat log", err))
                .finally(() => setLoadingChat(false));
        }
    }, [isOpen, session.id, session.mode]);

    // Handle sending message
    const handleSendMessage = async () => {
        console.log('🟠 handleSendMessage called, message:', message);
        if (!message.trim()) {
            console.log('🟠 Message is empty, returning');
            return;
        }

        setIsSendingMessage(true);
        try {
            console.log('🟠 About to call api.sendMessageInSession with sessionId:', session.id);
            await api.sendMessageInSession(session.id, message);
            console.log('🟠 api.sendMessageInSession succeeded');
            setMessage("");
            // Refresh chat log
            const updatedLog = await api.getChatLog(session.id);
            setChatLog(updatedLog);
        } catch (error) {
            console.error("🟠 Failed to send message:", error);
        } finally {
            console.log('🟠 Setting isSendingMessage to false');
            setIsSendingMessage(false);
        }
    };

    // Handle ending session
    const handleEndSession = async () => {
        console.log('🔵 handleEndSession called for session:', session.id);
        const confirmed = window.confirm("Are you sure you want to end this session? This action cannot be undone.");
        if (!confirmed) {
            console.log('🔵 User cancelled session termination');
            return;
        }

        setIsEndingSession(true);
        console.log('🔵 Setting isEndingSession to true');
        try {
            console.log('🔵 About to call api.endSession with sessionId:', session.id);
            await api.endSession(session.id);
            console.log('🔵 api.endSession succeeded');
            alert("Session ended successfully");
            onClose();
        } catch (error) {
            console.error('🔵 Error ending session:', error);
            alert("Failed to end session. Please try again.");
        } finally {
            console.log('🔵 Setting isEndingSession to false');
            setIsEndingSession(false);
        }
    };

    if (!isOpen) return null;

    // Helper to get initials
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Mock connection quality data matching the design
    const connectionQuality = {
        consultant: { value: 85, label: 'Good' },
        user: { value: 92, label: 'Excellent' },
        overall: { value: 88, label: 'Good' }
    };

    if (session.mode === 'call') {
        return createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300">
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

                {/* Modal Container - Responsive */}
                <div className={`relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full overflow-hidden border border-white/20 z-10 animate-in zoom-in-95 h-[95vh] sm:h-[90vh] lg:h-[88vh] flex flex-col lg:flex-row transition-all duration-500 ease-in-out ${viewHidden ? 'max-w-[580px]' : 'max-w-5xl'}`}>

                    {/* LEFT PANEL - White Info Panel */}
                    <div className={`flex flex-col bg-white overflow-hidden transition-all duration-500 ease-in-out ${viewHidden ? 'w-full h-full' : 'lg:w-[45%] h-1/2 lg:h-full'}`}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-3 border-b border-gray-100 shrink-0">
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-[#111827]">Live Session Details</h2>
                                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tight truncate max-w-[120px] sm:max-w-none">ID: {session.id}</p>
                            </div>
                            <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors p-1 sm:p-1.5 rounded-lg hover:bg-gray-50 border border-gray-100">
                                <X size={18} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 sm:space-y-5 custom-scrollbar">

                            {/* Session Status Banner */}
                            <div className="bg-gray-50/50 rounded-xl p-3 sm:p-4 border border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </div>
                                    <div>
                                        <h3 className="text-[#111827] font-bold text-sm">Session In Progress</h3>
                                        <p className="text-gray-400 text-[10px]">Started {session.duration} ago</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl sm:text-2xl font-black text-[#111827] leading-none">{session.duration}</div>
                                    <span className="text-[9px] text-emerald-600 font-bold uppercase">Duration</span>
                                </div>
                            </div>

                            {/* Participants Grid */}
                            <div className="grid grid-cols-2 gap-4 sm:gap-6">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">CONSULTANT</p>
                                    <div className="flex items-center gap-2.5">
                                        <Avatar className="h-10 w-10 bg-blue-100 text-blue-700 font-bold text-sm">
                                            <AvatarFallback>{getInitials(session.consultant.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-[#111827] text-sm truncate">{session.consultant.name}</h4>
                                            <p className="text-[10px] text-gray-400 truncate">{session.consultant.category}</p>
                                            <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                                Online
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">USER</p>
                                    <div className="flex items-center gap-2.5">
                                        <Avatar className="h-10 w-10 bg-purple-100 text-purple-700 font-bold text-sm">
                                            <AvatarFallback>{getInitials(session.user.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-[#111827] text-sm truncate">{session.user.name}</h4>
                                            <p className="text-[10px] text-gray-400">User ID: USR-{session.user.phone.slice(-4)}</p>
                                            <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                                Online
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Session Information Section */}
                            <div>
                                <h3 className="text-sm font-bold text-[#111827] mb-3">Session Information</h3>
                                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                    <div className="flex gap-2.5 items-start">
                                        <Phone size={16} className="text-gray-400 mt-0.5 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[9px] text-gray-400 uppercase font-medium">Session Type</p>
                                            <p className="font-semibold text-[#111827] text-sm">Video Call</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2.5 items-start">
                                        <Clock size={16} className="text-gray-400 mt-0.5 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[9px] text-gray-400 uppercase font-medium">Started At</p>
                                            <p className="font-semibold text-[#111827] text-sm">{new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} IST</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2.5 items-start">
                                        <span className="text-gray-400 text-base font-bold shrink-0 w-4">₹</span>
                                        <div className="min-w-0">
                                            <p className="text-[9px] text-gray-400 uppercase font-medium">Rate</p>
                                            <p className="font-semibold text-[#111827] text-sm">₹{session.rate}/min</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2.5 items-start">
                                        <span className="text-gray-400 text-base font-bold shrink-0 w-4">₹</span>
                                        <div className="min-w-0">
                                            <p className="text-[9px] text-gray-400 uppercase font-medium">Current Charges</p>
                                            <p className="font-bold text-[#111827] text-sm">₹{session.billed.toFixed(0)}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2.5 items-start">
                                        <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[9px] text-gray-400 uppercase font-medium">User Location</p>
                                            <p className="font-semibold text-[#111827] text-sm">Mumbai, Maharashtra</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2.5 items-start">
                                        <Smartphone size={16} className="text-gray-400 mt-0.5 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[9px] text-gray-400 uppercase font-medium">Device</p>
                                            <p className="font-semibold text-[#111827] text-sm">Mobile App (Android)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Connection Quality */}
                            <div>
                                <h3 className="text-sm font-bold text-[#111827] mb-3">Connection Quality</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { label: 'Consultant', ...connectionQuality.consultant },
                                        { label: 'User', ...connectionQuality.user },
                                        { label: 'Overall', ...connectionQuality.overall }
                                    ].map((item) => (
                                        <div key={item.label} className="space-y-1.5">
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-gray-500">{item.label}</span>
                                                <span className="font-bold text-[#111827]">{item.value}%</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#111827] rounded-full transition-all" style={{ width: `${item.value}%` }}></div>
                                            </div>
                                            <p className="text-[9px] text-gray-400 font-medium">{item.label === 'User' ? 'Excellent' : 'Good'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Admin Controls Notice */}
                            <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl p-4 flex gap-3">
                                <ShieldAlert className="w-5 h-5 text-[#EA580C] flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-[#9A3412] text-sm">Admin Controls</h4>
                                    <p className="text-xs text-[#C2410C] mt-0.5 leading-relaxed">
                                        You can monitor this session in real-time. Use caution when intervening.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Action Bar */}
                        <div className="px-3 sm:px-5 py-3 border-t border-gray-100 bg-white flex items-center gap-2 shrink-0 overflow-x-auto no-scrollbar">
                            <button onClick={handleEndSession} disabled={isEndingSession} className="h-9 px-4 rounded-lg border border-red-200 text-red-500 font-semibold text-xs hover:bg-red-50 disabled:opacity-50 transition-colors shrink-0">
                                {isEndingSession ? "Ending..." : "End Session"}
                            </button>
                            <button onClick={() => setViewHidden(!viewHidden)} className={`h-9 px-4 rounded-lg border font-semibold text-xs transition-colors flex items-center shrink-0 ${viewHidden ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-[#111827] hover:bg-gray-50'}`}>
                                {viewHidden ? 'Show Call View' : 'Hide Call View'}
                            </button>
                            {/* <button className="h-7 px-4 rounded-lg border border-gray-200 text-[#111827] font-semibold text-xs hover:bg-gray-50 transition-colors flex items-center gap-1.5 shrink-0">
                                <Phone size={14} />
                                Call Records
                            </button> */}
                            <button onClick={onClose} className="h-9 px-5 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold text-xs ml-auto transition-colors shrink-0">
                                Close
                            </button>
                        </div>
                    </div>

                    {/* RIGHT PANEL - Dark Call Monitor View (hidden on mobile) */}
                    {!viewHidden && (
                        <div className="hidden lg:flex flex-1 bg-[#121826] flex-col relative animate-in slide-in-from-right duration-500 ease-in-out">
                            {/* Monitor Header */}
                            <div className="px-5 py-4 flex items-center justify-between border-b border-white/5 bg-black/20 shrink-0">
                                <div>
                                    <h2 className="text-base font-bold text-white">Live Call Session</h2>
                                    <p className="text-[10px] text-gray-400">Video Call in Progress</p>
                                </div>
                                <div className="bg-red-500 px-3 py-1 rounded-full flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                    <span className="text-[10px] font-bold text-white uppercase">LIVE</span>
                                </div>
                            </div>

                            {/* Video Monitor Content */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar-dark min-h-0">
                                {/* Consultant Stream */}
                                <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-2xl overflow-hidden border border-white/10">
                                    <div className="aspect-[16/9] flex items-center justify-center relative">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-400/30 flex items-center justify-center text-3xl font-black text-blue-400">
                                            {getInitials(session.consultant.name)}
                                        </div>
                                        <div className="absolute top-3 right-3 bg-[#F59E0B] text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase">good</div>
                                    </div>
                                    <div className="px-4 py-3 bg-black/40 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-white font-semibold text-sm">{session.consultant.name}</span>
                                            <span className="bg-blue-600/30 text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">Consultant</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                                                <Video size={14} className="text-white" />
                                            </button>
                                            <button className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                                                <Mic size={14} className="text-white" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* User Stream */}
                                <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-2xl overflow-hidden border border-white/10">
                                    <div className="aspect-[16/9] flex items-center justify-center relative">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-400/30 flex items-center justify-center text-3xl font-black text-purple-400">
                                            {getInitials(session.user.name)}
                                        </div>
                                        <div className="absolute top-3 right-3 bg-[#10B981] text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase">excellent</div>
                                    </div>
                                    <div className="px-4 py-3 bg-black/40 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-white font-semibold text-sm">{session.user.name}</span>
                                            <span className="bg-purple-600/30 text-purple-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">User</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                                                <Video size={14} className="text-white" />
                                            </button>
                                            <button className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                                                <Mic size={14} className="text-white" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Call Statistics */}
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <h4 className="text-white font-bold text-sm mb-3">Call Statistics</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-[10px] text-gray-400 uppercase mb-1">Bitrate</div>
                                            <div className="text-sm font-bold text-white">2.5 Mbps</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-gray-400 uppercase mb-1">Latency</div>
                                            <div className="text-sm font-bold text-white">24 ms</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-gray-400 uppercase mb-1">Packet Loss</div>
                                            <div className="text-sm font-bold text-white">0.2%</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-gray-400 uppercase mb-1">Frame Rate</div>
                                            <div className="text-sm font-bold text-white">30 fps</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Participants List */}
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <h4 className="text-white font-bold text-sm mb-3">Participants (2)</h4>
                                    <div className="space-y-3">
                                        {/* Consultant */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {getInitials(session.consultant.name)}
                                                </div>
                                                <div>
                                                    <div className="text-white font-semibold text-sm">{session.consultant.name}</div>
                                                    <div className="text-[10px] text-gray-400">Consultant</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                                                    <Video size={14} className="text-white" />
                                                </button>
                                                <button className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                                                    <Mic size={14} className="text-white" />
                                                </button>
                                            </div>
                                        </div>
                                        {/* User */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {getInitials(session.user.name)}
                                                </div>
                                                <div>
                                                    <div className="text-white font-semibold text-sm">{session.user.name}</div>
                                                    <div className="text-[10px] text-gray-400">User</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                                                    <Video size={14} className="text-white" />
                                                </button>
                                                <button className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                                                    <Mic size={14} className="text-white" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Controls */}
                            <div className="bg-black/40 border-t border-white/5 px-5 py-4 shrink-0">
                                <div className="flex items-center justify-center gap-3">
                                    <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
                                        <Settings size={18} />
                                    </button>
                                    <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
                                        <Camera size={18} />
                                    </button>
                                    <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
                                        <Mic size={18} />
                                    </button>
                                    <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
                                        <MonitorPlay size={18} />
                                    </button>
                                    <button className="w-10 h-10 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white flex items-center justify-center transition-colors">
                                        <Phone size={20} className="rotate-[135deg]" strokeWidth={2.5} />
                                    </button>
                                </div>
                                <p className="text-center text-[10px] text-gray-500 mt-3">Admin Monitoring View</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>,
            document.body
        );
    }

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Container - Responsive */}
            <div className={`relative bg-white rounded-xl shadow-2xl w-full overflow-hidden border border-gray-100 z-10 animate-in zoom-in-95 duration-200 h-[95vh] sm:h-[88vh] lg:h-[85vh] flex flex-col lg:flex-row transition-all duration-500 ease-in-out ${viewHidden ? 'max-w-[580px]' : 'max-w-5xl'}`}>

                {/* LEFT PANEL - DETAILS */}
                <div className={`flex flex-col border-b lg:border-b-0 lg:border-r border-gray-100 bg-white transition-all duration-500 ease-in-out h-1/2 lg:h-full ${viewHidden ? 'w-full' : 'lg:w-1/2'}`}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100 shrink-0">
                        <div>
                            <h2 className="text-sm sm:text-base font-bold text-gray-900">Live Session Details</h2>
                            <p className="text-[10px] text-gray-500 truncate max-w-[140px] sm:max-w-none">ID: {session.id}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 lg:hidden">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Scrollable Details Content */}
                    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                        {/* Status Banner */}
                        <div className="bg-emerald-50 rounded-lg p-2 sm:p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </div>
                                <div>
                                    <h3 className="text-gray-900 font-bold text-xs sm:text-sm">In Progress</h3>
                                    <p className="text-gray-500 text-[10px]">Started {session.duration} ago</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-base sm:text-lg font-bold text-gray-900 block leading-none">{session.duration}</span>
                                <span className="text-[9px] text-emerald-600 font-medium uppercase">Duration</span>
                            </div>
                        </div>

                        {/* Participants Row */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <p className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">CONSULTANT</p>
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8 bg-blue-100 text-blue-600 font-bold text-xs">
                                        <AvatarFallback>{getInitials(session.consultant.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-gray-900 text-xs truncate">{session.consultant.name}</h4>
                                        <p className="text-[10px] text-gray-500 truncate">{session.consultant.category}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5">USER</p>
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8 bg-purple-100 text-purple-600 font-bold text-xs">
                                        <AvatarFallback>{getInitials(session.user.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-gray-900 text-xs truncate">{session.user.name}</h4>
                                        <p className="text-[10px] text-gray-500">USR-{session.user.phone.slice(-4)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Session Info Grid - Compact */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <div className="flex gap-2 items-start">
                                <Phone size={14} className="text-gray-400 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[9px] text-gray-500 uppercase">Type</p>
                                    <p className="font-medium text-gray-900 text-xs">{session.mode === 'chat' ? 'Chat' : 'Video'}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 items-start">
                                <Clock size={14} className="text-gray-400 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[9px] text-gray-500 uppercase">Started</p>
                                    <p className="font-medium text-gray-900 text-xs">{new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 items-start">
                                <span className="text-gray-400 text-sm font-bold shrink-0">₹</span>
                                <div className="min-w-0">
                                    <p className="text-[9px] text-gray-500 uppercase">Rate</p>
                                    <p className="font-medium text-gray-900 text-xs">₹{session.rate}/min</p>
                                </div>
                            </div>
                            <div className="flex gap-2 items-start">
                                <span className="text-gray-400 text-sm font-bold shrink-0">₹</span>
                                <div className="min-w-0">
                                    <p className="text-[9px] text-gray-500 uppercase">Billed</p>
                                    <p className="font-bold text-gray-900 text-xs">₹{session.billed.toFixed(0)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Connection Quality - Compact */}
                        <div className="hidden sm:block">
                            <p className="text-[9px] font-semibold text-gray-400 uppercase mb-2">Connection</p>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: 'Consultant', ...connectionQuality.consultant },
                                    { label: 'User', ...connectionQuality.user },
                                    { label: 'Overall', ...connectionQuality.overall }
                                ].map((item) => (
                                    <div key={item.label} className="space-y-1">
                                        <div className="flex justify-between text-[10px] text-gray-500">
                                            <span>{item.label}</span>
                                            <span className="font-bold text-gray-900">{item.value}%</span>
                                        </div>
                                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-gray-900 rounded-full" style={{ width: `${item.value}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-100 bg-white shrink-0 overflow-x-auto no-scrollbar">
                        <Button variant="outline" onClick={handleEndSession} disabled={isEndingSession} className="text-red-500 border-red-200 hover:bg-red-50 h-8 text-xs px-3 shrink-0">
                            {isEndingSession ? "Ending..." : "End Session"}
                        </Button>
                        <Button variant="outline" onClick={() => setViewHidden(!viewHidden)} className={`h-8 text-xs px-3 shrink-0 transition-colors ${viewHidden ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                            {viewHidden ? 'Show Call View' : 'Hide Call View'}
                        </Button>
                        <Button variant="outline" className="text-gray-700 border-gray-200 hover:bg-gray-50 h-8 text-xs px-3 shrink-0 flex items-center gap-1.5">
                            <Phone size={12} />
                            Call Records
                        </Button>
                        <Button onClick={onClose} className="bg-teal-600 hover:bg-teal-700 text-white h-8 text-xs px-4 ml-auto shrink-0 transition-colors">Close</Button>
                    </div>
                </div>

                {/* RIGHT PANEL - CHAT */}
                {!viewHidden && (
                    <div className="flex flex-col bg-gray-50/50 lg:w-1/2 h-1/2 lg:h-full animate-in slide-in-from-right duration-500 ease-in-out">
                        {/* Header */}
                        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100 bg-white shrink-0">
                            <div>
                                <h2 className="text-sm sm:text-base font-bold text-gray-900">Session Chat</h2>
                                <p className="text-[10px] text-gray-500">Real-time conversation</p>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 hidden lg:flex">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar bg-gray-50/30 min-h-0">
                            <div className="flex justify-center">
                                <span className="bg-gray-100 text-gray-500 text-[9px] font-medium px-2 py-0.5 rounded-full uppercase">Session Started</span>
                            </div>

                            {loadingChat ? (
                                <div className="flex justify-center py-4">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600"></div>
                                </div>
                            ) : chatLog?.messages && chatLog.messages.length > 0 ? (
                                chatLog.messages.map((msg, idx) => (
                                    <div key={idx} className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <Avatar className={`h-6 w-6 text-white text-[10px] font-bold shrink-0 ${msg.sender === 'user' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                                            <AvatarFallback>{msg.sender === 'user' ? getInitials(session.user.name) : getInitials(session.consultant.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className={`space-y-0.5 max-w-[75%] ${msg.sender === 'user' ? 'flex flex-col items-end' : ''}`}>
                                            <div className={`${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-900 rounded-tl-none'} rounded-xl px-3 py-2 text-xs shadow-sm`}>
                                                {msg.text}
                                            </div>
                                            <p className="text-[9px] text-gray-400">{msg.time}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-gray-400 text-xs">No messages yet.</div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-2 sm:p-3 bg-white border-t border-gray-100 shrink-0">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a message..."
                                    disabled={isSendingMessage}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-lg pl-3 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
                                />
                                <button onClick={handleSendMessage} disabled={isSendingMessage || !message.trim()} className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-teal-500 hover:bg-teal-600 text-white p-1.5 rounded-md disabled:opacity-50">
                                    <Send size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default LiveSessionDetailsModal;
