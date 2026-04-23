import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from 'lucide-react';
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

const UserSignupForm = () => {
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
        isConsultant: false,
      });

      const authData = response?.data;
      if (!response?.success || !authData?.token || !authData?.user) {
        throw new Error(response?.message || 'Failed to create account.');
      }

      const authState = {
        isAuthenticated: true,
        user: authData.user,
        consultant: null,
        role: 'user',
        token: authData.token,
        isLoading: false,
      };

      localStorage.setItem('authState', JSON.stringify(authState));
      localStorage.setItem('authToken', authData.token);
      localStorage.setItem('token', authData.token);
      localStorage.setItem('userId', authData.user?.userId || '');
      localStorage.setItem('userRole', 'user');

      toast({
        title: 'Profile Updated',
        description: 'Your account has been created successfully!',
      });
      window.location.assign('/user/home');
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
    <div className="min-h-screen bg-secondary/30 flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6 lg:p-8 py-8 sm:py-12">
      <div className="w-full max-w-5xl bg-card rounded-lg shadow-lg p-4 sm:p-6 md:p-8 lg:p-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-3 sm:mb-4 shadow-purple">
            <User className="text-primary-foreground w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground text-center">User Sign Up</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 text-center">Create your account to get started</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6 md:space-y-7">
            {/* Personal Information Section */}
            <div>
              <h2 className="font-semibold text-sm sm:text-base text-foreground mb-3 sm:mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">
                        First Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="First name" {...field} className="text-sm" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="middleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Middle Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Middle name" {...field} className="text-sm" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">
                        Last Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Last name" {...field} className="text-sm" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contact Information Section */}
            <div>
              <h2 className="font-semibold text-sm sm:text-base text-foreground mb-3 sm:mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">
                        Email Address <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="email@example.com" type="email" {...field} className="text-sm" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">
                        Password <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter password" type="password" {...field} className="text-sm" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">
                        Confirm Password <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Re-enter password" type="password" {...field} className="text-sm" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Address Section */}
            <div>
              <h2 className="font-semibold text-sm sm:text-base text-foreground mb-3 sm:mb-4">Address</h2>
              <div className="space-y-3 sm:space-y-4">
                <FormField
                  control={form.control}
                  name="addressLine"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">
                        Address Line <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Street address" {...field} className="text-sm" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">
                          City <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} className="text-sm" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">
                          State <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="State" {...field} className="text-sm" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zipcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">
                          Zipcode <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="12345" {...field} className="text-sm" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">
                          Country <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Country" {...field} className="text-sm" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Gender Section */}
            <div>
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div className="flex items-center justify-between">
                      <FormLabel className="font-semibold text-sm sm:text-base">Gender</FormLabel>
                      <span className="text-xs text-muted-foreground">(Optional)</span>
                    </div>
                    <FormControl>
                      <RadioGroup value={field.value || ''} onValueChange={field.onChange}>
                        <div className="flex flex-wrap gap-4 sm:gap-6">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="male" id="male" />
                            <FormLabel htmlFor="male" className="cursor-pointer font-normal text-sm">
                              Male
                            </FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="female" id="female" />
                            <FormLabel htmlFor="female" className="cursor-pointer font-normal text-sm">
                              Female
                            </FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="other" id="other" />
                            <FormLabel htmlFor="other" className="cursor-pointer font-normal text-sm">
                              Other
                            </FormLabel>
                          </div>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* Terms & Conditions */}
            <div>
              <FormField
                control={form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="terms"
                        className="mt-1"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-snug">
                      <FormLabel htmlFor="terms" className="text-xs sm:text-sm font-normal cursor-pointer">
                        I accept the{' '}
                        <a href="#" className="text-primary hover:underline">
                          Terms & Conditions
                        </a>{' '}
                        and{' '}
                        <a href="#" className="text-primary hover:underline">
                          Privacy Policy
                        </a>
                      </FormLabel>
                    </div>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/signup')}
                className="w-full sm:flex-1 text-sm sm:text-base"
              >
                Back to Role Selection
              </Button>
            </div>

            {/* Sign In Link */}
            <div className="text-center pt-2">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign In
                </button>
              </p>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default UserSignupForm;
