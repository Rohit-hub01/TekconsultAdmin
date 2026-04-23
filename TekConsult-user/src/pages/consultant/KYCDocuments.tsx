import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileCheck, ShieldCheck, Clock, CheckCircle2, AlertCircle, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { kycAPI } from '@/services/api';
import { toast } from '@/hooks/use-toast';

interface KYCDocument {
    docId: string;
    documentType: string;
    documentUrl: string;
    verificationStatus: number;
    adminFeedback?: string;
    uploadedAt: string;
    verifiedAt?: string;
}

const KYCDocuments = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [documents, setDocuments] = useState<KYCDocument[]>([]);

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const data = await kycAPI.getMyDocuments();
                setDocuments(data);
            } catch (error) {
                console.error('Failed to fetch documents:', error);
                toast({
                    title: "Error",
                    description: "Failed to load KYC documents.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchDocuments();
    }, []);

    const getStatusDetails = (status: number) => {
        switch (status) {
            case 1: // Verified
                return { label: 'Verified', color: 'bg-emerald-50 text-emerald-600 border-emerald-500/30', icon: FileCheck, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-500/10' };
            case 2: // Rejected
                return { label: 'Rejected', color: 'bg-red-50 text-red-600 border-red-500/30', icon: XCircle, iconColor: 'text-red-500', iconBg: 'bg-red-500/10' };
            default: // Pending (0)
                return { label: 'Pending', color: 'bg-amber-50 text-amber-600 border-amber-500/30', icon: Clock, iconColor: 'text-amber-500', iconBg: 'bg-amber-500/10' };
        }
    };

    const isFullyVerified = documents.length > 0 && documents.some(doc => doc.verificationStatus === 1);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
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
                <h1 className="font-display text-2xl font-bold">KYC Documents</h1>
            </div>

            <div className="px-6 py-6 space-y-8">
                {/* Status Banner */}
                {isFullyVerified ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-emerald-900">KYC Verified</h2>
                            <p className="text-sm text-emerald-700/80 font-medium">Your primary identity documents are verified. You can stay online and accept sessions.</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shrink-0">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-amber-900">Verification Pending</h2>
                            <p className="text-sm text-amber-700/80 font-medium">Please upload valid identity documents for verification to start accepting sessions.</p>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Submitted Documents</h3>
                    </div>

                    <div className="space-y-3">
                        {documents.length === 0 ? (
                            <div className="bg-card border border-border border-dashed rounded-3xl p-8 text-center space-y-3">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                                    <ShieldCheck className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-bold text-foreground">No documents uploaded yet</p>
                                    <p className="text-xs text-muted-foreground">Upload your ID proof to become a verified consultant.</p>
                                </div>
                            </div>
                        ) : (
                            documents.map((doc, index) => {
                                const status = getStatusDetails(doc.verificationStatus);
                                const Icon = status.icon;
                                return (
                                    <div key={doc.docId || index} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 group hover:border-primary/20 transition-all">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${status.iconBg}`}>
                                            <Icon className={`w-6 h-6 ${status.iconColor}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="font-bold text-sm truncate">{doc.documentType}</p>
                                                <Badge variant="outline" className={`text-[10px] py-0 px-1.5 rounded-md ${status.color}`}>
                                                    {status.label}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground font-mono truncate max-w-[150px]">
                                                {doc.docId.split('-')[0].toUpperCase()}...
                                            </p>
                                            <p className="text-[10px] text-muted-foreground mt-1 tracking-tight">
                                                Submitted on {new Date(doc.uploadedAt).toLocaleDateString()}
                                            </p>
                                            {doc.adminFeedback && (
                                                <p className="text-[10px] text-red-500 mt-1 font-medium bg-red-50 p-2 rounded-lg">
                                                    <span className="font-bold">Feedback:</span> {doc.adminFeedback}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                    <div className="flex items-start gap-3 relative z-10">
                        <AlertCircle className="w-5 h-5 text-primary shrink-0" />
                        <div className="space-y-2">
                            <p className="text-sm font-bold">Important Information</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Verification of new documents usually takes <span className="text-foreground font-medium underline decoration-primary/30">24-72 hours</span>. Keep your phone notifications on to receive updates about your document status.
                            </p>
                        </div>
                    </div>
                </div>

                <Button
                    className="w-full h-14 rounded-2xl font-bold shadow-lg shadow-primary/20"
                    onClick={() => navigate('/consultant/upload-kyc')}
                >
                    Upload New Document
                </Button>
            </div>
        </div>
    );
};

export default KYCDocuments;
