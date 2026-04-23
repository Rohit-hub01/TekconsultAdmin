import { createPortal } from "react-dom";
import { X, AlertCircle, Info } from "lucide-react";
import { useState } from "react";

type ReactivateConsultantModalProps = {
    open: boolean;
    onClose: () => void;
    onReactivate: (data: {
        reason: string;
        checklist: {
            kycVerified: boolean;
            noViolations: boolean;
            termsAccepted: boolean;
        };
    }) => void;
    consultant: {
        id: string | number;
        name: string;
        email: string;
        initials: string;
        category: string;
        suspensionDate?: string; // Optional if available
    } | null;
    isSubmitting?: boolean;
};

export default function ReactivateConsultantModal({
    open,
    onClose,
    onReactivate,
    consultant,
    isSubmitting = false,
}: ReactivateConsultantModalProps) {
    const [kycVerified, setKycVerified] = useState(false);
    const [noViolations, setNoViolations] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [reason, setReason] = useState("");

    if (!open || !consultant) return null;

    const canSubmit =
        kycVerified && noViolations && termsAccepted && reason.trim().length > 0;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200 p-4">
            {/* Backdrop click to close */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            <div className="relative w-full max-w-xl bg-white rounded-xl shadow-lg scale-100 animate-in zoom-in-95 duration-200 border border-border overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0 bg-white">
                    <div className="text-left">
                        <h2 className="text-sm font-semibold">
                            Reactivate Consultant Account
                        </h2>
                        <p className="text-xs text-gray-500">
                            Review and approve reactivation for {consultant.name}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Warning */}
                    <div className="flex gap-3 p-4 rounded-lg bg-orange-50 text-orange-700 text-sm text-left">
                        <AlertCircle className="w-5 h-5 mt-0.5" />
                        <div>
                            <p className="font-medium">Account Currently Suspended</p>
                            <p className="text-xs mt-1">
                                {consultant.suspensionDate
                                    ? `This account was suspended on ${consultant.suspensionDate}. `
                                    : "This account is currently suspended. "}
                                Please verify all conditions before reactivating.
                            </p>
                        </div>
                    </div>

                    {/* Consultant Info */}
                    <div className="text-left">
                        <h3 className="text-sm font-semibold mb-3">
                            Consultant Information
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4 text-sm">
                            <InfoItem label="Name" value={consultant.name} />
                            <InfoItem label="Consultant ID" value={`#${consultant.id}`} />
                            <InfoItem label="Email" value={consultant.email} />
                            <InfoItem label="Category" value={consultant.category} />
                        </div>
                    </div>

                    {/* Checklist */}
                    <div className="text-left">
                        <h3 className="text-sm font-semibold mb-3">
                            Reactivation Checklist <span className="text-red-500 text-xs font-normal ml-1">(Required)</span>
                        </h3>

                        <div className="space-y-3 text-sm">
                            <ChecklistItem
                                checked={kycVerified}
                                onChange={setKycVerified}
                                label="KYC Documents Verified"
                                description="All identity and professional documents have been reviewed and approved"
                            />
                            <ChecklistItem
                                checked={noViolations}
                                onChange={setNoViolations}
                                label="No Outstanding Violations"
                                description="Previous issues have been resolved and consultant has agreed to follow guidelines"
                            />
                            <ChecklistItem
                                checked={termsAccepted}
                                onChange={setTermsAccepted}
                                label="Terms & Conditions Acknowledgment"
                                description="Consultant has been informed and agreed to updated terms and conditions"
                            />
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="text-left">
                        <label className="block text-sm font-medium mb-1">
                            Reactivation Reason <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            placeholder="Provide a detailed reason for reactivating this account..."
                            className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                        <p className="mt-1 text-xs text-gray-400">
                            This will be logged in the consultant’s activity history
                        </p>
                    </div>

                    {/* Info Box */}
                    <div className="flex gap-3 p-4 rounded-lg bg-blue-50 text-blue-700 text-sm text-left">
                        <Info className="w-5 h-5 mt-0.5" />
                        <div className="text-xs space-y-1">
                            <p className="font-medium">What happens after reactivation?</p>
                            <ul className="list-disc list-inside">
                                <li>Account status will change to Active</li>
                                <li>Consultant can immediately start accepting sessions</li>
                                <li>Email notification will be sent to the consultant</li>
                                <li>Action will be logged in admin activity history</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 py-4 border-t flex-shrink-0 bg-white">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="w-1/2 px-4 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={!canSubmit || isSubmitting}
                        onClick={() =>
                            onReactivate({
                                reason,
                                checklist: {
                                    kycVerified,
                                    noViolations,
                                    termsAccepted,
                                },
                            })
                        }
                        className="w-1/2 px-4 py-2 text-sm rounded-md bg-teal-600 text-white
                       hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? "Reactivating..." : "Reactivate Account"}
                    </button>
                </div>
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
        </div>,
        document.body
    );
}

/* ---------- Helpers ---------- */

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-0.5 truncate font-medium">{value}</p>
        </div>
    );
}

function ChecklistItem({
    checked,
    onChange,
    label,
    description,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    description: string;
}) {
    return (
        <label className="flex gap-3 cursor-pointer group">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="mt-1 text-teal-600 focus:ring-teal-500 accent-teal-600"
            />
            <div>
                <p className="font-medium group-hover:text-teal-700 transition-colors">{label}</p>
                <p className="text-xs text-gray-500">{description}</p>
            </div>
        </label>
    );
}
