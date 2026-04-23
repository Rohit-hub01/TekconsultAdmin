import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Loader2 } from 'lucide-react';
import { api, ChatLog } from '@/lib/api';

interface ChatLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    sessionId: string;
}

const ChatLogModal: React.FC<ChatLogModalProps> = ({ isOpen, onClose, sessionId }) => {
    const [chatLog, setChatLog] = useState<ChatLog | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && sessionId) {
            const fetchChatLog = async () => {
                setIsLoading(true);
                try {
                    const data = await api.getChatLog(sessionId);
                    setChatLog(data);
                } catch (error) {
                    console.error("Error fetching chat log:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchChatLog();
        }
    }, [isOpen, sessionId]);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase();
    };

    const handleExport = () => {
        if (!chatLog) return;

        const headers = ["Time", "Sender", "Message"];
        const rows = chatLog.messages.map(msg => {
            const sender = msg.sender === 'user' ? chatLog.userName : chatLog.consultantName;
            return [msg.time, sender, `"${msg.text.replace(/"/g, '""')}"`];
        });

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `chat_log_${sessionId}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-200 p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b border-slate-100 p-4 flex flex-col sm:flex-row justify-between items-start gap-4 sm:items-center flex-shrink-0">
                    <div className="space-y-1">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">Session Chat Log</h2>
                        <div className="flex flex-wrap items-center gap-1.5 text-[12px] sm:text-[13px] text-slate-500 font-medium">
                            <span>Session ID: {chatLog?.id || sessionId}</span>
                            <span>•</span>
                            <span>Duration: {chatLog?.duration || "..."}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <button
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                            onClick={handleExport}
                            disabled={!chatLog || isLoading}
                        >
                            <Download size={14} className="sm:w-4 sm:h-4" />
                            <span>Export</span>
                        </button>
                        <button
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                            onClick={onClose}
                        >
                            <X size={20} className="sm:w-6 sm:h-6" strokeWidth={1.5} />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 bg-slate-50/30 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                            <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-teal-600" />
                            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 tracking-wide uppercase text-center px-4">Retrieving conversation...</p>
                        </div>
                    ) : chatLog ? (
                        <>
                            {chatLog.messages.map((msg, index) => {
                                if (msg.color === 'system') {
                                    return (
                                        <div key={index} className="flex justify-center py-2">
                                            <div className="bg-slate-200/60 text-slate-600 px-3 sm:px-5 py-2 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide border border-slate-300/30 text-center">
                                                {msg.text}
                                            </div>
                                        </div>
                                    );
                                }

                                const isUser = msg.sender === 'user';
                                const displayName = isUser ? chatLog.userName : chatLog.consultantName;
                                const initials = getInitials(displayName);

                                return (
                                    <div key={index} className={`flex flex-col ${isUser ? 'items-start' : 'items-end'} gap-2 group text-left`}>
                                        {/* Avatar and Name/Time row */}
                                        <div className={`flex items-center gap-2 sm:gap-2.5 ${isUser ? 'flex-row' : 'flex-row-reverse'}`}>
                                            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white shadow-sm ${isUser ? 'bg-purple-500' : 'bg-blue-500'}`}>
                                                {initials}
                                            </div>
                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                <span className="text-[11px] sm:text-[13px] font-bold text-slate-700">{displayName}</span>
                                                <span className="text-[10px] sm:text-[11px] font-medium text-slate-400">{msg.time}</span>
                                            </div>
                                        </div>

                                        {/* Message Bubble */}
                                        <div className={`max-w-[85%] sm:max-w-[75%] px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${isUser
                                            ? 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                                            : 'bg-[#0D9488] text-white rounded-tr-none'
                                            }`}>
                                            <p className="text-[13px] sm:text-[15px] leading-relaxed sm:leading-[1.6] font-medium whitespace-pre-wrap">{msg.text}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-slate-400 font-medium italic">No message history available.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 p-4 sm:p-6 bg-white flex flex-col sm:flex-row items-center gap-4 sm:justify-between flex-shrink-0">
                    <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 sm:gap-6 text-[11px] sm:text-[13px] font-medium">
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <span>Started:</span>
                            <span className="text-slate-900">{chatLog?.startTimeFormatted || "..."}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <span>Ended:</span>
                            <span className="text-slate-900">{chatLog?.endTimeFormatted || "..."}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <span>Messages:</span>
                            <span className="text-slate-900">{chatLog?.messages.length || 0}</span>
                        </div>
                    </div>
                    <button
                        className="w-full sm:w-auto bg-[#0D9488] hover:bg-[#0B7A6F] text-white font-bold px-8 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm transition-all shadow-lg active:scale-95"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>

                <style>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 5px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(0, 0, 0, 0.05);
                        border-radius: 20px;
                    }
                    .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                        background: rgba(0, 0, 0, 0.12);
                    }
                `}</style>
            </div>
        </div>,
        document.body
    );
};

export default ChatLogModal;
