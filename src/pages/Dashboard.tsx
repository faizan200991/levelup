import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ClassRoom, Problem, Submission, Resource } from '../types';
import Loader from '../components/Loader';
import { Plus, BookOpen, LogOut, Search, Clock, Activity, ArrowRight, CheckCircle, FileText, Code } from 'lucide-react';
import { auth } from '../lib/firebase';
import { motion } from 'motion/react';
import { cn, getLanguageIcon } from '../lib/utils';

import DashboardLayout from '../components/DashboardLayout';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomCode, setRoomCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const autoJoinCode = searchParams.get('join');
    if (autoJoinCode) {
      setRoomCode(autoJoinCode.toUpperCase());
    }
  }, [searchParams]);

  useEffect(() => {
    const autoJoinCode = searchParams.get('join');
    if (autoJoinCode && user && profile?.role === 'student' && !joining) {
      // Auto-trigger join for students
      handleJoinClass(new Event('submit') as any);
    }
  }, [user, profile, searchParams]);

  useEffect(() => {
    fetchClasses();
  }, [user, profile]);

  const fetchClasses = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // If profile is missing, we try to fetch as teacher first, then student
      // This is a backup for when the profile document is failing to sync correctly
      const teacherQ = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
      const studentQ = query(collection(db, 'classes'), where('studentIds', 'array-contains', user.uid));
      
      const [teacherSnap, studentSnap] = await Promise.all([getDocs(teacherQ), getDocs(studentQ)]);
      
      const teacherClasses = teacherSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as ClassRoom));
      const studentClasses = studentSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as ClassRoom));
      
      // Merge unique classes
      const allClassIds = new Set(teacherClasses.map(c => c.id));
      const combinedClasses = [...teacherClasses, ...studentClasses.filter(c => !allClassIds.has(c.id))];
      
      // Fetch representative language for each class
      const classesWithLanguage = await Promise.all(combinedClasses.map(async (cls) => {
        try {
          const probQ = query(collection(db, 'classes', cls.id, 'problems'), orderBy('createdAt', 'desc'), limit(1));
          const probSnap = await getDocs(probQ);
          if (!probSnap.empty) {
            return { ...cls, language: probSnap.docs[0].data().language };
          }
        } catch (e) {
          console.error("Error fetching language for class", cls.id, e);
        }
        return cls;
      }));
      
      setClasses(classesWithLanguage as (ClassRoom & { language?: string })[]);
      
      // Fetch activity
      if (combinedClasses.length > 0) {
        const allActivity: any[] = [];
        
        for (const cls of combinedClasses) {
          try {
            // Check if we are teacher for this class
            const isTeacher = cls.teacherId === user.uid;

            if (isTeacher) {
              // Teacher sees recent submissions
              const subQ = query(
                collection(db, 'classes', cls.id, 'submissions'),
                where('teacherId', '==', user.uid),
                orderBy('submittedAt', 'desc'),
                limit(3)
              );
              const subSnap = await getDocs(subQ);
              subSnap.forEach(d => {
                allActivity.push({
                  id: d.id,
                  type: 'submission',
                  title: `New submission from Student ${d.data().studentId.substring(0, 5)}`,
                  className: cls.className,
                  timestamp: d.data().submittedAt,
                  classId: cls.id,
                  status: d.data().status
                });
              });
            } else {
              // Student sees new problems and resources
              const probQ = query(
                collection(db, 'classes', cls.id, 'problems'),
                orderBy('createdAt', 'desc'),
                limit(2)
              );
              const probSnap = await getDocs(probQ);
              probSnap.forEach(d => {
                allActivity.push({
                  id: d.id,
                  type: 'problem',
                  title: `New Problem: ${d.data().title}`,
                  className: cls.className,
                  timestamp: d.data().createdAt,
                  classId: cls.id,
                  language: d.data().language
                });
              });

              const resQ = query(
                collection(db, 'classes', cls.id, 'resources'),
                orderBy('createdAt', 'desc'),
                limit(2)
              );
              const resSnap = await getDocs(resQ);
              resSnap.forEach(d => {
                allActivity.push({
                  id: d.id,
                  type: 'resource',
                  title: `New Resource: ${d.data().name}`,
                  className: cls.className,
                  timestamp: d.data().createdAt,
                  classId: cls.id
                });
              });
            }
          } catch (activityErr) {
            console.warn(`Could not fetch activity for class ${cls.id}:`, activityErr);
          }
        }
        
        setActivities(allActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
      try {
        handleFirestoreError(err, OperationType.GET, 'classes');
      } catch (e) {
        setError('Permission error while fetching classrooms. Please refresh.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode || !user) return;
    setJoining(true);
    setError('');
    try {
      const q = query(collection(db, 'classes'), where('roomCode', '==', roomCode.toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('Classroom not found. Please check the code.');
        return;
      }

      const classroom = querySnapshot.docs[0];
      await updateDoc(doc(db, 'classes', classroom.id), {
        studentIds: arrayUnion(user.uid)
      });

      navigate(`/classroom/${classroom.id}`);
    } catch (err: any) {
      try {
        handleFirestoreError(err, OperationType.UPDATE, `classes/${roomCode}`);
      } catch (e) {
        setError(err.message || 'Failed to join classroom');
      }
    } finally {
      setJoining(false);
    }
  };

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
            Welcome back, <span className="text-black font-bold">{profile?.name || user?.displayName || 'Student'}</span>
          </p>
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
                      className="group bg-white p-8 rounded-3xl border border-zinc-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] transition-all duration-300 relative overflow-hidden h-full flex flex-col"
                    >
                      {/* Class content same as before ... */}
                      <div className="flex justify-between items-start mb-10 relative z-10">
                        <div className={cn(
                          "w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-zinc-100 p-2",
                        )}>
                          {(cls as any).language ? (
                            <img 
                              src={getLanguageIcon((cls as any).language)} 
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
                        <h3 className="font-display font-bold text-2xl text-black tracking-tighter mb-4 leading-none">
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
            
            <div className="bg-white rounded-[3.5rem] border border-zinc-100 overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.04)] relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 z-10" />
              
              {activities.length === 0 ? (
                <div className="p-20 text-center">
                  <div className="bg-zinc-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Activity className="w-10 h-10 text-zinc-100" />
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
                        className="block p-8 hover:bg-blue-50/10 transition-all duration-500 group"
                      >
                        <div className="flex gap-6">
                          <div className={cn(
                            "w-16 h-16 rounded-3xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 relative shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 p-3",
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
            
            <div className="mt-10 p-10 bg-blue-600 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
               <h4 className="text-[10px] font-black text-white/60 uppercase tracking-[0.4em] mb-4">WELCOME TO LEVELUP</h4>
               <p className="text-white text-sm font-medium leading-relaxed">We're glad to have you here! Use your dashboard to stay updated on your classes and new programming projects.</p>
               <div className="mt-8 flex items-center gap-3">
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
      className="bg-white p-6 rounded-[2.5rem] border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-6 group hover:shadow-[0_20px_50px_rgb(0,0,0,0.08)] transition-all duration-500"
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3", colorClasses)}>
        {icon}
      </div>
      <div>
        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em]">{label}</p>
        <p className="text-xl font-display font-bold text-black mt-0.5 tracking-tight">{value}</p>
      </div>
    </motion.div>
  );
}
