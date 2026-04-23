import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, ShieldCheck, Loader2, RefreshCw } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { authAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const registrationSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    middleName: z.string().optional(),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    captcha: z.string().min(1, 'Please solve the captcha'),
    termsAccepted: z.boolean().refine(val => val === true, {
        message: 'You must accept the terms and conditions',
    }),
});

type RegistrationValues = z.infer<typeof registrationSchema>;

const RegistrationBasicInfo = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [captcha, setCaptcha] = useState({ q: '', a: 0 });
    const { setToken } = useAuth();
    const email = location.state?.email || '';
    const role = location.state?.role || 'user';
    const otp = location.state?.otp || '';

    useEffect(() => {
        if (!email || (role === 'user' && !otp && process.env.NODE_ENV === 'production')) {
            // In demo we might lack OTP in state if coming from direct link
            // navigate('/signup');
        }
        generateCaptcha();
    }, [email, navigate]);

    const generateCaptcha = () => {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        setCaptcha({ q: `${num1} + ${num2}`, a: num1 + num2 });
    };

    const form = useForm<RegistrationValues>({
        resolver: zodResolver(registrationSchema),
        defaultValues: {
            firstName: '',
            middleName: '',
            lastName: '',
            captcha: '',
            termsAccepted: false,
        },
    });

    const onSubmit = async (values: RegistrationValues) => {
        if (parseInt(values.captcha) !== captcha.a) {
            form.setError('captcha', { message: 'Incorrect captcha' });
            generateCaptcha();
            return;
        }

        setIsLoading(true);
        try {
            const registrationData = {
                firstName: values.firstName,
                middleName: values.middleName,
                lastName: values.lastName,
                email: email,
                otp: otp,
                isConsultant: role === 'consultant',
            };

            console.log('Registering with data:', registrationData);

            const response = await authAPI.signupWithEmail(registrationData);
            const authData = response?.data;

            if (response?.success && authData?.token) {
                setToken(authData.token);
                // Also store user info in local storage for AuthContext to pick up
                const newState = {
                    isAuthenticated: true,
                    user: role === 'user' ? authData.user : null,
                    consultant: role === 'consultant' ? authData.user : null,
                    role: role,
                    token: authData.token,
                    isLoading: false
                };

                localStorage.setItem('authState', JSON.stringify(newState));
                localStorage.setItem('authToken', authData.token);
                localStorage.setItem('token', authData.token);
                localStorage.setItem('userId', authData.user?.userId || '');
                localStorage.setItem('userRole', role);
            } else {
                throw new Error(response?.message || 'Registration failed. Please try again.');
            }

            toast({
                title: 'Registration Successful',
                description: 'Welcome! You can now access your dashboard.',
            });

            // Redirect to appropriate dashboard
            if (role === 'consultant') {
                navigate('/consultant/dashboard');
            } else {
                navigate('/user/home');
            }
        } catch (error) {
            console.error('Registration error:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to complete registration. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f7ff] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-10 animate-fade-in relative overflow-hidden">

                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#9b51e0] to-[#6366f1]" />

                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-[#f0ebff] flex items-center justify-center mb-4">
                        <User className="w-8 h-8 text-[#9b51e0]" />
                    </div>
                    <h1 className="text-3xl font-bold text-[#2d3436] text-center">Complete Your Profile</h1>
                    <p className="text-[#636e72] mt-2 text-center text-balance">
                        Just a few more details to get you started on TekConsult.
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-semibold text-[#2d3436]">First Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter first name" {...field} className="h-12 rounded-xl bg-[#f1f2f6] border-2 border-transparent focus:border-[#9b51e0] focus:bg-white transition-all" />
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
                                        <FormLabel className="font-semibold text-[#2d3436]">Middle Name (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter middle name" {...field} className="h-12 rounded-xl bg-[#f1f2f6] border-2 border-transparent focus:border-[#9b51e0] focus:bg-white transition-all" />
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
                                        <FormLabel className="font-semibold text-[#2d3436]">Last Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter last name" {...field} className="h-12 rounded-xl bg-[#f1f2f6] border-2 border-transparent focus:border-[#9b51e0] focus:bg-white transition-all" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Captcha Section */}
                        <div className="bg-[#f8f9fa] p-6 rounded-2xl border-2 border-[#eef0f2]">
                            <div className="flex items-center justify-between mb-4">
                                <FormLabel className="font-bold text-[#2d3436] flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-[#10b981]" />
                                    Security Check
                                </FormLabel>
                                <button
                                    type="button"
                                    onClick={generateCaptcha}
                                    className="p-2 hover:bg-white rounded-full transition-colors text-[#9b51e0]"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-white px-4 py-2 rounded-lg border-2 border-[#eef0f2] font-mono text-xl font-bold text-[#2d3436] min-w-[100px] text-center">
                                    {captcha.q} = ?
                                </div>
                                <FormField
                                    control={form.control}
                                    name="captcha"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input
                                                    placeholder="Result"
                                                    {...field}
                                                    type="number"
                                                    className="h-11 rounded-xl bg-white border-2 border-[#eef0f2] focus:border-[#9b51e0] transition-all"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Terms Section */}
                        <FormField
                            control={form.control}
                            name="termsAccepted"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 bg-[#f8f7ff] p-4 rounded-xl border border-[#e1e1ff]">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            className="w-5 h-5 rounded border-[#9b51e0] data-[state=checked]:bg-[#9b51e0]"
                                        />
                                    </FormControl>
                                    <div className="leading-tight">
                                        <FormLabel className="text-sm font-medium text-[#636e72] cursor-pointer">
                                            I agree to the <a href="#" className="text-[#9b51e0] font-bold hover:underline">Terms of Service</a> and <a href="#" className="text-[#9b51e0] font-bold hover:underline">Privacy Policy</a>
                                        </FormLabel>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 rounded-2xl bg-[#9b51e0] hover:bg-[#8e44ad] text-white font-bold text-lg shadow-xl shadow-[#9b51e0]/20 transition-all active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                'Complete Registration'
                            )}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
};

export default RegistrationBasicInfo;
