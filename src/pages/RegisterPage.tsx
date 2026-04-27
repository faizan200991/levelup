import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
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
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) { // ~800KB limit for base64 safety
        setError('Image is too large. Please select a file smaller than 800KB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
          photoURL: photoBase64 || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
          createdAt: new Date().toISOString(),
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
        <div className="md:w-1/3 p-10 bg-zinc-950 text-white flex flex-col justify-between">
          <div>
            <div className="bg-white p-2 rounded-xl w-fit shadow-xl mb-12">
              <Code2 className="w-8 h-8 text-zinc-900" />
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight leading-none text-white">
              LEVEL<span className="text-zinc-600">UP</span> <br />
              <span className="text-xl text-zinc-400 font-medium tracking-tight">Tech Console</span>
            </h1>
          </div>
          
          <div className="space-y-4">
            <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">
              <p>System v4.0</p>
              <div className="h-px w-8 bg-zinc-800 my-2" />
              <p>© 2026 LEVELUP</p>
            </div>
          </div>
        </div>

        <div className="md:w-2/3 p-12 overflow-y-auto">
          <div className="mb-10">
            <h2 className="font-display font-bold text-2xl tracking-tight text-zinc-950">Initialize</h2>
            <p className="text-zinc-400 text-[10px] uppercase font-black tracking-widest mt-1">developer_auth_protocol</p>
          </div>
 
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Dev Alias"
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-2xl h-14"
              />
              <Input 
                label="Endpoint"
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-2xl h-14"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Access Key"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                error={error}
                className="rounded-2xl h-14"
              />
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Environment Access</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                      role === 'student' 
                        ? 'border-zinc-950 bg-zinc-950 text-white shadow-xl' 
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
                        ? 'border-zinc-950 bg-zinc-950 text-white shadow-xl' 
                        : 'border-zinc-200 bg-white text-zinc-400 hover:bg-zinc-50 hover:border-zinc-300'
                    }`}
                  >
                    Teacher
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Upload Identity Profile</label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-3xl bg-zinc-100 border-2 border-dashed border-zinc-200 flex items-center justify-center overflow-hidden relative group transition-all hover:bg-zinc-50 hover:border-zinc-300">
                  {photoBase64 ? (
                    <img src={photoBase64} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-zinc-300 text-[8px] font-black text-center p-3 uppercase tracking-tighter">No Image</div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-20"
                  />
                  <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <p className="text-[8px] font-bold text-white uppercase">Replace</p>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">PNG or JPG. Recommended 1:1 ratio. Max 800KB. This identity node will be visible to peers and mentors.</p>
                </div>
              </div>
            </div>
 
            <Button type="submit" className="w-full h-14 rounded-2xl text-base font-bold shadow-2xl shadow-zinc-100 group" isLoading={loading}>
              Create Account <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>
 
          <div className="text-center pt-6">
            <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">
              Existing?{' '}
              <Link to="/login" className="text-zinc-900 font-bold hover:underline transition-all">
                Auth
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
