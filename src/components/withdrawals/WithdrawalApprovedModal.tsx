import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface WithdrawalApprovedModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount?: number;
}

const WithdrawalApprovedModal: React.FC<WithdrawalApprovedModalProps> = ({
    isOpen,
    onClose,
    amount = 15000,
}) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 4000);

            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-md rounded-xl bg-white p-6 text-center shadow-lg animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Icon */}
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <svg
                        className="h-8 w-8 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>

                {/* Title */}
                <h2 className="mb-2 text-xl font-semibold text-gray-900">
                    Withdrawal Approved!
                </h2>

                {/* Description */}
                <p className="text-sm text-gray-600">
                    Payment of ₹{amount.toLocaleString()} has been approved and will be
                    processed shortly.
                </p>
            </div>
        </div>,
        document.body
    );
};

export default WithdrawalApprovedModal;
