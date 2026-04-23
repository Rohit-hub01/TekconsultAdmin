import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Loader2, Briefcase, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { sendOtp } = useAuth();

  const isSignupFlow = location.state?.flow === 'signup';
  const role = location.state?.role || 'user';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: 'Missing email',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp(email.trim());
      toast({
        title: 'OTP sent',
        description: 'Please check your email for the verification code.',
      });
      navigate('/verify-otp', { state: { email: email.trim(), role, flow: isSignupFlow ? 'signup' : 'login' } });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7ff] dark:bg-[#0f1117] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full flex flex-col md:flex-row items-center gap-8 md:gap-16">

        {/* Left Side: Illustration */}
        <div className="hidden md:flex flex-1 justify-end animate-fade-in">
          <img
            src="/assets/icons/Login page image.png"
            alt="Login Illustration"
            className="w-full max-w-[400px] h-auto object-contain"
          />
        </div>

        {/* Right Side: Login Form */}
        <div className="flex-1 w-full max-w-md">
          <div className="bg-white dark:bg-[#151923] rounded-[2rem] shadow-2xl p-10 md:p-12 animate-slide-up">
            <div className="text-center mb-10">
              {isSignupFlow && role === 'consultant' && (
                <div className="w-16 h-16 rounded-full bg-[#6366f1] flex items-center justify-center mb-4 mx-auto shadow-lg">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
              )}
              <h1 className="font-display text-4xl font-bold text-[#2d3436] dark:text-white mb-3">
                {isSignupFlow ? 'Welcome!' : 'Welcome Back!'}
              </h1>
              <p className="text-[#636e72] dark:text-[#c7cbe0] text-lg">
                {isSignupFlow ? 'Continue signup with email OTP' : 'Sign in with your email OTP'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-[#2d3436] dark:text-white ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#636e72] dark:text-[#aab0c0]" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 pl-12 text-lg bg-[#f1f2f6] dark:bg-[#1f2430] text-[#2d3436] dark:text-[#f5f7ff] placeholder:text-[#636e72] dark:placeholder:text-[#aab0c0] border-2 border-transparent focus:border-[#9b51e0] focus:bg-white dark:focus:bg-[#1f2430] rounded-xl transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold rounded-xl bg-[#9b51e0] hover:bg-[#8e44ad] text-white shadow-lg shadow-[#9b51e0]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                disabled={isLoading || !email.trim()}
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    {isSignupFlow ? 'Send OTP & Continue' : 'Send OTP'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-10 text-center space-y-4">
              <p className="text-xs text-[#636e72] dark:text-[#aab0c0] leading-relaxed">
                By continuing, you agree to our{' '}
                <span className="text-[#9b51e0] font-semibold hover:underline cursor-pointer">Terms of Service</span> and{' '}
                <span className="text-[#9b51e0] font-semibold hover:underline cursor-pointer">Privacy Policy</span>
              </p>

              <p className="text-sm text-[#636e72] dark:text-[#c7cbe0]">
                {isSignupFlow ? (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => navigate('/login', { state: { flow: 'login' } })}
                      className="text-[#9b51e0] font-bold hover:underline"
                    >
                      Sign In
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{' '}
                    <button
                      onClick={() => navigate('/signup')}
                      className="text-[#9b51e0] font-bold hover:underline"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
