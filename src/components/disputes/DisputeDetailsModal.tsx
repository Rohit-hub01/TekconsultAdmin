import React from "react";
import { createPortal } from "react-dom";
import { X, FileText, Clock } from "lucide-react";
import { Dispute } from "@/lib/api";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    dispute: Dispute | null;
    onAction?: (dispute: Dispute) => void;
    onAssign?: (dispute: Dispute) => void;
};

const DisputeDetailsModal: React.FC<Props> = ({ isOpen, onClose, dispute, onAction, onAssign }) => {
    if (!isOpen || !dispute) return null;

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-3xl rounded-xl bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 mx-4 border border-border">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 sm:px-6 py-4 flex-shrink-0 bg-white">
                    <div>
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Dispute Details</h2>
                        <p className="text-[10px] sm:text-sm text-muted-foreground font-mono">ID: {dispute.id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 flex-grow scrollbar-thin">
                    {/* Status & Priority */}
                    <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                        <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex items-center rounded-full px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold shadow-sm ${dispute.status === 'open' ? 'bg-orange-100 text-orange-700' :
                                dispute.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                <span className={`mr-1 sm:mr-1.5 h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full ${dispute.status === 'open' ? 'bg-orange-500' :
                                    dispute.status === 'resolved' ? 'bg-emerald-500' :
                                        'bg-red-500'
                                    }`} />
                                {dispute.status === 'open' ? 'Pending' : dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)}
                            </span>
                        </div>
                        <div className="flex items-center text-[10px] sm:text-xs text-muted-foreground font-medium">
                            <Clock size={12} className="mr-1 sm:w-3.5 sm:h-3.5" />
                            Created: {dispute.createdDate}
                        </div>
                    </div>

                    {/* Category */}
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 sm:p-4 text-left">
                        <p className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1 sm:mb-1.5">Dispute Category</p>
                        <span className="inline-block rounded-lg bg-blue-600/10 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold text-blue-700 border border-blue-600/20">
                            {dispute.category}
                        </span>
                    </div>

                    {/* Parties */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-left">
                        {/* Complainant */}
                        <div className="rounded-xl border border-slate-100 bg-white p-3 sm:p-4 shadow-sm hover:border-slate-200 transition-colors">
                            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2 sm:mb-3">COMPLAINANT (USER)</p>
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs sm:text-sm flex-shrink-0 shadow-inner">
                                    {dispute.user.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{dispute.user}</p>
                                </div>
                            </div>
                        </div>

                        {/* Consultant */}
                        <div className="rounded-xl border border-slate-100 bg-white p-3 sm:p-4 shadow-sm hover:border-slate-200 transition-colors">
                            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2 sm:mb-3">DEFENDANT (CONSULTANT)</p>
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 text-xs sm:text-sm flex-shrink-0 shadow-inner">
                                    {dispute.consultant.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{dispute.consultant}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Details */}
                    <div className="rounded-xl border border-slate-100 bg-white overflow-hidden shadow-sm text-left">
                        <div className="bg-slate-50/50 px-3 sm:px-4 py-2 border-b border-slate-100">
                            <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Financial Details</h3>
                        </div>
                        <div className="p-3 sm:p-4 grid grid-cols-2 gap-3 sm:gap-6">
                            <div>
                                <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5 sm:mb-1">Amount</p>
                                <p className="text-base sm:text-xl font-bold text-destructive">₹{dispute.amount}</p>
                            </div>
                            <div>
                                <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5 sm:mb-1">Session ID</p>
                                <p className="text-xs sm:text-sm font-mono font-semibold text-slate-700 truncate">{dispute.session}</p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="rounded-xl border border-slate-100 bg-white p-3 sm:p-4 shadow-sm text-left">
                        <h3 className="mb-2 sm:mb-3 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Complaint Description</h3>
                        <div className="rounded-lg bg-orange-50/30 p-2.5 sm:p-3 italic text-xs sm:text-sm text-slate-700 leading-relaxed border-l-4 border-orange-200">
                            "{dispute.description}"
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-3 border-t px-4 sm:px-6 py-4 flex-shrink-0 bg-slate-50/50">
                    <button
                        onClick={onClose}
                        className="flex-1 sm:flex-none order-3 sm:order-1 rounded-lg border border-slate-200 bg-white px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DisputeDetailsModal;
