import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { BookOpen, ArrowLeft, Globe, Plus } from 'lucide-react';
import { motion } from 'motion/react';

import DashboardLayout from '../components/DashboardLayout';

export default function CreateClassroom() {
  const { user } = useAuth();
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className || !user) return;
    setLoading(true);
    try {
      const roomCode = generateRoomCode();
      const docRef = await addDoc(collection(db, 'classes'), {
        className,
        teacherId: user.uid,
        roomCode,
        createdAt: new Date().toISOString(),
        studentIds: []
      });
      navigate(`/classroom/${docRef.id}`);
    } catch (err) {
      console.error('Error creating class:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto pt-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-200 p-10"
        >
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="bg-zinc-900 p-4 rounded-2xl mb-6 shadow-lg shadow-zinc-200">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display font-bold text-3xl tracking-tight text-zinc-900">
              Launch Your Classroom
            </h1>
            <p className="text-zinc-500 mt-2 text-lg">
              Set up a shared coding environment for your students in seconds.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest pl-1">
                Classroom Identity
              </label>
              <Input 
                placeholder="e.g. Advanced Data Structures"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
                autoFocus
                className="h-14 text-lg px-6 rounded-2xl border-2 focus:border-zinc-900 transition-all"
              />
            </div>

            <div className="bg-zinc-50 p-6 rounded-2xl border-2 border-zinc-100 border-dashed">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Automatic Room Sync
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                We'll generate a unique 6-character room code. Students can join instantly without needing manual invites.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button type="submit" className="w-full h-14 text-lg rounded-2xl shadow-lg shadow-zinc-200" isLoading={loading}>
                Create Classroom
              </Button>
              <Button type="button" variant="ghost" className="w-full h-14" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
