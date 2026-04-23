import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileUp, ShieldCheck, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { kycAPI } from '@/services/api';
import { toast } from '@/hooks/use-toast';

const UploadKYC = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [documentType, setDocumentType] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];

            // Check file size (max 5MB)
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast({
                    title: "File too large",
                    description: "Maximum file size is 5MB.",
                    variant: "destructive"
                });
                return;
            }

            setFile(selectedFile);

            // Create preview if it's an image
            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewUrl(reader.result as string);
                };
                reader.readAsDataURL(selectedFile);
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!documentType) {
            toast({
                title: "Error",
                description: "Please select a document type.",
                variant: "destructive"
            });
            return;
        }

        if (!file) {
            toast({
                title: "Error",
                description: "Please select a file to upload.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);

        try {
            await kycAPI.uploadDocument(documentType, file);
            toast({
                title: "Success",
                description: "Document uploaded successfully. It will be reviewed by our team.",
            });
            navigate('/consultant/kyc-documents');
        } catch (error) {
            console.error('Upload failed:', error);
            toast({
                title: "Upload Failed",
                description: "There was an error uploading your document. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

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
                <h1 className="font-display text-2xl font-bold text-foreground">Upload Document</h1>
            </div>

            <div className="px-6 py-6 space-y-8">
                {/* Info Card */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-indigo-900 text-sm">Safe & Secure</h3>
                        <p className="text-xs text-indigo-700 leading-relaxed mt-1">
                            Your documents are encrypted and stored securely. They are only used for identity verification purposes.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Document Type */}
                    <div className="space-y-2">
                        <Label htmlFor="doc-type" className="text-sm font-bold ml-1">Document Type</Label>
                        <Select onValueChange={setDocumentType} value={documentType}>
                            <SelectTrigger id="doc-type" className="h-14 rounded-2xl bg-card border-border">
                                <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                <SelectItem value="Aadhar Card">Aadhar Card</SelectItem>
                                <SelectItem value="PAN Card">PAN Card</SelectItem>
                                <SelectItem value="Driving License">Driving License</SelectItem>
                                <SelectItem value="Passport">Passport</SelectItem>
                                <SelectItem value="Voter ID">Voter ID</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <Label className="text-sm font-bold ml-1">Document Image/PDF</Label>
                        <div
                            className={`relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-4 transition-colors ${file ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'
                                }`}
                        >
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                id="file-upload"
                            />

                            {file ? (
                                <div className="flex flex-col items-center text-center gap-3">
                                    {previewUrl ? (
                                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-border">
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                            <CheckCircle2 className="w-8 h-8 text-primary" />
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-foreground line-clamp-1 px-4">{file.name}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-primary font-bold hover:bg-primary/5"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFile(null);
                                            setPreviewUrl(null);
                                        }}
                                    >
                                        Remove File
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                                        <FileUp className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-foreground">Click to upload or drag & drop</p>
                                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG or PDF (max. 5MB)</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Requirements */}
                    <div className="bg-muted/30 rounded-3xl p-6 space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Requirements</h4>
                        <ul className="space-y-2">
                            <li className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                                <span>Images must be clear and all text must be legible.</span>
                            </li>
                            <li className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                                <span>The entire document should be visible in the frame.</span>
                            </li>
                            <li className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                                <span>Document must be valid and not expired.</span>
                            </li>
                        </ul>
                    </div>

                    {/* Warning */}
                    <div className="flex gap-2 px-1">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                        <p className="text-[10px] text-amber-700 font-medium">
                            Providing false documents is a punishable offense and will lead to immediate account suspension.
                        </p>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-14 rounded-2xl font-bold shadow-lg shadow-primary/20"
                        disabled={isSubmitting || !file || !documentType}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Uploading...</span>
                            </div>
                        ) : (
                            'Submit for Verification'
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default UploadKYC;
