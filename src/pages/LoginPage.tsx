import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Code2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
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
        <div className="md:w-1/2 p-8 bg-zinc-950 text-white flex flex-col justify-between">
          <div>
            <div className="bg-white p-1.5 rounded-xl w-fit shadow-xl mb-8">
              <Code2 className="w-6 h-6 text-zinc-900" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight leading-none text-white">
              ACCESS<span className="text-zinc-600">HUB</span> <br />
              <span className="text-xl text-zinc-400 font-medium tracking-tight">Technical Workspace</span>
            </h1>
          </div>
          
          <div className="space-y-3 text-[10px] text-zinc-500 font-black uppercase tracking-widest">
            <p>System v4.0</p>
            <div className="h-px w-6 bg-zinc-800" />
            <p>© 2026 LEVELUP</p>
          </div>
        </div>

        <div className="md:w-1/2 p-8">
          <div className="mb-8">
            <h2 className="font-display font-bold text-xl tracking-tight text-zinc-950">Welcome back</h2>
            <p className="text-zinc-400 text-[10px] uppercase font-black tracking-widest mt-1">Verify your credentials</p>
          </div>
 
          <form onSubmit={handleLogin} className="space-y-4">
            <Input 
              label="Endpoint"
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl h-11 text-sm"
            />
            <Input 
              label="Access Key"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              error={error}
              className="rounded-xl h-11 text-sm"
            />
 
            <Button type="submit" className="w-full h-12 rounded-xl text-sm font-bold shadow-xl shadow-zinc-100 group" isLoading={loading}>
              Sign In <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>
 
          <div className="text-center pt-6">
            <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">
              New developer?{' '}
              <Link to="/register" className="text-zinc-900 font-bold hover:underline transition-all">
                Join Network
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
