'use client';
import { AdminLayout } from "@/components/admin/AdminLayout";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (error || profile?.role !== 'admin') {
        // If not admin, redirect to the main dashboard, not the login page
        router.push('/dashboard');
      } else {
        setIsAdmin(true);
      }
      setLoading(false);
    };
    checkAdmin();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="ml-4">Verifying access...</p>
      </div>
    );
  }

  // Only render the AdminLayout and children if the user is a confirmed admin
  return isAdmin ? <AdminLayout>{children}</AdminLayout> : null;
}
