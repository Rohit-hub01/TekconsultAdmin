import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, AlertTriangle, Check } from 'lucide-react';

export interface WithdrawalData {
    consultant: string;
    amountRequested: number;
    bankAccount: string;
    netPayable: number;
    platformFeeAndTDS: string;
}

interface ApproveWithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApprove: (notes: string) => void;
    withdrawalData: WithdrawalData;
}

const ApproveWithdrawalModal: React.FC<ApproveWithdrawalModalProps> = ({
    isOpen,
    onClose,
    onApprove,
    withdrawalData,
}) => {
    const [adminNotes, setAdminNotes] = useState('');

    if (!isOpen) return null;

    const handleApprove = () => {
        onApprove(adminNotes);
    };

    const verificationItems = [
        'Consultant has sufficient balance',
        'Bank details are verified and correct',
        'No pending disputes or violations',
        'KYC documents are approved',
    ];

    return createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col border border-border animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-border bg-gray-50/50 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Approve Withdrawal
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Confirm payment approval
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 hover:[&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {/* Withdrawal Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-border">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                            Withdrawal Summary
                        </h3>

                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Consultant</span>
                            <span className="text-sm font-medium text-gray-900">
                                {withdrawalData.consultant}
                            </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Amount Requested</span>
                            <span className="text-sm font-medium text-gray-900">
                                ₹{withdrawalData.amountRequested.toLocaleString('en-IN')}
                            </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Bank Account</span>
                            <span className="text-sm font-medium text-gray-900 font-mono text-xs">
                                {withdrawalData.bankAccount}
                            </span>
                        </div>

                        <div className="pt-3 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-sm font-semibold text-gray-900">
                                        Net Payable
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {withdrawalData.platformFeeAndTDS}
                                    </div>
                                </div>
                                <span className="text-lg font-bold text-green-600">
                                    ₹{withdrawalData.netPayable.toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Verification Checklist */}
                    <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-2 mb-3">
                            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                            <span className="text-sm font-medium text-blue-900">
                                Before Approving, Verify:
                            </span>
                        </div>
                        <ul className="space-y-2 ml-6">
                            {verificationItems.map((item, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-blue-800">
                                    <Check size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Admin Notes */}
                    <div>
                        <label
                            htmlFor="admin-notes"
                            className="block text-sm font-medium text-gray-900 mb-2"
                        >
                            Admin Notes (Optional)
                        </label>
                        <textarea
                            id="admin-notes"
                            rows={4}
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Add any internal notes about this approval..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none focus:ring-opacity-50"
                        />
                    </div>

                    {/* Important Notice */}
                    <div className="bg-orange-50/50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="text-orange-600 flex-shrink-0 mt-0.5" size={18} />
                            <div>
                                <div className="text-sm font-medium text-orange-900 mb-1">
                                    Important
                                </div>
                                <p className="text-sm text-orange-800">
                                    This action will initiate the payment process. The amount will be
                                    transferred within 2-3 business days.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-gray-50/50 mt-auto flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApprove}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                    >
                        Confirm & Approve
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ApproveWithdrawalModal;
