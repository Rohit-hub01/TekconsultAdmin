import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Briefcase, Loader2 } from 'lucide-react';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { authAPI } from '@/services/api';

const signupSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    middleName: z.string().optional(),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password is required'),
    addressLine: z.string().min(5, 'Address must be at least 5 characters'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    zipcode: z.string().regex(/^\d{4,}$/, 'Invalid zipcode'),
    country: z.string().min(2, 'Country is required'),
    gender: z.enum(['male', 'female', 'other']).optional(),
    termsAccepted: z.boolean().refine(val => val === true, {
        message: 'You must accept the terms and conditions',
    }),
}).refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
});

type SignupFormValues = z.infer<typeof signupSchema>;

const ConsultantSignupForm = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            firstName: '',
            middleName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
            addressLine: '',
            city: '',
            state: '',
            zipcode: '',
            country: '',
            gender: undefined,
            termsAccepted: false,
        },
    });

    const onSubmit = async (values: SignupFormValues) => {
        setIsLoading(true);
        try {
            const response = await authAPI.signupWithEmail({
                firstName: values.firstName,
                middleName: values.middleName,
                lastName: values.lastName,
                email: values.email,
                password: values.password,
                isConsultant: true,
            });

            const authData = response?.data;
            if (!response?.success || !authData?.token || !authData?.user) {
                throw new Error(response?.message || 'Failed to create consultant account.');
            }

            const authState = {
                isAuthenticated: true,
                user: null,
                consultant: authData.user,
                role: 'consultant',
                token: authData.token,
                isLoading: false,
            };

            localStorage.setItem('authState', JSON.stringify(authState));
            localStorage.setItem('authToken', authData.token);
            localStorage.setItem('token', authData.token);
            localStorage.setItem('userId', authData.user?.userId || '');
            localStorage.setItem('userRole', 'consultant');

            toast({
                title: 'Account Created',
                description: 'Welcome! Complete your consultant profile next.',
            });
            navigate('/consultant-registration', { state: { ...values } });
        } catch (error) {
            console.error('Signup error:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to create account. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f7ff] flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6 lg:p-8 py-8 sm:py-12">
            <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-xl p-6 sm:p-10 md:p-12">
                {/* Header */}
                <div className="flex flex-col items-center mb-8 sm:mb-10 text-center">
                    <div className="w-20 h-20 rounded-full bg-[#6366f1] flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
                        <Briefcase className="text-white w-10 h-10" />
                    </div>
                    <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#2d3436]">Consultant Sign Up</h1>
                    <p className="text-[#636e72] text-lg mt-2">Create your consultant profile</p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {/* Personal Information Section */}
                        <div className="space-y-6">
                            <div className="border-b border-[#f1f2f6] pb-4">
                                <h2 className="font-bold text-lg text-[#2d3436]">Personal Information</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium text-[#2d3436]">
                                                First Name <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="First name" {...field} className="h-12 rounded-xl bg-[#f8f9fa] border-transparent focus:bg-white focus:border-[#6366f1] transition-all" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="middleName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium text-[#2d3436]">Middle Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Middle name" {...field} className="h-12 rounded-xl bg-[#f8f9fa] border-transparent focus:bg-white focus:border-[#6366f1] transition-all" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium text-[#2d3436]">
                                                Last Name <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Last name" {...field} className="h-12 rounded-xl bg-[#f8f9fa] border-transparent focus:bg-white focus:border-[#6366f1] transition-all" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Contact Information Section */}
                        <div className="space-y-6 pt-4">
                            <div className="border-b border-[#f1f2f6] pb-4">
                                <h2 className="font-bold text-lg text-[#2d3436]">Contact Information</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium text-[#2d3436]">
                                                Email Address <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="email@example.com" type="email" {...field} className="h-12 rounded-xl bg-[#f8f9fa] border-transparent focus:bg-white focus:border-[#6366f1] transition-all" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium text-[#2d3436]">
                                                Password <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Enter password" {...field} className="h-12 rounded-xl bg-[#f8f9fa] border-transparent focus:bg-white focus:border-[#6366f1] transition-all" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium text-[#2d3436]">
                                                Confirm Password <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Re-enter password" {...field} className="h-12 rounded-xl bg-[#f8f9fa] border-transparent focus:bg-white focus:border-[#6366f1] transition-all" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Address Section */}
                        <div className="space-y-6 pt-4">
                            <div className="border-b border-[#f1f2f6] pb-4">
                                <h2 className="font-bold text-lg text-[#2d3436]">Address</h2>
                            </div>
                            <div className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="addressLine"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium text-[#2d3436]">
                                                Address Line <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Street address" {...field} className="h-12 rounded-xl bg-[#f8f9fa] border-transparent focus:bg-white focus:border-[#6366f1] transition-all" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-[#2d3436]">
                                                    City <span className="text-red-500">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="City" {...field} className="h-12 rounded-xl bg-[#f8f9fa] border-transparent focus:bg-white focus:border-[#6366f1] transition-all" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="state"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-[#2d3436]">
                                                    State <span className="text-red-500">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="State" {...field} className="h-12 rounded-xl bg-[#f8f9fa] border-transparent focus:bg-white focus:border-[#6366f1] transition-all" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="zipcode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-[#2d3436]">
                                                    Zipcode <span className="text-red-500">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="12345" {...field} className="h-12 rounded-xl bg-[#f8f9fa] border-transparent focus:bg-white focus:border-[#6366f1] transition-all" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="country"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-[#2d3436]">
                                                    Country <span className="text-red-500">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Country" {...field} className="h-12 rounded-xl bg-[#f8f9fa] border-transparent focus:bg-white focus:border-[#6366f1] transition-all" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Gender Section */}
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-2">
                                <h2 className="font-bold text-lg text-[#2d3436]">Gender</h2>
                                <span className="text-sm text-[#636e72] font-normal">(Optional)</span>
                            </div>
                            <FormField
                                control={form.control}
                                name="gender"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <RadioGroup value={field.value || ''} onValueChange={field.onChange} className="flex flex-row gap-8">
                                                <div className="flex items-center gap-2">
                                                    <RadioGroupItem value="male" id="male" className="border-[#6366f1] text-[#6366f1]" />
                                                    <FormLabel htmlFor="male" className="cursor-pointer font-medium">Male</FormLabel>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <RadioGroupItem value="female" id="female" className="border-[#6366f1] text-[#6366f1]" />
                                                    <FormLabel htmlFor="female" className="cursor-pointer font-medium">Female</FormLabel>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <RadioGroupItem value="other" id="other" className="border-[#6366f1] text-[#6366f1]" />
                                                    <FormLabel htmlFor="other" className="cursor-pointer font-medium">Other</FormLabel>
                                                </div>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Terms & Conditions */}
                        <div className="pt-4">
                            <FormField
                                control={form.control}
                                name="termsAccepted"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="w-5 h-5 rounded border-[#6366f1] data-[state=checked]:bg-[#6366f1]"
                                            />
                                        </FormControl>
                                        <div className="space-y-1">
                                            <FormLabel className="text-sm font-medium text-[#636e72]">
                                                I accept the <a href="#" className="text-[#6366f1] hover:underline">Terms & Conditions</a> and <a href="#" className="text-[#6366f1] hover:underline">Privacy Policy</a>
                                            </FormLabel>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Buttons matching Image 2 */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-10">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => navigate('/signup')}
                                className="w-full sm:flex-1 h-14 rounded-2xl bg-[#f1f2f6] hover:bg-[#e2e8f0] text-[#636e72] font-semibold text-lg"
                            >
                                Back to Role Selection
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full sm:flex-1 h-14 rounded-2xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-lg shadow-lg shadow-indigo-100"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    'Create Account'
                                )}
                            </Button>
                        </div>

                        <div className="text-center pt-4">
                            <p className="text-[#636e72]">
                                Already have an account? <button type="button" onClick={() => navigate('/login')} className="text-[#6366f1] font-bold hover:underline">Sign In</button>
                            </p>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
};

export default ConsultantSignupForm;
