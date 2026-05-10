import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ClassRoom, DBClassroom } from '../types';
import Loader from '../components/Loader';
import { Plus, BookOpen, Activity, ArrowRight, CheckCircle, FileText, Code } from 'lucide-react';
import { motion } from 'motion/react';
import { cn, getLanguageIcon } from '../lib/utils';

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
  const [classes, setClasses] = useState<ClassRoom[]>([]);
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

      // Fetch most recent problem language for each class to show icon
      const classesWithLanguage = await Promise.all(formattedClasses.map(async (cls) => {
        const { data: prob } = await supabase
          .from('problems')
          .select('language')
          .eq('classroom_id', cls.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        return { ...cls, language: prob?.language };
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
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12"
      >
        <div>
          <h1 className="font-display text-3xl font-bold text-black tracking-tighter leading-none">
            Your <br />
            <span className="text-blue-600 uppercase">Dashboard.</span>
          </h1>
          <p className="text-zinc-600 mt-4 text-base font-medium tracking-tight">
            Welcome back, <span className="text-black font-bold">{profile?.name || user?.user_metadata?.name || 'Student'}</span>
          </p>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex items-center gap-4 group cursor-default"
          >
             <div className="w-1 h-8 bg-blue-600/20 group-hover:bg-blue-600 transition-all duration-700" />
             <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">DAILY MOMENTUM</p>
                <p className="text-xs font-medium text-zinc-500 italic">"{momentumQuote.text}" — {momentumQuote.author}</p>
             </div>
          </motion.div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {profile?.role === 'teacher' ? (
            <Link to="/classroom/create" className="w-full sm:w-auto">
              <Button size="md" className="w-full sm:w-auto h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all text-sm font-bold text-white">
                <Plus className="w-4 h-4 mr-2" /> Create Classroom
              </Button>
            </Link>
          ) : (
            <div className="flex gap-3 p-1.5 bg-white rounded-2xl border border-zinc-100 shadow-xl">
              <form onSubmit={handleJoinClass} className="flex gap-2">
                <Input 
                  placeholder="JOIN CODE"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-36 h-12 rounded-xl border-zinc-50 bg-zinc-50/50 font-mono font-black text-center tracking-widest uppercase text-sm"
                  error={error}
                />
                <Button type="submit" className="h-12 px-6 rounded-xl bg-blue-600 shadow-lg text-xs font-black uppercase tracking-widest text-white" isLoading={joining}>Join</Button>
              </form>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <StatCard 
          icon={<BookOpen className="w-5 h-5" />} 
          label="Your Classes" 
          value={classes.length < 10 ? `0${classes.length}` : classes.length.toString()} 
          color="blue"
          delay={0.1}
        />
        <StatCard 
          icon={<Activity className="w-5 h-5" />} 
          label="Recent Activity" 
          value={activities.length < 10 ? `0${activities.length}` : activities.length.toString()} 
          color="zinc"
          delay={0.2}
        />
        <StatCard 
          icon={<CheckCircle className="w-5 h-5" />} 
          label="Completed Tasks" 
          value={activities.filter(a => a.type === 'submission' && (a.status === 'correct' || a.status === 'completed')).length.toString().padStart(2, '0')} 
          color="green"
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.4em] ml-1">
               MY_CLASSROOMS
            </h2>
            <div className="w-1/3 h-px bg-zinc-100" />
          </div>

          {classes.length === 0 ? (
            <div className="bg-zinc-50/50 rounded-[4rem] border-2 border-dashed border-zinc-100 p-32 text-center">
              <div className="bg-white w-24 h-24 rounded-[2rem] shadow-xl border border-zinc-50 flex items-center justify-center mx-auto mb-10">
                <BookOpen className="w-10 h-10 text-zinc-200" />
              </div>
              <h3 className="font-display font-bold text-3xl text-black tracking-tight">No classrooms yet</h3>
              <p className="text-zinc-600 mt-4 max-w-sm mx-auto font-medium text-lg leading-relaxed">
                {profile?.role === 'teacher' 
                  ? "Create your first classroom to begin inviting students." 
                  : "Enter a join code shared by your teacher to connect to a classroom."}
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {classes.slice(0, 4).map((cls, idx) => (
                  <Link key={cls.id} to={`/classroom/${cls.id}`}>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * idx, duration: 0.5 }}
                      className="group bg-white p-6 rounded-2xl border border-zinc-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] transition-all duration-300 relative overflow-hidden h-full flex flex-col"
                    >
                      {/* Class content same as before ... */}
                      <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className={cn(
                          "w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-zinc-100 p-2",
                        )}>
                          {cls.language ? (
                            <img 
                              src={getLanguageIcon(cls.language)} 
                              alt="" 
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <BookOpen className="w-5 h-5 text-zinc-400" />
                          )}
                        </div>
                        <div className="px-3 py-1.5 bg-zinc-50 rounded-xl border border-zinc-100">
                           <span className="text-[9px] font-mono font-black text-zinc-700 uppercase tracking-[0.2em]">
                             {cls.roomCode}
                           </span>
                        </div>
                      </div>
                      
                      <div className="mt-auto relative z-10">
                        <h3 className="font-display font-bold text-xl text-black tracking-tighter mb-3 leading-none">
                          {cls.className}
                        </h3>
                        <div className="flex items-center gap-4 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          <span>ACTIVE // JOINED {new Date(cls.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                       <div className="mt-8 pt-6 border-t border-zinc-50 flex items-center justify-between relative z-10">
                         <span className="text-black font-bold text-sm">Open Classroom</span>
                         <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center shadow-sm text-zinc-400">
                           <ArrowRight className="w-4 h-4" />
                         </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
              
              {classes.length > 4 && (
                <div className="flex justify-center">
                  <Link to="/classrooms">
                    <Button variant="outline" className="h-14 px-10 rounded-2xl border-zinc-200 text-black font-bold text-sm shadow-sm hover:bg-zinc-50 transition-all">
                      View All Classrooms <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-12">
          <div>
            <h2 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-10 ml-1">
               RECENT_UPDATES
            </h2>
            
            <div className="bg-white rounded-[2rem] border border-zinc-100 overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.04)] relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 z-10" />
              
              {activities.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="bg-zinc-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Activity className="w-8 h-8 text-zinc-100" />
                  </div>
                  <p className="text-zinc-300 text-[10px] font-black uppercase tracking-[0.3em]">No updates yet</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-50">
                  {activities.map((act, idx) => (
                    <motion.div
                      key={act.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx + 0.5 }}
                    >
                      <Link 
                        to={`/classroom/${act.classId}`}
                        className="block p-6 hover:bg-blue-50/10 transition-all duration-500 group"
                      >
                        <div className="flex gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 relative shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 p-3",
                          )}>
                            {act.type === 'problem' && (
                              <>
                                {act.language ? (
                                  <img 
                                    src={getLanguageIcon(act.language)} 
                                    alt="" 
                                    className="w-full h-full object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <Code className="w-7 h-7 text-zinc-400" />
                                )}
                              </>
                            )}
                            {act.type === 'submission' && <CheckCircle className="w-7 h-7 text-blue-600" />}
                            {act.type === 'resource' && <FileText className="w-7 h-7 text-emerald-500" />}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex items-center justify-between mb-1.5">
                               <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest truncate max-w-[120px]">{act.className}</p>
                               <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                                 {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </span>
                            </div>
                            <h4 className="text-base font-bold text-black truncate tracking-tight group-hover:text-blue-600 transition-colors">
                              {act.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-3">
                              {act.type === 'submission' && (
                                <span className={cn(
                                  "text-[8px] uppercase font-black tracking-[0.2em] px-3 py-1 rounded-full border shadow-xs",
                                  act.status === 'pending' ? "bg-zinc-50 text-zinc-500 border-zinc-100" :
                                  act.status === 'correct' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                  "bg-red-50 text-red-600 border-red-100"
                                )}>
                                  {act.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-8 p-8 bg-blue-600 rounded-[2rem] shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000" />
               <h4 className="text-[10px] font-black text-white/60 uppercase tracking-[0.4em] mb-3">WELCOME TO LEVELUP</h4>
               <p className="text-white text-xs font-medium leading-relaxed">We're glad to have you here! Use your dashboard to stay updated on your classes and new programming projects.</p>
               <div className="mt-6 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Everything is running smoothly</span>
               </div>
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white p-4 md:p-5 rounded-2xl border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 group hover:shadow-[0_20px_50px_rgb(0,0,0,0.08)] transition-all duration-500"
    >
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3", colorClasses)}>
        {icon}
      </div>
      <div>
        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em]">{label}</p>
        <p className="text-lg font-display font-bold text-black mt-0.5 tracking-tight">{value}</p>
      </div>
    </motion.div>
  );
}
