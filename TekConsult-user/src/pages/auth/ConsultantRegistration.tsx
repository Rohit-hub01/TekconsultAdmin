import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Briefcase, IndianRupee, CreditCard, Upload, CheckCircle2, ChevronLeft, Search, Plus, X, Loader2 } from 'lucide-react';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

const regSchema = z.object({
    fullName: z.string().min(2, 'Full name is required'),
    bio: z.string().max(150, 'Bio must be under 150 characters'),
    experience: z.string().min(1, 'Experience is required'),
    categories: z.array(z.string()).min(1, 'Select at least one category'),
    languages: z.array(z.string()).min(1, 'Select at least one language'),
    chatRate: z.string().min(1, 'Chat rate is required'),
    callRate: z.string().min(1, 'Call rate is required'),
    freeMinutes: z.string().optional(),
    bankName: z.string().min(2, 'Bank name is required'),
    accountNumber: z.string().min(9, 'Valid account number is required'),
    ifscCode: z.string().min(11, 'Valid IFSC code is required'),
});

type RegFormValues = z.infer<typeof regSchema>;

const ALL_CATEGORIES = [
    'Astrology', 'Relationship', 'Mental Health', 'Career',
    'Finance', 'Legal', 'Education', 'Spiritual'
];

const ConsultantRegistration = () => {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Get signup data from location state
    const signupData = location.state || {};
    const defaultFullName = signupData.firstName ? `${signupData.firstName} ${signupData.lastName}` : '';

    const form = useForm<RegFormValues>({
        resolver: zodResolver(regSchema),
        defaultValues: {
            fullName: defaultFullName,
            bio: '',
            experience: '',
            categories: [],
            languages: [],
            chatRate: '',
            callRate: '',
            freeMinutes: '',
            bankName: '',
            accountNumber: '',
            ifscCode: '',
        },
    });

    const onSubmit = async (values: RegFormValues) => {
        if (step < 3) {
            setStep(step + 1);
            return;
        }

        setIsSubmitting(true);
        try {
            console.log('Full Registration Data:', values);
            toast({
                title: 'Registration Submitted',
                description: 'Your profile is under review. We will notify you once approved.',
            });
            navigate('/consultant/dashboard');
        } catch (error) {
            console.error('Registration error:', error);
            toast({
                title: 'Error',
                description: 'Failed to submit registration. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        } else {
            navigate(-1);
        }
    };

    const toggleCategory = (cat: string) => {
        const current = form.getValues('categories');
        if (current.includes(cat)) {
            form.setValue('categories', current.filter(c => c !== cat));
        } else {
            form.setValue('categories', [...current, cat]);
        }
        form.trigger('categories');
    };

    return (
        <div className="min-h-screen bg-[#f1f2f6] flex flex-col items-center justify-start py-10 px-4 sm:px-6">
            <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header matching Image */}
                <div className="bg-[#6366f1] px-6 py-5 text-white relative">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                            <User className="w-5 h-5" />
                        </div>
                        <h1 className="text-xl font-bold font-display tracking-tight">Consultant Registration</h1>
                    </div>

                    {/* Progress Bar Container - 3 Distinct Lines with spacing */}
                    <div className="space-y-3">
                        <div className="flex gap-3">
                            <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
                            <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
                            <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= 3 ? 'bg-white' : 'bg-white/30'}`} />
                        </div>
                        <div className="text-xs font-medium opacity-80 flex justify-between">
                            <span>Step {step} of 3</span>
                            <span>{Math.round((step / 3) * 100)}% Complete</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 sm:p-8 pt-6">
                    <Form {...form}>
                        <form className="space-y-5">

                            {/* STEP 1: Personal & Professional */}
                            {step === 1 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <FormField
                                        control={form.control}
                                        name="fullName"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1.5">
                                                <FormLabel className="font-bold text-[#2d3436] text-sm">Full Name <span className="text-red-500">*</span></FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter your full name" {...field} className="h-11 rounded-lg bg-white border-[#e2e8f0] focus:border-[#6366f1] transition-all" />
                                                </FormControl>
                                                <FormMessage className="text-[11px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="bio"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1.5">
                                                <FormLabel className="font-bold text-[#2d3436] text-sm">Bio <span className="text-red-500">*</span></FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Textarea
                                                            placeholder="Tell clients about yourself..."
                                                            className="min-h-[100px] rounded-lg bg-white border-[#e2e8f0] focus:border-[#6366f1] transition-all resize-none pr-4 pb-8 text-sm"
                                                            maxLength={150}
                                                            {...field}
                                                        />
                                                        <div className="absolute bottom-2 right-3 text-[10px] text-[#636e72]">
                                                            {field.value.length}/150 chars
                                                        </div>
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-[11px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="experience"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1.5">
                                                <FormLabel className="font-bold text-[#2d3436] text-sm">Years of Experience <span className="text-red-500">*</span></FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., 10 years" {...field} className="h-11 rounded-lg bg-white border-[#e2e8f0] focus:border-[#6366f1] transition-all" />
                                                </FormControl>
                                                <FormMessage className="text-[11px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="categories"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1.5">
                                                <FormLabel className="font-bold text-[#2d3436] text-sm">Categories <span className="text-red-500">*</span></FormLabel>
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {ALL_CATEGORIES.map(cat => (
                                                        <Badge
                                                            key={cat}
                                                            variant={field.value.includes(cat) ? 'default' : 'outline'}
                                                            className={`cursor-pointer px-3 py-1 rounded-full text-xs transition-all border-[#e2e8f0] ${field.value.includes(cat)
                                                                ? 'bg-[#6366f1] text-white hover:bg-[#4f46e5]'
                                                                : 'bg-white text-[#2d3436] hover:bg-[#f8f9fa]'
                                                                }`}
                                                            onClick={() => toggleCategory(cat)}
                                                        >
                                                            {cat}
                                                        </Badge>
                                                    ))}
                                                </div>
                                                <FormMessage className="text-[11px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="languages"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1.5">
                                                <FormLabel className="font-bold text-[#2d3436] text-sm">Languages <span className="text-red-500">*</span></FormLabel>
                                                <div className="relative group">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#636e72]" />
                                                    <Input
                                                        placeholder="Enter languages"
                                                        className="h-11 rounded-lg bg-white border-[#e2e8f0] focus:border-[#6366f1] transition-all pl-10"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                const val = e.currentTarget.value.trim();
                                                                if (val && !field.value.includes(val)) {
                                                                    form.setValue('languages', [...field.value, val]);
                                                                    e.currentTarget.value = '';
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {field.value.map(lang => (
                                                        <Badge key={lang} className="bg-[#f1f2f6] text-[#2d3436] border-none hover:bg-red-50 hover:text-red-500 transition-colors gap-1.5 px-2.5 py-1 rounded-md text-[11px]">
                                                            {lang}
                                                            <X className="w-3 h-3 cursor-pointer" onClick={() => form.setValue('languages', field.value.filter(l => l !== lang))} />
                                                        </Badge>
                                                    ))}
                                                </div>
                                                <FormMessage className="text-[11px]" />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            {/* STEP 2: Rates & Pricing */}
                            {step === 2 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <FormField
                                        control={form.control}
                                        name="chatRate"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1">
                                                <FormLabel className="font-bold text-[#2d3436] text-[13px]">Chat Rate (₹/min) <span className="text-red-500">*</span></FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., 20" type="number" {...field} className="h-11 rounded-lg bg-white border-[#e2e8f0] focus:border-[#6366f1] transition-all" />
                                                </FormControl>
                                                <FormMessage className="text-[11px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="callRate"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1">
                                                <FormLabel className="font-bold text-[#2d3436] text-[13px]">Call Rate (₹/min) <span className="text-red-500">*</span></FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., 40" type="number" {...field} className="h-11 rounded-lg bg-white border-[#e2e8f0] focus:border-[#6366f1] transition-all" />
                                                </FormControl>
                                                <FormMessage className="text-[11px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="freeMinutes"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <FormLabel className="font-bold text-[#2d3436] text-[13px]">Free Minutes for New Users</FormLabel>
                                                    <span className="text-[10px] text-[#636e72] font-normal">(Optional)</span>
                                                </div>
                                                <FormControl>
                                                    <Input placeholder="e.g., 5" type="number" {...field} className="h-11 rounded-lg bg-white border-[#e2e8f0] focus:border-[#6366f1] transition-all" />
                                                </FormControl>
                                                <FormDescription className="text-[11px] text-[#636e72] italic leading-tight">
                                                    Offering free minutes can attract more clients
                                                </FormDescription>
                                                <FormMessage className="text-[11px]" />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            {/* STEP 3: Bank & Documents matching Image exactly */}
                            {step === 3 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <FormField
                                        control={form.control}
                                        name="bankName"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1">
                                                <FormLabel className="font-bold text-[#2d3436] text-[13px]">Bank Name <span className="text-red-500">*</span></FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter bank name" {...field} className="h-11 rounded-lg bg-white border-[#e2e8f0] focus:border-[#6366f1] transition-all" />
                                                </FormControl>
                                                <FormMessage className="text-[11px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="accountNumber"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1">
                                                <FormLabel className="font-bold text-[#2d3436] text-[13px]">Account Number <span className="text-red-500">*</span></FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter account number" {...field} className="h-11 rounded-lg bg-white border-[#e2e8f0] focus:border-[#6366f1] transition-all" />
                                                </FormControl>
                                                <FormMessage className="text-[11px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="ifscCode"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1">
                                                <FormLabel className="font-bold text-[#2d3436] text-[13px]">IFSC Code <span className="text-red-500">*</span></FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter IFSC code" {...field} className="h-11 rounded-lg bg-white border-[#e2e8f0] focus:border-[#6366f1] transition-all" />
                                                </FormControl>
                                                <FormMessage className="text-[11px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="space-y-2.5 pt-1">
                                        <FormLabel className="font-bold text-[#2d3436] text-[13px]">KYC Document <span className="text-red-500">*</span></FormLabel>
                                        <div className="border border-[#e2e8f0] bg-[#f8f9fa] rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-2 cursor-pointer hover:border-[#6366f1] hover:bg-[#6366f1]/5 transition-all group">
                                            <div className="w-10 h-10 flex items-center justify-center text-[#94a3b8] group-hover:text-[#6366f1] transition-all">
                                                <Upload className="w-6 h-6" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="font-medium text-[13px] text-[#64748b]">Upload Aadhaar / PAN / Passport</p>
                                                <p className="text-[10px] text-[#94a3b8]">PDF or JPG, max 5MB</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Verification Notice Box Matching Image */}
                                    <div className="bg-[#eef2ff] border border-[#e0e7ff] rounded-xl p-4 flex items-start gap-3 mt-4">
                                        <div className="w-5 h-5 rounded-full border-2 border-[#6366f1] flex items-center justify-center shrink-0 mt-0.5">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-[#6366f1]" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[13px] font-bold text-[#2d3436]">Your documents will be verified within 24-48 hours</p>
                                            <p className="text-[11px] text-[#636e72]">You'll receive an email once approved</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* NAVIGATION BUTTONS - Stacked as in Image */}
                            <div className="flex flex-col gap-3 pt-6">
                                <Button
                                    type="button"
                                    onClick={async () => {
                                        if (step === 1) {
                                            const isValid = await form.trigger(['fullName', 'bio', 'experience', 'categories', 'languages']);
                                            if (isValid) setStep(2);
                                        } else if (step === 2) {
                                            const isValid = await form.trigger(['chatRate', 'callRate']);
                                            if (isValid) setStep(3);
                                        } else {
                                            // Step 3 submission
                                            form.handleSubmit(onSubmit)();
                                        }
                                    }}
                                    disabled={isSubmitting}
                                    className="h-12 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-base shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        'Next'
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleBack}
                                    className="h-12 rounded-xl text-[#2d3436] font-semibold text-base hover:bg-[#f1f2f6] transition-all bg-white border border-[#e2e8f0]"
                                >
                                    Back
                                </Button>
                            </div>

                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
};

export default ConsultantRegistration;
