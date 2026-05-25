import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
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
        <Link 
          to="/auth" 
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-900 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
          Back to Login
        </Link>

        <div className="mb-10">
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 mb-2">Reset Password</h1>
          <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest leading-relaxed">
            Forgot your password? No worries! Enter your email and we'll send you a link to pick a new one.
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
                <label className="text-[10px] font-black tracking-[0.15em] text-zinc-400 uppercase ml-1">Your Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-zinc-900 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@levelup.com"
                    className="w-full bg-zinc-50 border-2 border-zinc-50 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium placeholder:text-zinc-300 focus:bg-white focus:border-zinc-900 outline-none transition-all"
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
                  <span className="text-[11px] font-black uppercase tracking-[0.25em]">Send Reset Link</span>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-black tracking-tight text-zinc-900 mb-2">Email Sent!</h3>
              <p className="text-[11px] font-medium text-emerald-700/80 uppercase tracking-widest leading-relaxed mb-6">
                Please check your email inbox for a link to reset your password!
              </p>
              <Link 
                to="/auth"
                className="inline-block py-3 px-8 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all"
              >
                Sign In Now
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
