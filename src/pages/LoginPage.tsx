import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isPlaceholderConfig } from '../lib/supabase';
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
      <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-blue-100 rounded-full blur-[120px] -mr-[30vw] -mt-[30vw] opacity-40 mix-blend-multiply" />
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-zinc-200 rounded-full blur-[100px] -ml-[25vw] -mb-[25vw] opacity-40 mix-blend-multiply" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl glass shadow-advanced rounded-3xl border-white overflow-hidden flex flex-col md:flex-row relative z-10"
      >
        <div className="md:w-5/12 bg-zinc-950 text-white flex flex-col justify-between relative overflow-hidden group">
          {/* Background Image Overlay */}
          <div className="absolute inset-0 z-0 opacity-40">
            <img 
              src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800" 
              alt="Coding Background" 
              className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[10000ms]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-zinc-950/90 to-zinc-950" />
          </div>

          <div className="p-8 pb-4 relative z-10">
            <div className="bg-white p-1.5 rounded-xl w-fit shadow-2xl mb-8 rotate-[-5deg]">
              <Code2 className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="font-display text-3xl lg:text-4xl font-black tracking-tighter leading-none text-white">
              LEARN.<br />
              <span className="text-blue-500">GROW.</span>
            </h1>
            <p className="mt-4 text-sm text-zinc-400 font-medium tracking-tight leading-relaxed max-w-[220px]">
              Access your classroom, code together, and grow with your peers.
            </p>
          </div>
          
          <div className="p-8 relative z-10 space-y-2">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em]">Virtual School Online</span>
             </div>
             <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.15em]">© 2026 LEVELUP EDUCATION</p>
          </div>
        </div>

        <div className="md:w-7/12 p-8 lg:p-10 bg-white/85 backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="font-display font-black text-2xl tracking-tighter text-zinc-900 mb-1 underline decoration-blue-500/30 decoration-8 underline-offset-[-2px]">WELCOME BACK</h2>
            <p className="text-zinc-400 text-[10px] uppercase font-black tracking-[0.25em]">Sign in to start learning</p>
          </div>

          {isPlaceholderConfig && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs font-normal leading-relaxed space-y-3 shadow-md"
            >
              <div className="flex items-center gap-2 text-amber-700 font-bold uppercase tracking-wider text-[10px]">
                <span className="p-1 bg-amber-200 rounded-lg">⚠️</span>
                <span>Vercel Configuration Missing</span>
              </div>
              <p className="opacity-90">
                It looks like you deployed this project to Vercel without configuring your backend connection!
              </p>
              <p className="opacity-90 font-medium">To fix this and allow accounts/sign-ups to work, follow these steps:</p>
              <ol className="list-decimal pl-4 space-y-2 opacity-90 text-[11px]">
                <li>Go to your project on the <strong>Vercel Dashboard</strong>.</li>
                <li>Navigate to <strong>Settings ➔ Environment Variables</strong>.</li>
                <li>Add the following two keys with your Supabase values:
                  <div className="mt-1.5 p-2 bg-amber-100/60 rounded-xl font-mono text-[10px] text-amber-950 space-y-1 select-all select-text">
                    <div>Key: <code className="font-bold">VITE_SUPABASE_URL</code></div>
                    <div>Key: <code className="font-bold">VITE_SUPABASE_ANON_KEY</code></div>
                  </div>
                </li>
                <li>Go to the <strong>Deployments</strong> tab and select <strong>Redeploy</strong> from the latest deployment menu to build the changes.</li>
              </ol>
            </motion.div>
          )}
  
          <form onSubmit={handleLogin} className="space-y-4">
            <Input 
              label="Email Address"
              type="email"
              placeholder="student@levelup.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl h-11 text-xs font-semibold border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-blue-500 transition-all placeholder:opacity-40"
            />
            <div className="space-y-1.5">
              <Input 
                label="Password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                error={error}
                className="rounded-xl h-11 text-xs border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-blue-500 transition-all"
              />
              <div className="flex justify-end pr-1">
                <Link 
                  to="/forgot-password" 
                  className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400 hover:text-blue-600 transition-all"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>
 
            <Button type="submit" size="md" className="w-full h-11 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-100 bg-zinc-900 hover:bg-zinc-800 text-white group" isLoading={loading}>
              Log In Now <ArrowRight className="w-3.5 h-3.5 ml-2.5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-100"></div>
              </div>
              <div className="relative flex justify-center text-[8px] uppercase font-black tracking-[0.3em]">
                <span className="bg-white px-4 text-zinc-300">Or log in with</span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-11 rounded-xl text-xs font-black uppercase tracking-[0.2em] border-zinc-100 hover:bg-zinc-50 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
              onClick={handleGoogleLogin}
              isLoading={googleLoading}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </Button>
          </form>
  
          <div className="text-center pt-6">
            <p className="text-zinc-400 text-[10px] uppercase font-black tracking-[0.2em] flex items-center justify-center gap-3">
              New to LEVELUP?
              <Link to="/register" className="text-blue-600 font-bold hover:underline transition-all underline decoration-2 underline-offset-4">
                Create your Account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
