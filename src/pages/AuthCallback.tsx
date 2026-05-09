import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  useEffect(() => {
    const handleAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Notify parent window
        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', session }, window.location.origin);
          window.close();
        } else {
          // Fallback if not in a popup
          window.location.href = '/dashboard';
        }
      }
    };

    handleAuth();

    // Also listen for auth changes just in case
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && window.opener) {
        window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', session }, window.location.origin);
        window.close();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-medium">Completing authentication...</p>
      </div>
    </div>
  );
}
