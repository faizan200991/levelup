import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isPlaceholderConfig } from '../lib/supabase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Code2, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
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

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full md:w-2/5 lg:w-1/3 md:min-h-screen bg-zinc-950 text-white flex flex-col justify-between relative overflow-hidden group"
      >
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200" 
            alt="Coding Background" 
            className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[10000ms]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-zinc-950/90 to-zinc-950" />
        </div>

        <div className="p-8 lg:p-12 pb-4 relative z-10">
          <Link to="/" className="bg-white p-1.5 rounded-xl w-fit shadow-2xl mb-8 rotate-[-5deg] block hover:rotate-0 transition-transform duration-300">
            <Code2 className="w-6 h-6 text-blue-600" />
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white/80 transition-colors mb-4">
            <ArrowLeft className="w-3 h-3" /> Back to Home
          </Link>
          <h1 className="font-display text-4xl lg:text-6xl font-black tracking-tighter leading-none text-white">
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
      </motion.div>

      <div className="w-full md:w-3/5 lg:w-2/3 min-h-screen bg-white flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
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
      </div>
    </div>
  );
}
