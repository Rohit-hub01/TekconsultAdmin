import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Check } from 'lucide-react';
import { Dispute } from '@/lib/api';

const REJECTION_REASONS = [
    "Insufficient evidence provided",
    "Service was delivered as agreed",
    "User violated terms of service",
    "Claim outside refund policy timeframe",
    "Duplicate dispute already resolved"
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    dispute: Dispute | null;
    onConfirm: (rejectionData: { reason: string, notes: string }) => void;
}

const RejectDisputeModal: React.FC<Props> = ({ isOpen, onClose, dispute, onConfirm }) => {
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [notes, setNotes] = useState('');

    // Reset state when modal opens or dispute changes
    useEffect(() => {
        if (isOpen && dispute) {
            setSelectedReason(null);
            setNotes('');
        }
    }, [isOpen, dispute]);

    if (!isOpen || !dispute) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReason) return;
        onConfirm({
            reason: selectedReason,
            notes
        });
    };

    return createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center animate-in fade-in duration-200 p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl max-h-[95vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 border border-border">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 sm:px-6 py-4 sm:py-5 flex-shrink-0 bg-white">
                    <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">Reject Dispute</h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">Close dispute DIS-{dispute.id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto scrollbar-thin">
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        {/* Top Warning Banner */}
                        <div className="flex gap-3 sm:gap-4 rounded-xl border border-red-100 bg-red-50/50 p-3 sm:p-4 shadow-sm text-left">
                            <div className="bg-red-100 rounded-full p-1.5 sm:p-2 h-fit flex-shrink-0">
                                <AlertTriangle className="text-red-500 sm:w-5 sm:h-5" size={16} />
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm font-bold text-red-900">Important Decision</p>
                                <p className="text-[10px] sm:text-xs text-red-800/80 leading-relaxed font-medium mt-0.5 sm:mt-1">
                                    No refund will be issued and the consultant will retain the full payment.
                                </p>
                            </div>
                        </div>

                        {/* Dispute Information Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 rounded-2xl bg-slate-50/80 p-4 sm:p-6 border border-slate-100 shadow-inner text-left">
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 sm:mb-1.5">User</p>
                                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{dispute.user}</p>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 sm:mb-1.5">Consultant</p>
                                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{dispute.consultant}</p>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 sm:mb-1.5">Category</p>
                                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{dispute.category}</p>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 sm:mb-1.5">Amount</p>
                                <p className="text-xs sm:text-sm font-bold text-slate-900">₹{dispute.amount}</p>
                            </div>
                        </div>

                        {/* Rejection Reason Selector */}
                        <div className="space-y-2 sm:space-y-3 text-left">
                            <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Select Rejection Reason <span className="text-red-500">*</span></label>
                            <div className="space-y-1.5 sm:space-y-2">
                                {REJECTION_REASONS.map((reason) => (
                                    <button
                                        key={reason}
                                        type="button"
                                        onClick={() => setSelectedReason(reason)}
                                        className={`w-full flex items-center gap-3 sm:gap-4 rounded-xl border px-3 sm:px-5 py-2.5 sm:py-3.5 text-xs sm:text-sm transition-all duration-200 ${selectedReason === reason
                                            ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-sm'
                                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className={`h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedReason === reason ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                                            }`}>
                                            {selectedReason === reason && <div className="h-2 w-2 rounded-full bg-white animate-in fade-in" />}
                                        </div>
                                        <span className={`text-left transition-colors ${selectedReason === reason ? 'font-bold text-indigo-900' : 'font-medium text-slate-600'}`}>
                                            {reason}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Additional Notes */}
                        <div className="space-y-1 sm:space-y-2 text-left">
                            <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Additional Internal Notes</label>
                            <textarea
                                placeholder="Provide context for this rejection..."
                                className="w-full min-h-[100px] sm:min-h-[120px] rounded-xl border border-slate-200 bg-white p-3 sm:p-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-50"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        {/* Resolution Summary Box */}
                        <div className="rounded-xl bg-blue-50/50 border border-blue-100 p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-sm text-left">
                            <h4 className="text-[9px] sm:text-[10px] font-bold text-blue-800 uppercase tracking-widest">Formal Resolution Summary</h4>
                            <div className="grid gap-2 sm:gap-3 text-xs sm:text-sm">
                                {[
                                    "Dispute marked as \"Rejected\"",
                                    `Consultant retains ₹${dispute.amount}`,
                                    "No refund for user",
                                    "Case permanently archived"
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 sm:gap-3 font-medium text-blue-700">
                                        <div className="bg-blue-100 rounded-full p-0.5">
                                            <Check size={12} className="text-blue-600 sm:w-3.5 sm:h-3.5" />
                                        </div>
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Final Warning Notice */}
                        <div className="flex gap-3 sm:gap-4 rounded-xl border border-orange-100 bg-orange-50/50 p-3 sm:p-4 shadow-sm text-left">
                            <div className="bg-orange-100 rounded-full p-1.5 sm:p-2 h-fit flex-shrink-0">
                                <AlertTriangle className="text-orange-600 sm:w-5 sm:h-5" size={16} />
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm font-bold text-orange-900">Action Irreversible</p>
                                <p className="text-[10px] sm:text-xs text-orange-800/80 leading-relaxed font-medium mt-0.5 sm:mt-1">
                                    Once confirmed, this dispute cannot be reopened.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-2 sm:gap-3 border-t bg-slate-50/50 px-4 sm:px-6 py-4 sm:py-5 flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 sm:flex-none rounded-xl border border-slate-200 bg-white px-4 sm:px-7 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedReason}
                            className={`flex-1 sm:flex-none rounded-xl px-4 sm:px-10 py-2 sm:py-2.5 text-xs sm:text-sm font-bold shadow-md transition-all ${selectedReason
                                ? 'bg-slate-900 text-white hover:bg-black active:scale-95'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            Confirm
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default RejectDisputeModal;
