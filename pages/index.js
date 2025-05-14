import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Check for existing auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        // Fetch user profile (first and last name)
        supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (!error && data) setProfile(data);
          });
        // Show welcome then redirect
        setTimeout(() => router.push('/matches'), 2000);
      } else {
        router.push('/login');
      }
    });
  }, [router]);

  // Wait until session and profile are loaded
  if (session === null || profile === null) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
      <div className="w-full max-w-md bg-black/30 backdrop-blur-sm rounded-xl p-8 border border-white/20 shadow-xl text-center text-white text-2xl">
        Welcome back {profile.first_name} {profile.last_name}!
      </div>
    </div>
  );
}