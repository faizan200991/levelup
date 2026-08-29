import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isPlaceholderConfig } from '../lib/supabase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Code2, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { UserRole } from '../types';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      });

      if (signUpError) throw signUpError;
      
      if (data.user) {
        if (data.session) {
          navigate('/dashboard');
        } else {
          setMessage('Confirmation email sent! Please verify your email to continue.');
          setLoading(false);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to register';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
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
      const message = err instanceof Error ? err.message : 'Failed to register with Google';
      setError(message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-blue-100 rounded-full blur-[120px] -mr-[30vw] -mt-[30vw] opacity-40 mix-blend-multiply" />
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-zinc-200 rounded-full blur-[100px] -ml-[25vw] -mb-[25vw] opacity-40 mix-blend-multiply" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl glass shadow-advanced rounded-3xl border-white overflow-hidden flex flex-col md:flex-row relative z-10"
      >
        <div className="md:w-4/12 bg-zinc-950 text-white flex flex-col justify-between relative overflow-hidden group border-r border-white/10">
          {/* Background Image Overlay */}
          <div className="absolute inset-0 z-0 opacity-45">
            <img 
              src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800" 
              alt="Coding Background" 
              className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[10000ms]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-zinc-950/90 to-zinc-950" />
          </div>

          <div className="p-8 pb-4 relative z-10">
            <Link to="/" className="bg-white p-1.5 rounded-xl w-fit shadow-2xl mb-8 rotate-[-5deg] block hover:rotate-0 transition-transform duration-300">
              <Code2 className="w-6 h-6 text-blue-600" />
            </Link>
            <Link to="/" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white/80 transition-colors mb-4">
              <ArrowLeft className="w-3 h-3" /> Back to Home
            </Link>
            <h1 className="font-display text-3xl lg:text-4xl font-black tracking-tighter leading-none text-white">
              JOIN<br />
              <span className="text-blue-500">NOW.</span>
            </h1>
            <p className="mt-4 text-sm text-zinc-400 font-medium tracking-tight leading-relaxed max-w-[220px]">
              Create your account to start learning and coding with your class!
            </p>
          </div>
          
          <div className="p-8 relative z-10 space-y-2">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
                <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em]">Ready to Join</span>
             </div>
             <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.15em]">© 2026 LEVELUP EDUCATION</p>
          </div>
        </div>

        <div className="md:w-8/12 p-8 lg:p-10 bg-white/85 backdrop-blur-xl flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="font-display font-black text-2xl tracking-tighter text-zinc-900 mb-1 underline decoration-blue-500/30 decoration-8 underline-offset-[-2px]">CREATE ACCOUNT</h2>
            <p className="text-zinc-400 text-[10px] uppercase font-black tracking-[0.25em]">Fill in your details to start learning</p>
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
  
          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest"
              >
                {error}
              </motion.div>
            )}
            {message && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest"
              >
                {message}
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Your Name"
                type="text"
                placeholder="e.g. Alex Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-xl h-11 text-xs font-semibold border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-blue-500 transition-all placeholder:opacity-40"
              />
              <Input 
                label="Email Address"
                type="email"
                placeholder="student@levelup.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl h-11 text-xs font-semibold border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-blue-500 transition-all placeholder:opacity-40"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-xl h-11 text-xs border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-blue-500 transition-all font-medium"
              />
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 ml-1">Account Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`h-11 rounded-xl border text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center ${
                      role === 'student' 
                        ? 'border-blue-600 bg-zinc-950 text-white shadow-lg' 
                        : 'border-zinc-100 bg-zinc-50/50 text-zinc-400 hover:bg-white hover:border-zinc-200'
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`h-11 rounded-xl border text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center ${
                      role === 'teacher' 
                        ? 'border-blue-600 bg-zinc-950 text-white shadow-lg' 
                        : 'border-zinc-100 bg-zinc-50/50 text-zinc-400 hover:bg-white hover:border-zinc-200'
                    }`}
                  >
                    Teacher
                  </button>
                </div>
              </div>
            </div>
 
            <Button type="submit" size="md" className="w-full h-11 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-100 bg-zinc-900 hover:bg-zinc-800 text-white group" isLoading={loading}>
              Create Account <ArrowRight className="w-4 h-4 ml-2.5 group-hover:translate-x-1 transition-transform" />
            </Button>
 
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-100"></div>
              </div>
              <div className="relative flex justify-center text-[8px] uppercase font-black tracking-[0.3em]">
                <span className="bg-white px-4 text-zinc-300">Or quick sign up with</span>
              </div>
            </div>
 
            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-11 rounded-xl text-xs font-black uppercase tracking-[0.2em] border-zinc-100 hover:bg-zinc-50 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
              onClick={handleGoogleRegister}
              isLoading={googleLoading}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign up with Google
            </Button>
          </form>
 
          <div className="text-center pt-6">
            <p className="text-zinc-400 text-[10px] uppercase font-black tracking-[0.2em] flex items-center justify-center gap-3">
              Already have an account?
              <Link to="/login" className="text-blue-600 font-bold hover:underline transition-all underline decoration-2 underline-offset-4">
                Log In here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
