import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Code2, ArrowRight } from 'lucide-react';
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
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      try {
        await setDoc(doc(db, 'users', user.uid), {
          name,
          email,
          role,
          photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
          createdAt: new Date().toISOString(),
          bio: '',
          learningPath: 'Software Engineer',
          learningPathSubtitle: 'Mastering Web Development & Databases',
          location: 'Global Remote',
          locationSubtitle: 'Learning across borders',
          classStatus: 'Active Member',
          classStatusSubtitle: 'Engaging in collaborative classrooms',
          lastActive: new Date().toISOString()
        });
      } catch (dbErr) {
        handleFirestoreError(dbErr, OperationType.WRITE, `users/${user.uid}`);
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Create new user profile with selected role
        try {
          await setDoc(doc(db, 'users', user.uid), {
            name: user.displayName || 'Google User',
            email: user.email || '',
            role,
            photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
            createdAt: new Date().toISOString(),
            bio: '',
            learningPath: 'Software Engineer',
            learningPathSubtitle: 'Mastering Web Development & Databases',
            location: 'Global Remote',
            locationSubtitle: 'Learning across borders',
            classStatus: 'Active Member',
            classStatusSubtitle: 'Engaging in collaborative classrooms',
            lastActive: new Date().toISOString()
          });
        } catch (dbErr) {
          handleFirestoreError(dbErr, OperationType.WRITE, `users/${user.uid}`);
        }
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to register with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4 relative overflow-hidden">
      {/* Background blobs for depth */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-zinc-100 rounded-full blur-3xl -mr-[25vw] -mt-[25vw] opacity-50" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-zinc-100 rounded-full blur-3xl -ml-[20vw] -mb-[20vw] opacity-50" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl bg-white rounded-[2rem] shadow-[0_32px_64px_rgba(0,0,0,0.06)] border border-zinc-200 overflow-hidden flex flex-col md:flex-row relative z-10"
      >
        <div className="md:w-1/3 bg-zinc-950 text-white flex flex-col justify-between relative overflow-hidden group">
          {/* Background Image Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000" 
              alt="Coding Background" 
              className="w-full h-full object-cover opacity-40 brightness-110 transition-transform duration-[6000ms] group-hover:scale-125"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 via-zinc-950/90 to-zinc-950" />
          </div>

          <div className="p-10 pr-20 relative z-10">
            <div className="bg-white p-2 rounded-xl w-fit shadow-xl mb-12">
              <Code2 className="w-8 h-8 text-zinc-900" />
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-black tracking-tight leading-[0.9] text-white">
              LEVEL<br />
              <span className="text-blue-500">UP</span>
            </h1>
            <p className="mt-4 text-lg lg:text-xl text-zinc-400 font-medium tracking-tight">Classroom Account here</p>
          </div>
          
          <div className="p-10 relative z-10 space-y-4">
            <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">
              <p className="text-white/60">Join the elite</p>
              <div className="h-px w-8 bg-zinc-800 my-2" />
              <p>© 2026 LEVELUP</p>
            </div>
          </div>
        </div>

        <div className="md:w-2/3 p-12 overflow-y-auto">
          <div className="mb-10">
            <h2 className="font-display font-bold text-2xl tracking-tight text-zinc-950">Create Your Profile</h2>
            <p className="text-zinc-400 text-[10px] uppercase font-black tracking-widest mt-1">Please fill in your details below</p>
          </div>
 
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Your Full Name"
                type="text"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-2xl h-14"
              />
              <Input 
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-2xl h-14"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                error={error}
                className="rounded-2xl h-14"
              />
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">I am a...</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                      role === 'student' 
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xl' 
                        : 'border-zinc-200 bg-white text-zinc-400 hover:bg-zinc-50 hover:border-zinc-300'
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`py-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                      role === 'teacher' 
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xl' 
                        : 'border-zinc-200 bg-white text-zinc-400 hover:bg-zinc-50 hover:border-zinc-300'
                    }`}
                  >
                    Teacher
                  </button>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-14 rounded-2xl text-base font-bold shadow-2xl bg-zinc-950 hover:bg-zinc-900 text-white group" isLoading={loading}>
              Create Account <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                <span className="bg-white px-4 text-zinc-400">Or Register with</span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-14 rounded-2xl text-base font-bold border-zinc-200 hover:bg-zinc-50 flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-sm"
              onClick={handleGoogleRegister}
              isLoading={googleLoading}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
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
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-bold hover:underline transition-all">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
