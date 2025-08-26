'use client';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from "@/components/ui/sonner";
import Footer from '@/components/footer';
import { useState } from 'react';
import { usePathname } from "next/navigation";
import Header from "@/components/header";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create a client
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();

  // Ensure pathname is not null before using it
  const authPages = ['/login', '/auth/confirm', '/auth/verify-otp', '/auth/forgot-password', '/auth/update-password'];
  const noNavPages = ['/profile/create', ...authPages];

  const showFooter = pathname ? !noNavPages.includes(pathname) : false;
  const showHeader = pathname ? !['/', ...authPages, '/profile/create'].includes(pathname) : false;


  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          {showHeader && <Header />}
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          {showFooter && <Footer />}
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
