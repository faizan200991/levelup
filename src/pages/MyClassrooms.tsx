import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { ClassRoom, DBClassroom } from '../types';
import Loader from '../components/Loader';
import { BookOpen, Search, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { getLanguageIcon } from '../lib/utils';
import DashboardLayout from '../components/DashboardLayout';
import { Input } from '../components/Input';

export default function MyClassrooms() {
  const { user, profile } = useAuth();
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchClasses = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: teacherData, error: tError } = await supabase
        .from('classrooms')
        .select('*')
        .eq('teacher_id', user.id);
      
      if (tError) throw tError;

      const { data: enrollData, error: eError } = await supabase
        .from('enrollments')
        .select('classrooms(*)')
        .eq('student_id', user.id);
      
      if (eError) throw eError;

      const teacherClasses = (teacherData || []).map(c => ({
        id: c.id,
        className: c.class_name,
        roomCode: c.room_code,
        teacherId: c.teacher_id,
        createdAt: c.created_at
      } as ClassRoom));

      const studentClasses = (enrollData || [])
        .map((e: { classrooms: unknown }) => e.classrooms as DBClassroom)
        .filter(Boolean)
        .map((c) => ({
          id: c.id,
          className: c.class_name,
          roomCode: c.room_code,
          teacherId: c.teacher_id,
          createdAt: c.created_at
        } as ClassRoom));

      const allClassIds = new Set(teacherClasses.map(c => c.id));
      const combinedClasses = [...teacherClasses, ...studentClasses.filter(c => !allClassIds.has(c.id))];
      
      const classesWithLanguage = await Promise.all(combinedClasses.map(async (cls) => {
        try {
          const { data: probData } = await supabase
            .from('problems')
            .select('language')
            .eq('classroom_id', cls.id)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (probData && probData.length > 0) {
            return { ...cls, language: probData[0].language };
          }
        } catch (e) {
          console.error("Error fetching language for class", cls.id, e);
        }
        return cls;
      }));
      
      setClasses(classesWithLanguage as (ClassRoom & { language?: string })[]);
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClasses();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchClasses]);

  const filteredClasses = classes.filter(cls => 
    cls.className.toLowerCase().includes(search.toLowerCase()) ||
    cls.roomCode.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loader fullScreen />;

  return (
    <DashboardLayout>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12"
      >
        <div>
          <h1 className="font-display text-4xl font-bold text-black tracking-tighter leading-none">
            My <br />
            <span className="text-blue-600 uppercase">Classrooms.</span>
          </h1>
          <p className="text-zinc-600 mt-4 text-base font-medium tracking-tight">
            Manage and access all your learning spaces in one place.
          </p>
        </div>

        <div className="w-full md:w-80">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
            <Input 
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-12 bg-white rounded-2xl border-zinc-100 shadow-xl focus:ring-blue-500"
            />
          </div>
        </div>
      </motion.div>

      {filteredClasses.length === 0 ? (
        <div className="bg-zinc-50/50 rounded-[4rem] border-2 border-dashed border-zinc-100 p-24 text-center">
          <div className="bg-white w-20 h-20 rounded-[1.5rem] shadow-xl border border-zinc-50 flex items-center justify-center mx-auto mb-8">
            <BookOpen className="w-8 h-8 text-zinc-200" />
          </div>
          <h3 className="font-display font-bold text-2xl text-black tracking-tight">No classrooms found</h3>
          <p className="text-zinc-600 mt-2 font-medium">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredClasses.map((cls, idx) => (
            <Link key={cls.id} to={`/classroom/${cls.id}`}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * idx, duration: 0.4 }}
                className="group bg-white p-6 rounded-3xl border border-zinc-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(59,130,246,0.05)] hover:border-blue-100 transition-all duration-300 relative h-full flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center border border-zinc-50 p-2 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                    {cls.language ? (
                      <img 
                        src={getLanguageIcon(cls.language)} 
                        alt="" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <BookOpen className="w-4 h-4 text-zinc-300" />
                    )}
                  </div>
                  <div className="px-2.5 py-1 bg-zinc-50 rounded-lg border border-zinc-100 group-hover:bg-blue-50 group-hover:border-blue-100 group-hover:text-blue-600 transition-all">
                     <span className="text-[10px] font-mono font-black text-zinc-700 uppercase tracking-widest group-hover:text-blue-600">
                       {cls.roomCode}
                     </span>
                  </div>
                </div>
                
                <h3 className="font-display font-bold text-xl text-black tracking-tight mb-2 group-hover:text-blue-600 transition-colors">
                  {cls.className}
                </h3>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-6">
                  {profile?.role === 'teacher' ? 'TEACHER' : 'ENROLLED STUDENT'}
                </p>

                <div className="mt-auto pt-4 border-t border-zinc-50 flex items-center justify-between">
                   <span className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest group-hover:text-zinc-600">Enter Class</span>
                   <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center shadow-sm text-zinc-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                     <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                   </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
