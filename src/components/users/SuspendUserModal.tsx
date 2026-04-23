import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Ban, Loader2 } from 'lucide-react';
import { User } from '@/lib/api';

interface SuspendUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onConfirm: (id: string | number) => void;
}

const SuspendUserModal: React.FC<SuspendUserModalProps> = ({ isOpen, onClose, user, onConfirm }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !user) return null;

    const warningItems = [
        "User account and profile",
        `Wallet balance (₹${user.walletBalance.toLocaleString()})`,
        `All session history (${user.totalSessions} sessions)`,
        "Payment methods and transaction records",
        "Reviews and ratings given by this user"
    ];

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await onConfirm(user.id);
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 font-sans p-4 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-md max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">

                {/* Close Button Header */}
                <div className="flex justify-between items-center px-4 py-3 border-b border-slate-50 flex-shrink-0">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">Suspend User</h2>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-30"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-grow overflow-y-auto px-4 sm:px-6 py-4 scrollbar-thin">
                    <div className="flex flex-col items-center text-center">
                        {/* Top Ban Icon */}
                        <div className="mb-4 sm:mb-6 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-red-50">
                            <Ban size={24} className="sm:w-[30px] sm:h-[30px] text-red-500 opacity-80" strokeWidth={1.5} />
                        </div>

                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 line-clamp-1 px-2">Suspend {user.fullName}?</h3>
                        <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed px-2">
                            This will deactivate the user's account and restrict their access. You can reactivate them at any time from the dashboard.
                        </p>

                        {/* User Profile Card */}
                        <div className="mt-5 sm:mt-6 w-full flex items-center gap-3 sm:gap-4 rounded-xl bg-slate-50 p-3 text-left border border-slate-100">
                            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-[#00c2a7] text-white font-bold text-base sm:text-lg flex-shrink-0">
                                {user.initials}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-sm sm:text-base text-slate-900 truncate">{user.fullName}</p>
                                <p className="text-[10px] sm:text-xs text-slate-500 truncate">{user.phone}</p>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{user.totalSessions} sessions • ₹{user.totalSpend.toLocaleString()} spend</p>
                            </div>
                        </div>

                        {/* Warning Box */}
                        <div className="mt-5 sm:mt-6 w-full rounded-xl border border-red-100 bg-red-50/30 p-4 sm:p-5 text-left">
                            <div className="flex items-center gap-2 text-red-800 mb-2 sm:mb-3">
                                <AlertTriangle size={16} />
                                <span className="text-[12px] sm:text-sm font-bold">Suspension will restrict:</span>
                            </div>
                            <ul className="space-y-1.5 ml-6 sm:ml-7">
                                {warningItems.map((item, idx) => (
                                    <li key={idx} className="text-[12px] sm:text-sm text-red-800/80 list-disc marker:text-red-400">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-4 sm:px-6 pb-6 pt-2 flex flex-col sm:flex-row w-full gap-2 sm:gap-3 flex-shrink-0 bg-white border-t border-slate-50">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="w-full sm:flex-1 order-2 sm:order-1 rounded-xl bg-slate-100 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors shadow-sm disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="w-full sm:flex-1 order-1 sm:order-2 rounded-xl bg-[#f88686] py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white hover:bg-red-500 transition-all shadow-md active:scale-95 disabled:bg-slate-400 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Suspending</span>
                            </>
                        ) : (
                            "Suspend User"
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SuspendUserModal;
