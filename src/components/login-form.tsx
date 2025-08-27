'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { Mail, ArrowLeft, Code, User, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import Link from 'next/link';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }
    if (!password) {
      toast.error('Please enter your password.');
      return;
    }

    if (isSignUp) {
      if (!fullName) {
        toast.error('Please enter your full name.');
        return;
      }
      if (!email.endsWith('@niet.co.in')) {
        toast.error('Access restricted.', {
          description: 'Please use a valid niet.co.in email address to sign up.',
        });
        return;
      }
      handleSignUp();
    } else {
      handleSignIn();
    }
  };

  const supabase = createClient();

  const handleSignUp = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        // This is required for the OTP email to be sent.
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);

    if (error) {
      toast.error('Sign Up Error', { description: error.message });
    } else if (data.user) {
        if(data.user.identities?.length === 0){
             toast.error('Sign Up Error', { description: "A user with this email already exists." });
        } else {
             toast.success('Confirmation email sent!', {
                description: 'Please check your email for your 6-digit verification code.',
            });
            router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
        }
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      toast.error('Sign In Error', { description: error.message });
    } else if (data.session) {
        router.push('/dashboard');
        router.refresh(); // Force a server-side refresh to update session state
    }
  };

  return (
    <div className="font-primary relative min-h-screen w-full overflow-hidden bg-background text-foreground flex flex-col">
      {/* Background Effects */}
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
        <Button variant="ghost" onClick={() => router.push('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="relative">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-soft relative z-10">
              <Code className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="absolute -inset-3 bg-primary/20 rounded-3xl blur-xl -z-10"></div>
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            HackSaathi
          </h1>
        </div>

        <h2 className="text-2xl font-semibold mb-2">{isSignUp ? 'Create a new account' : 'Sign in to your account'}</h2>
        <p className="text-muted-foreground mb-8 max-w-sm">{isSignUp ? 'Join the community of innovators and builders.' : 'Welcome back! Enter your details to continue.'}</p>

        <div className="w-full max-w-sm mx-auto">
          <form onSubmit={handleAuthAction} className="flex flex-col gap-4">
            {isSignUp && (
              <div className="relative w-full">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-6 text-base bg-muted/50 border-border rounded-lg placeholder:text-muted-foreground focus:ring-primary focus:border-primary"
                />
              </div>
            )}
            <div className="relative w-full">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                placeholder="your.name@niet.co.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full pl-12 pr-4 py-6 text-base bg-muted/50 border-border rounded-lg placeholder:text-muted-foreground focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="relative w-full">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-12 pr-4 py-6 text-base bg-muted/50 border-border rounded-lg placeholder:text-muted-foreground focus:ring-primary focus:border-primary"
              />
            </div>

            {!isSignUp && (
              <div className="text-right">
                <Button asChild variant="link" className="text-sm h-auto p-0 text-muted-foreground hover:text-primary">
                    <Link href="/auth/forgot-password">
                        Forgot your password?
                    </Link>
                </Button>
              </div>
            )}

            <Button 
              type="submit"
              size="lg" 
              className="relative w-full py-6 text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(var(--primary)/0.3)] disabled:opacity-50 mt-2"
              disabled={loading}
            >
              <span>{loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}</span>
            </Button>
          </form>
          
          <div className="text-sm text-muted-foreground mt-6">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button onClick={() => setIsSignUp(false)} className="font-semibold text-primary hover:underline">
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button onClick={() => setIsSignUp(true)} className="font-semibold text-primary hover:underline">
                  Sign Up
                </button>
              </>
            )}
          </div>
           <div className="text-xs text-muted-foreground mt-2">
            Only @niet.co.in emails are allowed for sign-up.
          </div>
        </div>
      </main>
    </div>
  );
}