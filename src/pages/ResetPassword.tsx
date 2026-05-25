import React, { useState } from 'react';
import { Lock, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      // Automatically redirect after 3 seconds
      setTimeout(() => navigate('/auth'), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 sm:p-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px]"
      >
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-6 shadow-xl shadow-zinc-200">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 mb-2">Set New Password</h1>
          <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest leading-relaxed">
            Choose a new strong password to log into your classroom.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!success ? (
            <motion.form 
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit} 
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-black tracking-[0.15em] text-zinc-400 uppercase ml-1">New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-zinc-900 transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-50 border-2 border-zinc-50 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:bg-white focus:border-zinc-900 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black tracking-[0.15em] text-zinc-400 uppercase ml-1">Confirm New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-zinc-900 transition-colors" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-50 border-2 border-zinc-50 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:bg-white focus:border-zinc-900 outline-none transition-all"
                  />
                </div>
              </div>

              {error && (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[54px] bg-zinc-900 text-white rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-zinc-200"
              >
                {loading ? (
                   <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                ) : (
                  <span className="text-[11px] font-black uppercase tracking-[0.25em]">Change Password</span>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-zinc-900 text-white rounded-3xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-black tracking-tight mb-2">Password Updated!</h3>
              <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-[0.2em] leading-relaxed mb-6">
                Your password has been changed successfully. You will be redirected shortly...
              </p>
              <Link 
                to="/auth"
                className="inline-block py-3 px-8 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all"
              >
                Login Now
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
