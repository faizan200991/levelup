import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Code2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        navigate('/dashboard');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;
      if (data.user) {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to login';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const { data, error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true
        }
      });
      if (googleError) throw googleError;

      if (data?.url) {
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(
          data.url,
          'google_login_popup',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        if (!popup) {
          setError('Popup blocked! Please allow popups for this site.');
          setGoogleLoading(false);
          return;
        }

        // Poll to check if popup is closed
        const pollTimer = window.setInterval(() => {
          if (popup.closed) {
            window.clearInterval(pollTimer);
            setGoogleLoading(false);
          }
        }, 1000);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to login with Google';
      setError(message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-zinc-100 rounded-full blur-3xl -mr-[25vw] -mt-[25vw] opacity-50" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-zinc-100 rounded-full blur-3xl -ml-[20vw] -mb-[20vw] opacity-50" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl bg-white rounded-[2rem] shadow-[0_32px_64px_rgba(0,0,0,0.06)] border border-zinc-200 overflow-hidden flex flex-col md:flex-row relative z-10"
      >
        <div className="md:w-1/2 bg-zinc-950 text-white flex flex-col justify-between relative overflow-hidden group">
          {/* Background Image Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1000" 
              alt="Coding Background" 
              className="w-full h-full object-cover opacity-40 brightness-110 transition-transform duration-[5000ms] group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-zinc-950/80 to-zinc-950" />
          </div>

          <div className="p-8 pr-16 relative z-10">
            <div className="bg-white p-1.5 rounded-xl w-fit shadow-xl mb-8">
              <Code2 className="w-6 h-6 text-zinc-900" />
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-black tracking-tight leading-[0.9] text-white">
              WELCOME<br />
              <span className="text-blue-500">BACK</span>
            </h1>
            <p className="mt-4 text-lg lg:text-xl text-zinc-400 font-medium tracking-tight">LevelUp Classroom</p>
          </div>
          
          <div className="p-8 relative z-10 space-y-3 text-[10px] text-zinc-500 font-black uppercase tracking-widest">
            <p className="text-white/60">Unlock your potential</p>
            <div className="h-px w-6 bg-zinc-800" />
            <p>© 2026 LEVELUP</p>
          </div>
        </div>

        <div className="md:w-1/2 p-8">
          <div className="mb-8">
            <h2 className="font-display font-bold text-xl tracking-tight text-zinc-950">Hello Again!</h2>
            <p className="text-zinc-400 text-[10px] uppercase font-black tracking-widest mt-1">Sign in to your account</p>
          </div>
 
          <form onSubmit={handleLogin} className="space-y-4">
            <Input 
              label="Email Address"
              type="email"
              placeholder="e.g. john@student.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl h-11 text-sm"
            />
            <Input 
              label="Password"
              type="password"
              placeholder="Your Secret Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              error={error}
              className="rounded-xl h-11 text-sm"
            />
 
            <Button type="submit" className="w-full h-12 rounded-xl text-sm font-bold shadow-xl bg-zinc-950 hover:bg-zinc-900 text-white group" isLoading={loading}>
              Sign In <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                <span className="bg-white px-4 text-zinc-400">Or continue with</span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-12 rounded-xl text-sm font-bold border-zinc-200 hover:bg-zinc-50 flex items-center justify-center gap-3 shadow-sm transition-all active:scale-[0.98]"
              onClick={handleGoogleLogin}
              isLoading={googleLoading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </form>
 
          <div className="text-center pt-6">
            <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 font-bold hover:underline transition-all">
                Create One
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
