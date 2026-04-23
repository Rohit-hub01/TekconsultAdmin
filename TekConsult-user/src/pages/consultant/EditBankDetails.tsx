import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Landmark, Building2, User, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { paymentAPI } from '@/services/api';
import { toast } from '@/hooks/use-toast';

const EditBankDetails = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        accountHolderName: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        branchName: '',
    });

    useEffect(() => {
        const fetchBankDetails = async () => {
            try {
                const data = await paymentAPI.getBankDetails();
                if (data) {
                    setFormData({
                        accountHolderName: data.accountHolderName || '',
                        bankName: data.bankName || '',
                        accountNumber: data.accountNumber || '',
                        ifscCode: data.ifscCode || '',
                        branchName: data.branchName || '',
                    });
                }
            } catch (error) {
                console.error('Failed to fetch bank details:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBankDetails();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await paymentAPI.updateBankDetails(formData);
            toast({
                title: "Success",
                description: "Bank details updated successfully. Verification pending.",
            });
            navigate('/consultant/bank-details');
        } catch (error) {
            console.error('Failed to update bank details:', error);
            toast({
                title: "Error",
                description: "Failed to update bank details. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="px-6 pt-6 pb-4 flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    className="rounded-full bg-card border border-border"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <h1 className="font-display text-2xl font-bold text-foreground">
                    {formData.accountNumber ? 'Edit Bank Details' : 'Add Bank Details'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="accountHolderName">Account Holder Name</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="accountHolderName"
                                name="accountHolderName"
                                placeholder="As per bank records"
                                className="pl-10 h-12 rounded-xl"
                                value={formData.accountHolderName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="bankName"
                                name="bankName"
                                placeholder="e.g. HDFC Bank"
                                className="pl-10 h-12 rounded-xl"
                                value={formData.bankName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="accountNumber"
                                name="accountNumber"
                                placeholder="Enter account number"
                                className="pl-10 h-12 rounded-xl"
                                value={formData.accountNumber}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="ifscCode">IFSC Code</Label>
                            <Input
                                id="ifscCode"
                                name="ifscCode"
                                placeholder="HDFC0001245"
                                className="h-12 rounded-xl uppercase"
                                value={formData.ifscCode}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="branchName">Branch Name</Label>
                            <Input
                                id="branchName"
                                name="branchName"
                                placeholder="e.g. Sector 45"
                                className="h-12 rounded-xl"
                                value={formData.branchName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex gap-3">
                    <Landmark className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Please ensure the details are correct. Settlements will be made to this account. Incorrect details may lead to transaction failures.
                    </p>
                </div>

                <Button
                    type="submit"
                    className="w-full h-14 rounded-2xl font-bold shadow-lg shadow-primary/20"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Updating...</span>
                        </div>
                    ) : (
                        'Save Bank Details'
                    )}
                </Button>
            </form>
        </div>
    );
};

export default EditBankDetails;
