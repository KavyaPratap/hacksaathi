'use client';
import { AdminDashboard } from '@/components/admin-dashboard';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminDashboardPage() {
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

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return null;
}

    