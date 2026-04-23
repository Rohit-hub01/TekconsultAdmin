import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Landmark, CreditCard, Building2, User, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { paymentAPI } from '@/services/api';
import { toast } from '@/hooks/use-toast';

interface BankData {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branchName?: string;
    isVerified: boolean;
}

const BankDetails = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [bankData, setBankData] = useState<BankData | null>(null);

    useEffect(() => {
        const fetchBankDetails = async () => {
            try {
                const data = await paymentAPI.getBankDetails();
                setBankData(data);
            } catch (error) {
                console.error('Failed to fetch bank details:', error);
                toast({
                    title: "Error",
                    description: "Failed to load bank details.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchBankDetails();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const maskedAccountNumber = bankData?.accountNumber
        ? `•••• •••• •••• ${bankData.accountNumber.slice(-4)}`
        : 'Not provided';

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    className="rounded-full bg-card border border-border"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <h1 className="font-display text-2xl font-bold text-foreground">Bank Details</h1>
            </div>

            <div className="px-6 py-6 space-y-6">
                {!bankData ? (
                    <div className="bg-muted/30 border border-dashed border-border rounded-3xl p-8 flex flex-col items-center text-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                            <Landmark className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground">No Bank Details</h3>
                            <p className="text-sm text-muted-foreground">Please add your bank details to receive payments.</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <div className="flex justify-between items-start mb-6">
                            <Landmark className="w-12 h-12 opacity-80" />
                            {bankData.isVerified ? (
                                <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                                    Verified
                                </div>
                            ) : (
                                <div className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider text-amber-300">
                                    Pending Verification
                                </div>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-indigo-100/60 text-[10px] uppercase tracking-widest font-bold">Account Holder</p>
                                <p className="text-xl font-bold tracking-tight">{bankData.accountHolderName}</p>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-indigo-100/60 text-[10px] uppercase tracking-widest font-bold">Account Number</p>
                                    <p className="text-lg font-mono tracking-wider">{maskedAccountNumber}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-indigo-100/60 text-[10px] uppercase tracking-widest font-bold">IFSC Code</p>
                                    <p className="text-lg font-mono tracking-wider italic uppercase">{bankData.ifscCode}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-1">Details</h3>

                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="p-4 flex items-center gap-4 border-b border-border bg-muted/20">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground font-medium">Bank Name</p>
                                <p className="font-bold text-sm">{bankData?.bankName || '—'}</p>
                            </div>
                        </div>

                        <div className="p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground font-medium">Branch</p>
                                <p className="font-bold text-sm">{bankData?.branchName || '—'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                        <p className="text-xs text-orange-700 leading-relaxed font-medium">
                            <span className="font-bold mr-1">Note:</span>
                            Your earnings will be settled to this account. Any changes to bank details will require a verification period of 24-48 hours.
                        </p>
                    </div>
                </div>

                <Button
                    className="w-full h-14 rounded-2xl font-bold shadow-lg shadow-primary/20"
                    onClick={() => navigate('/consultant/edit-bank-details')}
                >
                    {bankData ? 'Edit Bank Details' : 'Add Bank Details'}
                </Button>
            </div>
        </div>
    );
};

export default BankDetails;
