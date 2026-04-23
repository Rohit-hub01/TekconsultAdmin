import React from 'react';
import { createPortal } from 'react-dom';
import { X, User, CreditCard, Building2, FileText } from 'lucide-react';

export interface WithdrawalRequest {
    requestId: string;
    status: 'Requested' | 'Approved' | 'Rejected' | 'Completed';
    requestedDate: string;
    consultant: {
        name: string;
        initials: string;
        consultantId: string;
        email: string;
        phone: string;
    };
    amounts: {
        withdrawalAmount: number;
        availableBalance: number;
        platformFee: number;
        platformFeePercent: number;
        tds: number;
        tdsPercent: number;
        netPayable: number;
    };
    bankAccount: {
        accountHolder: string;
        accountNumber: string;
        bankName: string;
        ifscCode: string;
    };
    recentHistory: Array<{
        amount: number;
        date: string;
        status: 'Completed' | 'Pending' | 'Rejected';
    }>;
}

interface WithdrawalRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApprove: () => void;
    onReject: () => void;
    data: WithdrawalRequest;
}

const WithdrawalRequestModal: React.FC<WithdrawalRequestModalProps> = ({
    isOpen,
    onClose,
    onApprove,
    onReject,
    data,
}) => {
    if (!isOpen) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Requested':
                return 'bg-orange-100 text-orange-600';
            case 'Completed':
                return 'bg-green-100 text-green-600';
            case 'Rejected':
                return 'bg-red-100 text-red-600';
            case 'Approved':
                return 'bg-blue-100 text-blue-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 scrollbar-thin">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-4 py-2 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Withdrawal Request Details
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Request ID: {data.requestId}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-4 py-2 space-y-6">
                    {/* Status Banner */}
                    <div className="flex items-center justify-between">
                        <span
                            className={`px-3 py-1 rounded-md text-sm font-medium ${getStatusColor(
                                data.status
                            )}`}
                        >
                            {data.status}
                        </span>
                        <span className="text-sm text-gray-600">
                            Requested: {data.requestedDate}
                        </span>
                    </div>

                    {/* Consultant Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">
                            Consultant Information
                        </h3>
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-semibold text-lg">
                                {data.consultant.initials}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">
                                    {data.consultant.name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                    Consultant ID: #{data.consultant.consultantId}
                                </p>
                                <div className="grid grid-cols-2 gap-4 mt-3">
                                    <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="text-sm text-gray-900">
                                            {data.consultant.email}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Phone</p>
                                        <p className="text-sm text-gray-900">
                                            {data.consultant.phone}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Amount Details */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">
                            Amount Details
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Withdrawal Amount</span>
                                <span className="font-semibold text-gray-900">
                                    {formatCurrency(data.amounts.withdrawalAmount)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Available Balance</span>
                                <span className="font-semibold text-gray-900">
                                    {formatCurrency(data.amounts.availableBalance)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                    Platform Fee ({data.amounts.platformFeePercent}%)
                                </span>
                                <span className="font-semibold text-red-600">
                                    - {formatCurrency(data.amounts.platformFee)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                    TDS ({data.amounts.tdsPercent}%)
                                </span>
                                <span className="font-semibold text-red-600">
                                    - {formatCurrency(data.amounts.tds)}
                                </span>
                            </div>
                            <div className="border-t pt-2 mt-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-base font-semibold text-gray-900">
                                        Net Payable
                                    </span>
                                    <span className="text-lg font-bold text-green-600">
                                        {formatCurrency(data.amounts.netPayable)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">
                            Payment Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex gap-3">
                                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">Method Holder</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {data.bankAccount.accountHolder}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">Method Type</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {data.bankAccount.bankName}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">Details</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {data.bankAccount.accountNumber}
                                    </p>
                                </div>
                            </div>
                            {data.bankAccount.ifscCode !== 'N/A' && (
                                <div className="flex gap-3">
                                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500">IFSC Code</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {data.bankAccount.ifscCode}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Withdrawal History */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">
                            Recent Withdrawal History
                        </h3>
                        <div className="space-y-2">
                            {data.recentHistory.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between bg-white rounded-lg p-3"
                                >
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {formatCurrency(item.amount)}
                                        </p>
                                        <p className="text-xs text-gray-500">{item.date}</p>
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-md text-xs font-medium ${getStatusColor(
                                            item.status
                                        )}`}
                                    >
                                        {item.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Close
                    </button>
                    {data.status === 'Requested' && (
                        <>
                            <button
                                onClick={onReject}
                                className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                            >
                                Reject
                            </button>
                            <button
                                onClick={onApprove}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                                Approve
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default WithdrawalRequestModal;
