import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle } from 'lucide-react';
import { Dispute } from '@/lib/api';

type RefundType = 'full' | 'partial';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    dispute: Dispute | null;
    onConfirm: (refundData: { type: RefundType, amount: number, reason: string, sendEmail: boolean }) => void;
}

const IssueRefundModal: React.FC<Props> = ({ isOpen, onClose, dispute, onConfirm }) => {
    const [refundType, setRefundType] = useState<RefundType>('full');
    const [partialAmount, setPartialAmount] = useState<string>('');
    const [reason, setReason] = useState('');
    const [sendEmail, setSendEmail] = useState(true);

    // Reset state when modal opens or dispute changes
    useEffect(() => {
        if (isOpen && dispute) {
            setRefundType('full');
            setPartialAmount('');
            setReason('');
            setSendEmail(true);
        }
    }, [isOpen, dispute]);

    if (!isOpen || !dispute) return null;

    const disputedAmount = dispute.amount;
    const refundAmount = refundType === 'full' ? disputedAmount : (parseFloat(partialAmount) || 0);
    const isValidAmount = refundType === 'full' || (refundAmount > 0 && refundAmount <= disputedAmount);
    const isReady = isValidAmount;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isReady) return;
        onConfirm({
            type: refundType,
            amount: refundAmount,
            reason,
            sendEmail
        });
    };

    return createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center animate-in fade-in duration-200 p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl max-h-[95vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 border border-border">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 sm:px-6 py-4 sm:py-5 flex-shrink-0 bg-white">
                    <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">Issue Refund</h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">Process refund for Dispute {dispute.id}</p>
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
                        {/* Dispute Information Card */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 rounded-xl bg-slate-50/80 p-4 sm:p-5 border border-slate-100 shadow-sm text-left">
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 sm:mb-1">User</p>
                                <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{dispute.user}</p>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 sm:mb-1">Consultant</p>
                                <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{dispute.consultant}</p>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 sm:mb-1">Category</p>
                                <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{dispute.category}</p>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 sm:mb-1">Disputed</p>
                                <p className="text-xs sm:text-sm font-bold text-destructive">₹{disputedAmount}</p>
                            </div>
                        </div>

                        {/* Refund Type Selection */}
                        <div className="space-y-2 sm:space-y-3 text-left">
                            <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Refund Type <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <button
                                    type="button"
                                    onClick={() => setRefundType('full')}
                                    className={`flex flex-col items-start rounded-xl border-2 p-3 sm:p-4 text-left transition-all ${refundType === 'full' ? 'border-teal-500 bg-teal-50/30' : 'border-slate-100 bg-slate-50/30 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 sm:gap-3 mb-0.5 sm:mb-1">
                                        <div className={`h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 flex items-center justify-center ${refundType === 'full' ? 'border-teal-500' : 'border-slate-300'}`}>
                                            {refundType === 'full' && <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-teal-500" />}
                                        </div>
                                        <span className="text-sm sm:text-base font-bold text-slate-900">Full Refund</span>
                                    </div>
                                    <p className="text-[11px] sm:text-xs text-slate-500 ml-6 sm:ml-8 font-medium">Refund ₹{disputedAmount}</p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setRefundType('partial')}
                                    className={`flex flex-col items-start rounded-xl border-2 p-3 sm:p-4 text-left transition-all ${refundType === 'partial' ? 'border-teal-500 bg-teal-50/30' : 'border-slate-100 bg-slate-50/30 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 sm:gap-3 mb-0.5 sm:mb-1">
                                        <div className={`h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 flex items-center justify-center ${refundType === 'partial' ? 'border-teal-500' : 'border-slate-300'}`}>
                                            {refundType === 'partial' && <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-teal-500" />}
                                        </div>
                                        <span className="text-sm sm:text-base font-bold text-slate-900">Partial Refund</span>
                                    </div>
                                    <p className="text-[11px] sm:text-xs text-slate-500 ml-6 sm:ml-8 font-medium">Specify custom amount</p>
                                </button>
                            </div>
                        </div>

                        {/* Custom Amount Input for Partial */}
                        {refundType === 'partial' && (
                            <div className="space-y-1 sm:space-y-2 animate-in slide-in-from-top-2 duration-200 text-left">
                                <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Partial Refund Amount (₹)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input
                                        type="number"
                                        max={disputedAmount}
                                        min={1}
                                        value={partialAmount}
                                        onChange={(e) => setPartialAmount(e.target.value)}
                                        placeholder="0"
                                        className={`w-full rounded-xl border bg-white py-2 sm:py-3 pl-8 pr-4 text-sm font-bold focus:outline-none focus:ring-4 ${!isValidAmount && partialAmount ? 'border-red-500 ring-red-500/10' : 'border-slate-200 focus:border-teal-500 focus:ring-teal-500/10'
                                            }`}
                                    />
                                </div>
                                {!isValidAmount && partialAmount && (
                                    <p className="text-[10px] sm:text-xs font-bold text-red-500">Must be ₹1 - ₹{disputedAmount}</p>
                                )}
                            </div>
                        )}

                        {/* Refund Breakdown */}
                        <div className="rounded-xl bg-blue-50/50 border border-blue-100 p-4 sm:p-5 space-y-2 sm:space-y-3 shadow-sm text-left">
                            <h4 className="text-[9px] sm:text-[10px] font-bold text-blue-800 uppercase tracking-widest">Expected Refund Breakdown</h4>
                            <div className="space-y-1.5 sm:space-y-2">
                                <div className="flex justify-between items-center text-xs sm:text-sm">
                                    <span className="text-blue-700 font-medium">Refund to User</span>
                                    <span className="font-bold text-blue-900 sm:text-lg">₹{refundAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs sm:text-sm pt-1.5 sm:pt-2 border-t border-blue-100">
                                    <span className="text-blue-700 font-medium">Deduction from Consultant</span>
                                    <span className="font-bold text-blue-900 sm:text-lg">₹{refundAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Notification Toggle */}
                        <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 sm:p-4 border border-slate-100 text-left">
                            <div className="pt-0.5 sm:pt-1">
                                <input
                                    type="checkbox"
                                    id="sendEmail"
                                    checked={sendEmail}
                                    onChange={() => setSendEmail(!sendEmail)}
                                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                                />
                            </div>
                            <label htmlFor="sendEmail" className="cursor-pointer">
                                <p className="text-xs sm:text-sm font-bold text-slate-800">Send Email Notification</p>
                                <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Notify both parties about resolution</p>
                            </label>
                        </div>

                        {/* Warning Notice */}
                        <div className="flex gap-3 sm:gap-4 rounded-xl border border-amber-100 bg-amber-50/50 p-3 sm:p-4 shadow-sm text-left">
                            <div className="bg-amber-100 rounded-full p-1.5 sm:p-2 h-fit flex-shrink-0">
                                <AlertCircle className="text-amber-600 sm:w-5 sm:h-5" size={16} />
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm font-bold text-amber-900">Important Notice</p>
                                <p className="text-[10px] sm:text-xs text-amber-800/80 leading-relaxed font-medium mt-0.5 sm:mt-1">
                                    Refund will **immediately** close the dispute. Action is **irreversible**.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-2 sm:gap-3 border-t bg-slate-50/50 px-4 sm:px-6 py-4 sm:py-5 flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 sm:flex-none rounded-xl border border-slate-200 bg-white px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!isReady}
                            className={`flex-1 sm:flex-none rounded-xl px-4 sm:px-8 py-2 sm:py-2.5 text-xs sm:text-sm font-bold shadow-md transition-all ${isReady
                                ? 'bg-teal-600 text-white hover:bg-teal-700 active:scale-95'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            Issue Refund
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default IssueRefundModal;
