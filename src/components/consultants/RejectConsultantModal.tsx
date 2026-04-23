import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

type RejectConsultantModalProps = {
    open: boolean;
    onClose: () => void;
    onReject: (reason: string) => void;
    consultant: {
        id: string | number;
        name: string;
        email: string;
        initials: string;
        category: string;
    } | null;
    isSubmitting?: boolean;
};

const REASONS = [
    "Incomplete documentation",
    "Insufficient qualifications",
    "Failed verification process",
    "Does not meet category requirements",
    "Policy violation",
    "Other",
];

export function RejectConsultantModal({
    open,
    onClose,
    onReject,
    consultant,
    isSubmitting = false
}: RejectConsultantModalProps) {
    const [customReason, setCustomReason] = useState<string>("");
    const [selectedReason, setSelectedReason] = useState<string>("");

    // Reset reason when modal opens/closes
    useEffect(() => {
        if (open) {
            setSelectedReason("");
            setCustomReason("");
        }
    }, [open]);

    if (!open || !consultant) return null;

    const handleReject = () => {
        const finalReason = selectedReason === "Other" ? customReason : selectedReason;
        if (finalReason.trim()) {
            onReject(finalReason);
        }
    };

    const isReasonValid = selectedReason && (selectedReason !== "Other" || customReason.trim().length > 0);

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200 p-4">
            {/* Backdrop click to close */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            <div className="relative w-full max-w-md bg-white rounded-xl shadow-lg scale-100 animate-in zoom-in-95 duration-200 border border-border max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b shrink-0 bg-white">
                    <h2 className="text-sm font-semibold">Reject Consultant</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-4 sm:px-6 py-5 sm:py-6 space-y-5 sm:space-y-6 overflow-y-auto custom-scrollbar">
                    {/* Icon */}
                    <div className="flex justify-center">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 flex items-center justify-center">
                            <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold truncate px-2 text-slate-900 text-left sm:text-center">
                            Reject {consultant.name}?
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm text-gray-500 font-medium text-left sm:text-center">
                            The consultant will be notified about the rejection with the reason provided below.
                        </p>
                    </div>

                    {/* Consultant Card */}
                    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg text-left">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-teal-500 text-white flex items-center justify-center font-semibold text-xs sm:text-sm shrink-0">
                            {consultant.initials}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold truncate text-slate-900">{consultant.name}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 truncate">{consultant.email}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] sm:text-xs rounded-full bg-blue-100 text-blue-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                                {consultant.category}
                            </span>
                        </div>
                    </div>

                    {/* Rejection Reasons */}
                    <div className="text-left">
                        <p className="text-xs sm:text-sm font-bold mb-2">
                            Select Rejection Reason <span className="text-red-500">*</span>
                        </p>

                        <div className="space-y-1.5 sm:space-y-2">
                            {REASONS.map((reason) => (
                                <div key={reason}>
                                    <label
                                        className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer hover:bg-gray-50 p-1.5 sm:p-2 rounded-md transition-colors"
                                    >
                                        <input
                                            type="radio"
                                            name="reject-reason"
                                            value={reason}
                                            checked={selectedReason === reason}
                                            onChange={() => setSelectedReason(reason)}
                                            className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 focus:ring-red-500 accent-red-600"
                                        />
                                        <span className={selectedReason === reason ? "font-bold" : "font-medium"}>{reason}</span>
                                    </label>
                                    {reason === "Other" && selectedReason === "Other" && (
                                        <textarea
                                            value={customReason}
                                            onChange={(e) => setCustomReason(e.target.value)}
                                            placeholder="Please describe the reason..."
                                            className="w-full mt-2 p-2 sm:p-3 text-xs sm:text-sm border rounded-md focus:ring-2 focus:ring-red-500 outline-none resize-none bg-white"
                                            rows={2}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="flex gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-[10px] sm:text-xs text-left">
                        <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 shrink-0" />
                        <p className="font-medium">
                            This action cannot be undone. The consultant will be notified via email.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 px-4 sm:px-6 py-4 border-t shrink-0 bg-white">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="w-full sm:w-1/2 order-2 sm:order-1 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={!isReasonValid || isSubmitting}
                        onClick={handleReject}
                        className="w-full sm:w-1/2 order-1 sm:order-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg bg-red-500 text-white
                       hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                       flex items-center justify-center gap-2 shadow-sm"
                    >
                        {isSubmitting ? "Rejecting..." : "Reject"}
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
}

export default RejectConsultantModal;
