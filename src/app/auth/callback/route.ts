'use server';

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient();
    const { error, data: { session } } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && session) {
      // Check if the user has a profile already
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        // An actual error occurred, other than no rows found
        console.error('Error fetching profile:', profileError);
        // Redirect to an error page or show a message
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
      }
      
      if (!profile) {
        // This is a new user, redirect them to the profile creation page
        return NextResponse.redirect(`${origin}/profile/create`);
      }

      // Returning user, redirect to the dashboard
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
