import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Send } from "lucide-react";
import { NotificationBroadcast } from "@/lib/api";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSend: (data: Partial<NotificationBroadcast>) => void;
};

type Audience = "all" | "consultants" | "active" | "premium";
type Priority = "low" | "normal" | "high" | "urgent";

const SendNotificationModal: React.FC<Props> = ({ isOpen, onClose, onSend }) => {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [audience, setAudience] = useState<Audience>("all");
    const [priority, setPriority] = useState<Priority>("normal");

    if (!isOpen) return null;

    const canSend = title.trim() && message.trim();

    const handleSend = () => {
        if (!canSend) return;
        onSend({
            title,
            message,
            audience: audience === "all" ? "all_users" : audience,
            type: "promotional", // Defaulting to promotional for broadcasts
        });
    };

    return createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center animate-in fade-in duration-200 p-4">
            {/* Backdrop click to close */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 max-h-[95vh] overflow-hidden border border-border">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 flex-shrink-0 bg-white">
                    <div className="text-left">
                        <h2 className="text-xl font-bold text-slate-900">Send New Notification</h2>
                        <p className="text-sm text-slate-500 font-medium">Broadcast message to users or consultants</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto px-6 py-6 space-y-6 flex-grow scrollbar-thin text-left">
                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Notification Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., System Maintenance Alert"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 placeholder:text-slate-300 bg-white text-slate-900"
                        />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Message <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Write your notification message here..."
                            maxLength={500}
                            rows={4}
                            className="w-full resize-none rounded-xl border border-slate-200 p-4 text-sm font-medium outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 scrollbar-thin placeholder:text-slate-300 bg-white text-slate-900"
                        />
                        <div className="flex justify-end">
                            <p className={`text-[10px] font-bold uppercase tracking-tight ${message.length > 450 ? 'text-orange-500' : 'text-slate-400'}`}>
                                {message.length} / 500 characters
                            </p>
                        </div>
                    </div>

                    {/* Target Audience */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Target Audience <span className="text-red-500">*</span>
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <AudienceCard
                                title="All Users"
                                subtitle="1,245 recipients"
                                active={audience === "all"}
                                onClick={() => setAudience("all")}
                            />
                            <AudienceCard
                                title="All Consultants"
                                subtitle="156 recipients"
                                active={audience === "consultants"}
                                onClick={() => setAudience("consultants")}
                            />
                            <AudienceCard
                                title="Active Users"
                                subtitle="892 recipients"
                                active={audience === "active"}
                                onClick={() => setAudience("active")}
                            />
                            <AudienceCard
                                title="Premium Users"
                                subtitle="342 recipients"
                                active={audience === "premium"}
                                onClick={() => setAudience("premium")}
                            />
                        </div>
                    </div>

                    {/* Priority */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Priority Level
                        </label>

                        <div className="flex flex-wrap gap-2">
                            {(["low", "normal", "high", "urgent"] as Priority[]).map(
                                (level) => (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => setPriority(level)}
                                        className={`rounded-xl px-5 py-2 text-sm font-bold capitalize border transition-all
                      ${priority === level
                                                ? "bg-teal-50 border-teal-500 text-teal-700 shadow-sm"
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        {level}
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live Preview</p>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 shadow-inner">
                            <p className="text-sm font-bold text-slate-900">
                                {title || "Notification Title"}
                            </p>
                            <p className="mt-1.5 text-sm font-medium text-slate-600 leading-relaxed">
                                {message || "Your notification message will appear here..."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t bg-slate-50/30 px-6 py-5 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-7 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={!canSend}
                        onClick={handleSend}
                        className={`flex items-center gap-2 rounded-xl px-10 py-2.5 text-sm font-bold text-white transition-all shadow-md active:scale-95
              ${canSend
                                ? "bg-teal-600 hover:bg-teal-700 shadow-teal-500/20"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                            }`}
                    >
                        <Send size={16} />
                        Send Notification
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SendNotificationModal;

/* -------------------------------- */

type CardProps = {
    title: string;
    subtitle: string;
    active?: boolean;
    onClick: () => void;
};

const AudienceCard: React.FC<CardProps> = ({
    title,
    subtitle,
    active,
    onClick,
}) => (
    <button
        type="button"
        onClick={onClick}
        className={`w-full rounded-2xl border p-4 text-left transition-all
      ${active
                ? "border-teal-500 bg-teal-50 ring-4 ring-teal-500/5 shadow-sm"
                : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
            }`}
    >
        <p className={`text-sm font-bold ${active ? 'text-teal-900' : 'text-slate-700'}`}>{title}</p>
        <p className={`text-xs mt-0.5 font-medium ${active ? 'text-teal-700/70' : 'text-slate-400'}`}>{subtitle}</p>
    </button>
);
