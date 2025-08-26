'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Code, ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (searchParams) {
      const emailFromParams = searchParams.get('email');
      if (emailFromParams) {
        setEmail(decodeURIComponent(emailFromParams));
      } else {
        toast.error('No email found.', {
          description: 'Please go back to the sign-up page and try again.',
        });
        router.push('/login');
      }
    }
  }, [searchParams, router]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP.');
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email: email,
      token: otp,
      type: 'signup',
    });

    setLoading(false);
    if (error) {
      toast.error('OTP Verification Failed', { description: error.message });
    } else {
      toast.success('Account verified successfully!', {
        description: 'You will be redirected to create your profile.',
      });
      router.push('/profile/create');
    }
  };

  return (
    <div className="font-primary relative min-h-screen w-full overflow-hidden bg-background text-foreground flex flex-col">
       <div className="absolute top-0 z-[0] h-full w-full bg-background">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[100px] animate-pulse"></div>
        <div className="pointer-events-none absolute h-full w-full overflow-hidden opacity-70 [perspective:500px]">
          <div className="absolute inset-0 [transform:rotateX(45deg)]">
            <div className="absolute animate-grid [inset:0%_0px] [margin-left:-50%] [height:300vh] [width:600vw] [transform-origin:100%_0_0] [background-image:linear-gradient(to_right,hsl(var(--primary)/0.1)_1px,transparent_0),linear-gradient(to_bottom,hsl(var(--primary)/0.05)_1px,transparent_0)] [background-size:100px_100px] [background-repeat:repeat]"></div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent to-70%"></div>
        </div>
      </div>
      
      <header className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center">
        <Button variant="ghost" onClick={() => router.push('/login')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Button>
        <ThemeToggle />
      </header>
      
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="relative">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-soft relative z-10">
              <Code className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            Verify Your Account
          </h1>
        </div>
        <p className="text-muted-foreground mb-8 max-w-sm">
          Enter the 6-digit code we sent to <span className="text-primary font-semibold">{email}</span>.
        </p>
        
        <div className="w-full max-w-sm mx-auto">
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            
            <Button 
              type="submit"
              size="lg" 
              className="relative w-full py-6 text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(var(--primary)/0.3)] disabled:opacity-50 mt-4"
              disabled={loading || otp.length < 6}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Verify
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
