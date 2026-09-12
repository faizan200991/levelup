import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ClassRoom, DBClassroom } from '../types';
import Loader from '../components/Loader';
import { Plus, BookOpen, Activity, ArrowRight, CheckCircle, FileText, Code, Sparkles, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { cn, getLanguageIcon, getLanguageColor } from '../lib/utils';

import DashboardLayout from '../components/DashboardLayout';

interface ActivityItem {
  id: string;
  type: 'submission' | 'problem' | 'resource';
  title: string;
  className: string;
  timestamp: string;
  classId: string;
  status?: string;
  language?: string;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [classes, setClasses] = useState<(ClassRoom & { language?: string; problemCount?: number; studentCount?: number })[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomCode, setRoomCode] = useState(() => searchParams.get('join')?.toUpperCase() || '');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const fetchClasses = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch classes where user is teacher
      const { data: teacherClassesData, error: teacherError } = await supabase
        .from('classrooms')
        .select('*')
        .eq('teacher_id', user.id);

      if (teacherError) throw teacherError;

      // Fetch classes where user is student (enrolled)
      const { data: studentEnrollments, error: studentError } = await supabase
        .from('enrollments')
        .select('classroom_id, classrooms(*)')
        .eq('student_id', user.id);

      if (studentError) throw studentError;

      const studentClassesData = (studentEnrollments || []).map(e => e.classrooms).filter(Boolean);
      
      // Combine and filter unique
      const combined: DBClassroom[] = [...(teacherClassesData as unknown as DBClassroom[] || [])];
      (studentClassesData as unknown as DBClassroom[]).forEach((sc) => {
        if (sc && !combined.find((c) => c.id === sc.id)) {
          combined.push(sc);
        }
      });

      const formattedClasses = combined.map(c => ({
        id: c.id,
        className: c.class_name,
        teacherId: c.teacher_id,
        roomCode: c.room_code,
        createdAt: c.created_at
      } as ClassRoom));

      // Fetch most recent problem language + counts for each class to show on the card
      const classesWithLanguage = await Promise.all(formattedClasses.map(async (cls) => {
        const { data: prob } = await supabase
          .from('problems')
          .select('language')
          .eq('classroom_id', cls.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { count: problemCount } = await supabase
          .from('problems')
          .select('*', { count: 'exact', head: true })
          .eq('classroom_id', cls.id);

        const { count: studentCount } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('classroom_id', cls.id);
        
        return { ...cls, language: prob?.language, problemCount: problemCount ?? 0, studentCount: studentCount ?? 0 };
      }));
      
      setClasses(classesWithLanguage);
      
      // Parallelize activity fetching for better performance
      const activityPromises = formattedClasses.map(async (cls) => {
        const classActivity: ActivityItem[] = [];
        if (cls.teacherId === user.id) {
          // Teacher activity: recent submissions
          const { data: subs } = await supabase
            .from('submissions')
            .select('*, profiles(name), problems(title)')
            .eq('problems.classroom_id', cls.id)
            .order('submitted_at', { ascending: false })
            .limit(3);
          
          subs?.forEach(s => {
            classActivity.push({
              id: s.id,
              type: 'submission',
              title: `New submission from ${s.profiles?.name || 'Student'}`,
              className: cls.className,
              timestamp: s.submitted_at,
              classId: cls.id,
              status: s.status
            });
          });
        } else {
          // Student activity: recent problems
          const { data: probs } = await supabase
            .from('problems')
            .select('*')
            .eq('classroom_id', cls.id)
            .order('created_at', { ascending: false })
            .limit(2);
          
          probs?.forEach(p => {
            classActivity.push({
              id: p.id,
              type: 'problem',
              title: `New Problem: ${p.title}`,
              className: cls.className,
              timestamp: p.created_at,
              classId: cls.id,
              language: p.language
            });
          });
        }
        return classActivity;
      });

      const allActivityResults = await Promise.all(activityPromises);
      const allActivity = allActivityResults.flat();
      
      setActivities(allActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Error connecting to database. Please check your configuration.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleJoinClass = React.useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!roomCode || !user) return;
    setJoining(true);
    setError('');
    try {
      const { data: classroom, error: fetchError } = await supabase
        .from('classrooms')
        .select('id')
        .eq('room_code', roomCode.toUpperCase())
        .single();
      
      if (fetchError || !classroom) {
        setError('Classroom not found. Please check the code.');
        return;
      }

      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          student_id: user.id,
          classroom_id: classroom.id
        });

      if (enrollError) {
        if (enrollError.code === '23505') { // Unique constraint violation
          navigate(`/classroom/${classroom.id}`);
          return;
        }
        throw enrollError;
      }

      navigate(`/classroom/${classroom.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to join classroom');
    } finally {
      setJoining(false);
    }
  }, [roomCode, user, navigate]);



  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClasses();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchClasses]);

  useEffect(() => {
    const autoJoinCode = searchParams.get('join');
    if (autoJoinCode && user && profile?.role === 'student' && !joining) {
      const timer = setTimeout(() => {
        handleJoinClass();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, profile, searchParams, joining, handleJoinClass]);

  // Generate "due in the next 24h" digest notifications once per browser
  // session. The RPC itself is idempotent (won't duplicate), but we still
  // gate on sessionStorage so a student navigating around the app doesn't
  // re-trigger the check on every Dashboard remount.
  useEffect(() => {
    if (!user || profile?.role !== 'student') return;
    const flagKey = `due_soon_checked_${user.id}`;
    if (sessionStorage.getItem(flagKey)) return;
    sessionStorage.setItem(flagKey, '1');
    supabase.rpc('check_due_soon_notifications', { p_student_id: user.id })
      .then(({ error }) => {
        if (error) console.error('Due-soon digest check failed:', error);
      });
  }, [user, profile]);


  const momentumQuote = React.useMemo(() => {
    const quotes = [
      { text: "Consistency is more important than perfection.", author: "Coding Wisdom" },
      { text: "Small progress is still progress.", author: "Dev Mentor" },
      { text: "The secret to getting ahead is getting started.", author: "Mark Twain" },
      { text: "Every great developer you know got there by solving problems they were unqualified to solve.", author: "Patrick McKenzie" },
      { text: "Code is like humor. When you have to explain it, it’s bad.", author: "Cory House" }
    ];
    // eslint-disable-next-line react-hooks/purity
    return quotes[Math.floor(Math.random() * quotes.length)];
  }, []);

  if (loading) return <Loader fullScreen />;

  return (
    <DashboardLayout>
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 relative"
      >
        <div className="relative z-10 w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between w-full gap-6">
            <div>
              <h1 className="font-display text-2xl lg:text-3xl font-black text-zinc-900 tracking-tighter leading-none text-balance">
                Your <span className="text-blue-600 uppercase">Dashboard.</span>
              </h1>
              <p className="text-zinc-500 mt-2 text-sm font-medium tracking-tight">
                Welcome back, <span className="text-zinc-950 font-bold underline decoration-blue-500 decoration-2 underline-offset-4">{profile?.name || user?.user_metadata?.name || 'Student'}</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {profile?.role === 'teacher' ? (
                <Link to="/classroom/create" className="w-full sm:w-auto">
                  <Button size="md" className="w-full sm:w-auto h-11 px-6 rounded-xl bg-zinc-900 hover:bg-zinc-800 shadow-md transition-all text-xs font-bold text-white group">
                    <Plus className="w-4 h-4 mr-2.5 group-hover:rotate-90 transition-transform duration-500" /> Create Classroom
                  </Button>
                </Link>
              ) : (
                <div className="flex gap-2 p-1 glass rounded-2xl border-white group w-full sm:w-auto">
                  <form onSubmit={handleJoinClass} className="flex gap-2 w-full sm:w-auto">
                    <Input 
                      placeholder="ENTER ROOM CODE"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      className="w-full sm:w-40 h-10 rounded-xl border-transparent bg-white/50 focus:bg-white font-mono font-black text-center tracking-widest uppercase text-xs transition-all"
                      error={error}
                    />
                    <Button type="submit" className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md text-[10px] font-black uppercase tracking-wider text-white transition-all active:scale-95" isLoading={joining}>Join</Button>
                  </form>
                </div>
              )}
            </div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-5 flex items-center gap-4 group cursor-default"
          >
             <div className="w-1 h-6 bg-zinc-900 group-hover:bg-blue-600 transition-all duration-700 rounded-full" />
             <div className="max-w-xl">
                <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.3em] mb-0.5">LEARNING INSIGHT</p>
                <p className="text-xs font-semibold text-zinc-500 italic leading-relaxed text-balance">"{momentumQuote.text}" — <span className="not-italic font-black text-zinc-400 opacity-60 ml-1">{momentumQuote.author}</span></p>
             </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 relative z-10">
        <StatCard 
          icon={<BookOpen className="w-4 h-4" />} 
          label="Active Classrooms" 
          value={classes.length < 10 ? `0${classes.length}` : classes.length.toString()} 
          color="blue"
          delay={0.1}
        />
        <StatCard 
          icon={<Activity className="w-4 h-4" />} 
          label="Recent Activities" 
          value={activities.length < 10 ? `0${activities.length}` : activities.length.toString()} 
          color="zinc"
          delay={0.2}
        />
        <StatCard 
          icon={<CheckCircle className="w-4 h-4" />} 
          label="Completed Tasks" 
          value={activities.filter(a => a.type === 'submission' && (a.status === 'correct' || a.status === 'completed')).length.toString().padStart(2, '0')} 
          color="green"
          delay={0.3}
        />
      </div>

      <Link to="/ai-tutor" className="block mb-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="group relative overflow-hidden rounded-3xl bg-zinc-950 p-6 md:p-7 flex items-center justify-between gap-6 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-500"
        >
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600/30 rounded-full blur-3xl group-hover:bg-blue-500/40 transition-colors duration-500" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400 mb-1">
                {profile?.role === 'teacher' ? 'Need a second opinion?' : 'Stuck on something?'}
              </p>
              <h3 className="font-display font-black text-lg md:text-xl text-white tracking-tight">
                {profile?.role === 'teacher' ? 'Try the AI Tutor yourself' : 'Ask the AI Tutor for a hint'}
              </h3>
              <p className="text-zinc-500 text-xs font-medium mt-0.5 hidden sm:block">
                {profile?.role === 'teacher'
                  ? 'See exactly what your students see — the same guided-hint engine, from your side of the room.'
                  : 'Guided debugging that points you to the fix — never just hands you the answer.'}
              </p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-blue-600 transition-all duration-300 shrink-0 relative z-10">
            <ArrowRight className="w-4 h-4" />
          </div>
        </motion.div>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5 pb-2 border-b border-zinc-100">
            <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] ml-1">
               MY CLASSROOMS
            </h2>
          </div>

          {classes.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center border-white/60">
              <div className="bg-zinc-950 w-16 h-16 rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-6 rotate-3 group hover:rotate-0 transition-transform duration-500">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display font-black text-xl text-zinc-900 tracking-tight">No Active Classrooms.</h3>
              <p className="text-zinc-500 mt-2 max-w-xs mx-auto font-medium text-sm leading-relaxed text-balance">
                {profile?.role === 'teacher' 
                  ? "Create your first classroom to start sharing lessons and assignments." 
                  : "Enter a room code given by your teacher to join your classroom."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.slice(0, 4).map((cls, idx) => (
                <Link key={cls.id} to={`/classroom/${cls.id}`}>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * idx, duration: 0.4 }}
                    className="group glass p-5 rounded-3xl transition-all duration-500 h-full flex flex-col hover:border-blue-500/50 hover:shadow-advanced hover:-translate-y-1"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 p-2.5"
                        style={{ backgroundColor: cls.language ? getLanguageColor(cls.language).bg : '#18181B' }}
                      >
                        {cls.language ? (
                          <img 
                            src={getLanguageIcon(cls.language)} 
                            alt={cls.language} 
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="bg-blue-500 w-full h-full rounded-lg flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-1 bg-zinc-900 rounded-xl shadow-md">
                         <span className="text-[9px] font-mono font-black text-white uppercase tracking-[0.15em]">
                           {cls.roomCode}
                         </span>
                      </div>
                    </div>
                    
                    <div className="mt-auto">
                      <h3 className="font-display font-black text-lg text-zinc-900 tracking-tight mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                        {cls.className}
                      </h3>
                      <div className="flex items-center gap-2 text-zinc-400 text-[9px] font-black uppercase tracking-[0.15em] mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        <span>LIVE // {profile?.role === 'teacher' ? 'CREATED' : 'JOINED'} {new Date(cls.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-zinc-300" />
                          <span className="text-[10px] font-bold text-zinc-500">{cls.problemCount ?? 0} {(cls.problemCount ?? 0) === 1 ? 'assignment' : 'assignments'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-zinc-300" />
                          <span className="text-[10px] font-bold text-zinc-500">{cls.studentCount ?? 0} {(cls.studentCount ?? 0) === 1 ? 'student' : 'students'}</span>
                        </div>
                      </div>
                    </div>

                     <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
                       <span className="text-zinc-400 font-black text-[9px] uppercase tracking-wider group-hover:text-zinc-900 transition-colors">Open Classroom</span>
                       <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-md border border-zinc-50 text-zinc-400 group-hover:text-blue-600 group-hover:border-blue-100 transition-all">
                         <ArrowRight className="w-3.5 h-3.5" />
                       </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
              
              {classes.length > 4 && (
                <Link to="/classrooms" className="col-span-full">
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="glass rounded-2xl p-4 text-center border-dashed border-2 border-zinc-200 hover:border-blue-500 transition-all flex items-center justify-center gap-3 group"
                  >
                     <span className="text-xs font-black uppercase tracking-[0.25em] text-zinc-400 group-hover:text-blue-600 transition-colors">Load More Classrooms</span>
                     <ArrowRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </motion.div>
                </Link>
              )}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-5 pb-2 border-b border-zinc-100 ml-1">
             CLASSWORK UPDATES
          </h2>
          
          <div className="glass rounded-3xl border-white overflow-hidden relative shadow-advanced">
            {activities.length === 0 ? (
              <div className="p-10 text-center">
                <Activity className="w-8 h-8 text-zinc-100 mx-auto mb-4" />
                <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em]">No activity yet</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100/50">
                {activities.map((act, idx) => (
                  <motion.div
                    key={act.id}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx + 0.3 }}
                  >
                    <Link 
                      to={`/classroom/${act.classId}`}
                      className="block p-4 hover:bg-white transition-all duration-500 group"
                    >
                      <div className="flex gap-4">
                        <div className={cn(
                          "w-9 h-9 rounded-xl glass border-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 p-2.5",
                        )}>
                          {act.type === 'problem' && (
                            <>
                              {act.language ? (
                                <img 
                                  src={getLanguageIcon(act.language)} 
                                  alt={act.language} 
                                  className="w-full h-full object-contain"
                                  referrerPolicy="no-referrer"
                               />
                              ) : (
                                <Code className="w-4 h-4 text-zinc-900" />
                              )}
                            </>
                          )}
                          {act.type === 'submission' && <CheckCircle className="w-4 h-4 text-blue-600" />}
                          {act.type === 'resource' && <FileText className="w-4 h-4 text-emerald-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                             <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest truncate max-w-[100px]">{act.className}</p>
                             <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                               {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                          </div>
                          <h4 className="text-xs font-black text-zinc-900 truncate tracking-tight uppercase group-hover:text-blue-600 transition-colors leading-tight text-balance">
                            {act.title}
                          </h4>
                          {act.type === 'submission' && (
                            <div className="mt-1.5">
                              <span className={cn(
                                "text-[7px] uppercase font-black tracking-[0.15em] px-2 py-0.5 rounded-full border shadow-xs",
                                act.status === 'pending' ? "bg-white text-zinc-400 border-zinc-100" :
                                act.status === 'correct' ? "bg-emerald-500 text-white border-transparent" :
                                "bg-red-500 text-white border-transparent"
                              )}>
                                {act.status}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-4 p-5 glass-dark rounded-3xl relative overflow-hidden group">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-600/20 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
             <h4 className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">SECURE LEARNING</h4>
             <p className="text-zinc-400 text-[11px] font-medium leading-relaxed tracking-tight">LEVELUP provides a safe, real-time workspace for school students to learn, share code, and receive direct feedback.</p>
             <div className="mt-4 flex items-center gap-2">
                <div className="w-1 h-1 bg-blue-500 animate-pulse rounded-full" />
                <span className="text-[8px] font-black text-white uppercase tracking-widest">Connection Stable</span>
             </div>
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, color, delay = 0 }: { icon: React.ReactNode, label: string, value: string, color: string, delay?: number }) {
  const colorClasses = {
    zinc: "bg-zinc-900 text-white",
    blue: "bg-blue-600 text-white",
    green: "bg-emerald-500 text-white",
  }[color] || "bg-zinc-900 text-white";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass p-4 rounded-2xl border-white shadow-advanced flex items-center gap-4 group hover:-translate-y-1 transition-all duration-500"
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-all duration-500 group-hover:scale-110 group-hover:rotate-3", colorClasses)}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.25em] mb-0.5">{label}</p>
        <p className="text-xl font-display font-black text-zinc-900 tracking-tight leading-none">{value}</p>
      </div>
    </motion.div>
  );
}
