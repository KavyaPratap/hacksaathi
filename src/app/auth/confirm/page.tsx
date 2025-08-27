'use client';

import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AuthConfirmPage() {
  const router = useRouter();

  return (
    <div className="font-primary relative min-h-screen w-full overflow-hidden bg-background text-foreground flex flex-col items-center justify-center">
      <div className="absolute top-0 z-[0] h-full w-full bg-background">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[100px] animate-pulse"></div>
        <div className="pointer-events-none absolute h-full w-full overflow-hidden opacity-70 [perspective:500px]">
          <div className="absolute inset-0 [transform:rotateX(45deg)]">
            <div className="absolute animate-grid [inset:0%_0px] [margin-left:-50%] [height:300vh] [width:600vw] [transform-origin:100%_0_0] [background-image:linear-gradient(to_right,hsl(var(--primary)/0.1)_1px,transparent_0),linear-gradient(to_bottom,hsl(var(--primary)/0.05)_1px,transparent_0)] [background-size:100px_100px] [background-repeat:repeat]"></div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent to-70%"></div>
        </div>
      </div>
      
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="inline-flex items-center gap-3 mb-6">
            <div className="relative">
                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center shadow-soft relative z-10">
                    <Mail className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="absolute -inset-3 bg-primary/20 rounded-3xl blur-xl -z-10"></div>
            </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">Check your email</h1>
        <p className="text-muted-foreground max-w-md mb-8">
            We've sent a verification email to your address. Please click the link inside to complete your registration. If you don't see it, check your spam folder.
        </p>
        <Button onClick={() => router.push('/login')}>
            Back to Login
        </Button>
      </main>
    </div>
  );
}
