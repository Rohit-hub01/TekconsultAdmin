import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const VerifyOtp = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, verifyOtpStandalone, sendOtp } = useAuth();

  const email = location.state?.email || '';
  const initialRole = location.state?.role || 'user';
  const flow = location.state?.flow || 'login';

  useEffect(() => {
    if (!email) {
      navigate('/login');
      return;
    }
    inputRefs.current[0]?.focus();
  }, [email, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    pastedData.split('').forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter the complete 6-digit OTP',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      let success = false;
      if (flow === 'signup') {
        success = await verifyOtpStandalone(email, otpString);
      } else {
        success = await verifyOtp(email, otpString, initialRole as 'user' | 'consultant');
      }

      if (success) {
        console.log('OTP Verified. Flow:', flow, 'Role:', initialRole);
        toast({
          title: 'OTP Verified',
          description: flow === 'signup' ? 'Please complete your profile' : 'Welcome to the platform!',
        });

        // Flow redirection
        if (flow === 'signup') {
          console.log('Redirecting to Basic Info Registration');
          // Pass OTP so the final registration API can verify it again
          navigate('/registration-basic-info', { state: { email, role: initialRole, otp: otpString } });
        } else {
          console.log('Redirecting to Dashboard. Initial Role:', initialRole);
          navigate(initialRole === 'consultant' ? '/consultant/dashboard' : '/user/home');
        }
      } else {
        toast({
          title: 'Invalid OTP',
          description: 'The code you entered is incorrect. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Verification failed. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendTimer(30);
    await sendOtp(email);
    toast({
      title: 'OTP Resent',
      description: 'A new verification code has been sent to your email',
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f7ff] dark:bg-[#0f1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#151923] rounded-[2.5rem] shadow-2xl p-10 md:p-12 animate-fade-in relative overflow-hidden">

        {/* Back Button */}
        <button
          onClick={() => navigate('/login')}
          className="absolute top-8 left-8 p-2 rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-[#2d3436] dark:text-white" />
        </button>

        {/* Header Icon */}
        <div className="flex flex-col items-center mb-10 mt-4">
          <div className="w-20 h-20 rounded-full bg-[#e1f7ed] flex items-center justify-center mb-6 animate-pulse">
            <div className="w-14 h-14 rounded-full bg-[#10b981] flex items-center justify-center text-white">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>
          <h1 className="font-display text-4xl font-bold text-[#2d3436] dark:text-white mb-3">
            Enter OTP
          </h1>
          <p className="text-[#636e72] dark:text-[#c7cbe0] text-center text-lg max-w-[280px]">
            We've sent a 6-digit code to your email address
          </p>
        </div>

        {/* OTP Form */}
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="flex justify-between gap-2 sm:gap-3">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-2xl font-bold bg-[#f1f2f6] dark:bg-[#1f2430] text-[#2d3436] dark:text-[#f5f7ff] placeholder:text-[#636e72] dark:placeholder:text-[#aab0c0] border-2 border-transparent focus:border-[#9b51e0] focus:bg-white dark:focus:bg-[#1f2430] rounded-xl transition-all"
              />
            ))}
          </div>

          <Button
            type="submit"
            className="w-full h-14 text-lg font-bold rounded-xl bg-[#9b51e0] hover:bg-[#8e44ad] text-white shadow-lg shadow-[#9b51e0]/20 active:scale-[0.98] transition-all"
            disabled={isLoading || otp.some((d) => !d)}
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              'Verify & Continue'
            )}
          </Button>
        </form>

        {/* Resend OTP */}
        <div className="text-center mt-12 text-[#636e72] dark:text-[#c7cbe0]">
          <p className="mb-2">Didn't receive the code?</p>
          {resendTimer > 0 ? (
            <p className="text-sm font-medium">
              Resend in <span className="text-[#2d3436] dark:text-white font-bold">{resendTimer}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="flex items-center justify-center mx-auto text-[#9b51e0] font-bold hover:underline active:opacity-70 transition-all"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Resend OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
