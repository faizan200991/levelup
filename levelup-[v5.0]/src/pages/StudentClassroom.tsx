import { useState, useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import { collection, onSnapshot, doc, setDoc, addDoc, query, orderBy, where, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { ClassRoom, Problem, Submission, Resource, UserProfile } from '../types';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Link } from 'react-router-dom';
import { cn, getLanguageIcon } from '../lib/utils';
import { 
  Play, 
  Send, 
  ChevronRight, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Sparkles,
  ExternalLink,
  Code,
  Monitor,
  Sun,
  Moon,
  Zap,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function StudentClassroom({ classroom }: { classroom: ClassRoom }) {
  const { user, profile } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [activePanel, setActivePanel] = useState<'problem' | 'resources'>('problem');
  const [theme, setTheme] = useState<'vs-dark' | 'light' | 'hc-black'>('vs-dark');
  const [teacherProfile, setTeacherProfile] = useState<UserProfile | null>(null);
  
  const lastSyncRef = useRef<number>(0);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const teacherDoc = await getDoc(doc(db, 'users', classroom.teacherId));
        if (teacherDoc.exists()) {
          setTeacherProfile({ uid: teacherDoc.id, ...teacherDoc.data() } as UserProfile);
        }
      } catch (err) {
        console.error('Error fetching teacher profile:', err);
      }
    };
    fetchTeacher();
  }, [classroom.teacherId]);

  useEffect(() => {
    // Fetch problems
    const unsubProblems = onSnapshot(
      query(collection(db, 'classes', classroom.id, 'problems'), orderBy('createdAt', 'desc')),
      (snap) => {
        const probs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Problem));
        setProblems(probs);
        if (probs.length > 0 && !selectedProblem) {
          setSelectedProblem(probs[0]);
          setCode(getDefaultCode(probs[0].language));
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `classes/${classroom.id}/problems`)
    );

    const unsubResources = onSnapshot(
      query(collection(db, 'classes', classroom.id, 'resources'), orderBy('createdAt', 'desc')),
      (snap) => {
        setResources(snap.docs.map(d => ({ id: d.id, ...d.data() } as Resource)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `classes/${classroom.id}/resources`)
    );

    return () => {
      unsubProblems();
      unsubResources();
    };
  }, [classroom.id]);

  useEffect(() => {
    if (!selectedProblem || !user) return;
    
    // Fetch user's submissions for this problem
    const unsubSubmissions = onSnapshot(
      query(
        collection(db, 'classes', classroom.id, 'submissions'),
        where('studentId', '==', user.uid),
        where('problemId', '==', selectedProblem.id),
        orderBy('submittedAt', 'desc')
      ),
      (snap) => {
        const subs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Submission));
        setSubmissions(subs);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `classes/${classroom.id}/submissions`)
    );

    return () => unsubSubmissions();
  }, [selectedProblem, user, classroom.id]);

  // Sync code to Firestore (throttled)
  useEffect(() => {
    if (!user || !selectedProblem || !code) return;

    const syncCode = async () => {
      const now = Date.now();
      if (now - lastSyncRef.current < 2000) return; // Sync every 2 seconds

      try {
        await setDoc(doc(db, 'classes', classroom.id, 'liveCode', user.uid), {
          studentId: user.uid,
          studentName: profile?.name,
          studentPhotoURL: profile?.photoURL,
          code,
          language: selectedProblem.language,
          lastUpdated: new Date().toISOString()
        });
        lastSyncRef.current = now;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `classes/${classroom.id}/liveCode/${user.uid}`);
      }
    };

    const timeout = setTimeout(syncCode, 1000);
    return () => clearTimeout(timeout);
  }, [code, user, selectedProblem, classroom.id]);

  const handleRun = async () => {
    if (!selectedProblem || !code) return;
    setIsRunning(true);
    let outputResult = '';
    setOutput('Running code...');

    try {
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedProblem.language,
          version: '*',
          files: [{ content: code }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        outputResult = data.run?.output || 'No output';
      } else {
        throw new Error('Piston engine offline');
      }
    } catch (err) {
      console.warn('Execution Engine failed, using AI simulation:', err);
      outputResult = `[SIMULATED OUTPUT]\n${await simulateOutput(code, selectedProblem.language)}`;
    } finally {
      setOutput(outputResult);
      setIsRunning(false);
    }
  };

  const simulateOutput = async (code: string, language: string) => {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: (process.env as any).GEMINI_API_KEY || '' });
      
      const prompt = `You are a code execution engine. Analyze the following ${language} code and provide the exact output it would produce. If there are syntax errors, provide the error message. Do not include any explanation, just the raw output.\n\nCode:\n${code}`;
      
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return result.text || 'No output produced.';
    } catch (e) {
      console.error('AI Simulation Error:', e);
      return 'Execution Engine Error: Connection failed. Please check your network.';
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedProblem || !code) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'classes', classroom.id, 'submissions'), {
        studentId: user.uid,
        studentName: profile?.name,
        studentPhotoURL: profile?.photoURL,
        problemId: selectedProblem.id,
        problemTitle: selectedProblem.title,
        language: selectedProblem.language,
        classId: classroom.id,
        teacherId: classroom.teacherId,
        code,
        output,
        status: 'pending',
        submittedAt: new Date().toISOString()
      });
      alert('Submission received!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `classes/${classroom.id}/submissions`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDefaultCode = (lang: string) => {
    switch (lang) {
      case 'python': return 'print("Hello, World!")';
      case 'javascript': return 'console.log("Hello, World!");';
      case 'typescript': return 'console.log("Hello, TypeScript!");';
      case 'java': return 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}';
      case 'cpp': return '#include <iostream>\n\nint main() {\n  std::cout << "Hello, World!" << std::endl;\n  return 0;\n}';
      case 'csharp': return 'using System;\nclass Program {\n  static void Main() {\n    Console.WriteLine("Hello, World!");\n  }\n}';
      case 'go': return 'package main\nimport "fmt"\nfunction main() {\n  fmt.Println("Hello, World!")\n}';
      case 'rust': return 'fn main() {\n    println!("Hello, World!");\n}';
      case 'php': return '<?php\necho "Hello, World!";';
      case 'ruby': return 'puts "Hello, World!"';
      case 'swift': return 'print("Hello, World!")';
      case 'kotlin': return 'fun main() {\n    println("Hello, World!")\n}';
      case 'sql': return 'SELECT * FROM users;';
      case 'html': return '<!DOCTYPE html>\n<html>\n<body>\n<h1>Hello World</h1>\n</body>\n</html>';
      default: return '// Start coding...';
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-screen overflow-hidden transition-colors duration-500",
      theme === 'light' ? "bg-zinc-50 text-zinc-950" : "bg-zinc-950 text-white"
    )}>
      {/* Premium Header */}
      <header className={cn(
        "h-16 backdrop-blur-3xl border-b px-6 flex items-center justify-between relative z-50 transition-all",
        theme === 'light' ? "bg-white/80 border-zinc-200" : "bg-zinc-950/80 border-zinc-900"
      )}>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className={cn(
            "transition-all group flex items-center gap-2",
            theme === 'light' ? "text-zinc-400 hover:text-zinc-950" : "text-zinc-500 hover:text-white"
          )}>
            <div className={cn(
              "w-7 h-7 rounded-lg border flex items-center justify-center transition-all",
              theme === 'light' ? "bg-zinc-100 border-zinc-200 group-hover:bg-zinc-950 group-hover:text-white" : "bg-zinc-900 border-zinc-800 group-hover:bg-white group-hover:text-zinc-950"
            )}>
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Dashboard</span>
          </Link>
          <div className={cn("h-5 w-px", theme === 'light' ? "bg-zinc-200" : "bg-zinc-800")} />
          <div className="flex items-center gap-2.5">
            <h1 className={cn("font-display font-bold text-base tracking-tight", theme === 'light' ? "text-zinc-950" : "text-white")}>{classroom.className}</h1>
            <div className={cn("px-2 py-0.5 rounded-md border", theme === 'light' ? "bg-zinc-100 border-zinc-200" : "bg-zinc-900 border-zinc-800")}>
               <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{classroom.roomCode}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-1 rounded-lg p-1 border transition-all",
            theme === 'light' ? "bg-zinc-100 border-zinc-200" : "bg-zinc-900 border-zinc-800"
          )}>
            <button 
              onClick={() => setTheme('light')} 
              className={cn("p-1.5 rounded-md transition-all", theme === 'light' ? "bg-white text-zinc-950 shadow-lg" : "text-zinc-500 hover:text-zinc-950")}
              title="Light Theme"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setTheme('vs-dark')} 
              className={cn("p-1.5 rounded-md transition-all", theme === 'vs-dark' ? "bg-white text-zinc-950 shadow-lg" : "text-zinc-500 hover:text-white")}
              title="Dark Theme"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setTheme('hc-black')} 
              className={cn("p-1.5 rounded-md transition-all", theme === 'hc-black' ? "bg-white text-zinc-950 shadow-lg" : "text-zinc-500 hover:text-white")}
              title="Matrix Theme"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>
          </div>

          <Link to="/ai-tutor">
            <Button size="sm" variant="ghost" className={cn(
              "rounded-xl group transition-all text-xs border border-transparent",
              theme === 'light' ? "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 hover:border-zinc-200" : "text-zinc-400 hover:text-white hover:bg-white/5 hover:border-zinc-800"
            )}>
              <Sparkles className="w-3.5 h-3.5 mr-2 text-amber-500 group-hover:scale-125 transition-transform" /> AI Tutor
            </Button>
          </Link>
          
          <div className={cn(
            "flex items-center gap-2 p-1 rounded-xl border transition-all",
            theme === 'light' ? "bg-zinc-100 border-zinc-200" : "bg-zinc-900/50 border-zinc-900"
          )}>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleRun} 
              isLoading={isRunning}
              className="text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all h-9"
            >
              <Play className="w-3.5 h-3.5 mr-2 fill-emerald-500" /> Run
            </Button>
            <Button 
              size="md" 
              onClick={handleSubmit} 
              isLoading={isSubmitting}
              className={cn(
                "rounded-xl font-black uppercase text-[9px] tracking-widest h-9 px-6 shadow-2xl transition-all",
                theme === 'light' ? "bg-zinc-950 text-white hover:bg-zinc-800 shadow-zinc-200" : "bg-white text-zinc-950 hover:bg-zinc-200 shadow-white/5"
              )}
            >
              Push
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Side: Tasks & Resources (Glassmorphism Sidebar) */}
        <div className={cn(
          "w-[450px] border-r flex flex-col relative z-40 overflow-hidden transition-colors duration-500",
          theme === 'light' ? "bg-white border-zinc-200" : "bg-zinc-950 border-zinc-900"
        )}>
          <div className="p-6 pb-4 flex gap-4">
            <button 
              onClick={() => setActivePanel('problem')}
              className={cn(
                "flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden",
                activePanel === 'problem' 
                  ? (theme === 'light' ? "text-zinc-950" : "text-white") 
                  : "text-zinc-600 hover:text-zinc-400"
              )}
            >
              Mission Log
              {activePanel === 'problem' && (
                <motion.div layoutId="panel-active" className={cn(
                  "absolute inset-0 border -z-10 rounded-xl shadow-inner",
                  theme === 'light' ? "bg-zinc-100 border-zinc-200 shadow-zinc-200" : "bg-white/5 border-white/10 shadow-white/5"
                )} />
              )}
            </button>
            <button 
              onClick={() => setActivePanel('resources')}
              className={cn(
                "flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden flex items-center justify-center gap-2",
                activePanel === 'resources' 
                  ? (theme === 'light' ? "text-zinc-950" : "text-white") 
                  : "text-zinc-600 hover:text-zinc-400"
              )}
            >
              Resources
              {activePanel === 'resources' && (
                <motion.div layoutId="panel-active" className={cn(
                  "absolute inset-0 border -z-10 rounded-xl shadow-inner",
                  theme === 'light' ? "bg-zinc-100 border-zinc-200 shadow-zinc-200" : "bg-white/5 border-white/10 shadow-white/5"
                )} />
              )}
              {resources.length > 0 && (
                <span className="w-1 h-1 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-10 scrollbar-hide">
            <AnimatePresence mode="wait">
              {activePanel === 'problem' ? (
                <motion.div
                  key="task-list"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6 mt-6"
                >
                  <label className={cn("text-[10px] font-black uppercase tracking-[0.3em] mb-4 block ml-1", theme === 'light' ? "text-zinc-400" : "text-zinc-600")}>Deployment Queue</label>
                  
                  <div className="space-y-3">
                    {problems.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedProblem(p);
                          setCode(p.starterCode || getDefaultCode(p.language));
                        }}
                        className={cn(
                          "w-full p-4 rounded-3xl border text-left transition-all group relative overflow-hidden",
                          selectedProblem?.id === p.id 
                            ? (theme === 'light' ? "bg-white border-zinc-950 shadow-xl" : "bg-white border-white shadow-[0_0_40px_rgba(255,255,255,0.1)]")
                            : (theme === 'light' ? "bg-white border-zinc-100 hover:border-zinc-300" : "bg-zinc-900 border-zinc-800 hover:border-zinc-700")
                        )}
                      >
                        <div className="flex items-center gap-4 relative z-10 transition-transform duration-500 group-hover:translate-x-1">
                          <div className={cn(
                            "w-10 h-10 rounded-xl border flex items-center justify-center p-2 transition-all",
                            selectedProblem?.id === p.id 
                              ? "bg-zinc-950 border-zinc-800 text-white" 
                              : (theme === 'light' ? "bg-zinc-50 border-zinc-100" : "bg-zinc-950 border-zinc-800")
                          )}>
                            <img src={getLanguageIcon(p.language)} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <p className={cn(
                              "text-sm font-bold tracking-tight",
                              selectedProblem?.id === p.id 
                                ? (theme === 'light' ? "text-zinc-950" : "text-zinc-950") // For dark theme, selected is white bg with black text? wait
                                : (theme === 'light' ? "text-zinc-950" : "text-zinc-200")
                            )}>{p.title}</p>
                            <p className={cn(
                              "text-[9px] font-black uppercase tracking-[0.1em] opacity-40 mt-0.5",
                              selectedProblem?.id === p.id ? "text-zinc-950" : ""
                            )}>{p.type || 'EXERCISE'} • {p.language}</p>
                          </div>
                        </div>
                        {selectedProblem?.id === p.id && (
                          <div className={cn(
                            "absolute top-0 right-0 p-4 opacity-50",
                            theme === 'light' ? "text-zinc-950" : "text-zinc-950"
                          )}>
                            <Zap className="w-3 h-3 fill-current" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {selectedProblem && (
                    <div className="pt-8 border-t border-zinc-100 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className={cn("text-2xl font-display font-bold tracking-tight leading-tight", theme === 'light' ? "text-zinc-950" : "text-white")}>{selectedProblem.title}</h2>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-2xl",
                            selectedProblem.type === 'assignment' 
                              ? "bg-red-500/10 text-red-500 border-red-500/20" 
                              : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          )}>
                            {selectedProblem.type || 'exercise'}
                          </div>
                        </div>

                      {teacherProfile && (
                        <div className={cn("flex items-center gap-3 p-3 rounded-2xl border", theme === 'light' ? "bg-zinc-50 border-zinc-200" : "bg-white/5 border-white/10")}>
                          <div className={cn("w-8 h-8 rounded-xl overflow-hidden border", theme === 'light' ? "border-zinc-200" : "border-white/10")}>
                            <img 
                              src={teacherProfile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacherProfile.uid}`} 
                              alt={teacherProfile.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <p className={cn("text-[8px] font-black uppercase tracking-[0.2em]", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>Curated By</p>
                            <p className={cn("text-[10px] font-bold", theme === 'light' ? "text-zinc-700" : "text-zinc-300")}>{teacherProfile.name}</p>
                          </div>
                        </div>
                      )}

                      {selectedProblem.instructionsUrl && (
                        <a 
                          href={selectedProblem.instructionsUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className={cn(
                            "flex items-center justify-between p-5 rounded-[2rem] border transition-all duration-500 group",
                            theme === 'light' ? "bg-zinc-50 border-zinc-200 hover:bg-zinc-950 hover:text-white" : "bg-zinc-900 border-zinc-800 hover:bg-white hover:text-zinc-950"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl border flex items-center justify-center transition-all",
                              theme === 'light' ? "bg-white border-zinc-100 group-hover:bg-zinc-900 group-hover:text-white" : "bg-white/5 border-white/10 group-hover:bg-zinc-950 group-hover:text-white"
                            )}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">Specs v1.0</p>
                              <p className="text-[10px] uppercase font-black tracking-widest opacity-50">Technical PDF</p>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 opacity-30 group-hover:opacity-100" />
                        </a>
                      )}
                    </div>

                    <div className={cn(
                      "p-6 rounded-[2rem] border relative overflow-hidden group transition-colors",
                      theme === 'light' ? "bg-zinc-100 border-zinc-200" : "bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-900"
                    )}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-[80px] opacity-[0.02] -mr-16 -mt-16 group-hover:opacity-[0.05] transition-opacity" />
                      <label className={cn("text-[10px] font-black uppercase tracking-[0.3em] mb-4 block", theme === 'light' ? "text-zinc-400" : "text-zinc-600")}>Requirements</label>
                      <div className={cn("text-sm leading-relaxed whitespace-pre-wrap font-medium", theme === 'light' ? "text-zinc-600" : "text-zinc-400")}>
                        {selectedProblem.description}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Submission Log</label>
                      <div className="space-y-3">
                        {submissions.length === 0 ? (
                          <div className={cn("p-10 text-center border border-dashed rounded-[2rem]", theme === 'light' ? "bg-zinc-50 border-zinc-200 text-zinc-400" : "bg-zinc-950 border-zinc-900 text-zinc-600")}>
                             <p className="text-xs font-bold italic">No records detected in buffer.</p>
                          </div>
                        ) : (
                          submissions.map(sub => (
                            <div key={sub.id} className={cn(
                              "p-5 rounded-3xl border backdrop-blur-md relative group overflow-hidden transition-all",
                              theme === 'light' ? "bg-white border-zinc-200" : "bg-zinc-900/40 border-zinc-900 shadow-2xl"
                            )}>
                              <div className={cn("absolute top-0 left-0 w-1 h-full transition-colors", theme === 'light' ? "bg-zinc-100 group-hover:bg-zinc-950" : "bg-zinc-800 group-hover:bg-white")} />
                              <div className="flex justify-between items-center mb-4">
                                <span className={cn("text-[11px] font-mono uppercase tracking-widest", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>
                                  {new Date(sub.submittedAt).toLocaleTimeString()}
                                </span>
                                <StatusBadge status={sub.status} />
                              </div>
                              {sub.feedback && (
                                <div className={cn(
                                  "mt-2 flex items-start gap-4 p-4 rounded-2xl border",
                                  theme === 'light' ? "bg-zinc-50 border-zinc-100" : "bg-white/5 border-white/5"
                                )}>
                                  <div className={cn(
                                    "w-8 h-8 rounded-full border flex items-center justify-center shrink-0",
                                    theme === 'light' ? "bg-white border-zinc-200" : "bg-zinc-950 border-white/10"
                                  )}>
                                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                                  </div>
                                  <p className={cn("text-xs font-medium leading-relaxed italic", theme === 'light' ? "text-zinc-600" : "text-zinc-300")}>"{sub.feedback}"</p>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
              ) : (
                <motion.div
                  key="resources-panel"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8 mt-6"
                >
                    <div>
                    <h2 className="text-2xl font-display font-bold text-white mb-2 tracking-tight">Resources</h2>
                    <p className="text-zinc-500 text-sm">Auxiliary data for current environment.</p>
                  </div>
                  {resources.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-zinc-900 rounded-[3rem]">
                      <FileText className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest text-zinc-700">No data found in cache</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {resources.map(res => (
                        <a 
                          key={res.id}
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-5 p-5 rounded-[2.5rem] border border-zinc-900 bg-zinc-900/20 hover:bg-white hover:text-zinc-950 transition-all duration-500 group"
                        >
                          <div className="w-14 h-14 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl transition-all group-hover:bg-zinc-950 group-hover:text-white">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-base font-bold truncate tracking-tight">{res.name}</p>
                            <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mt-1 group-hover:text-zinc-400">{res.type.replace('application/', '')}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all" />
                        </a>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

          <div className={cn(
            "flex-1 flex flex-col relative shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] transition-colors duration-500",
            theme === 'light' ? "bg-zinc-50" : theme === 'hc-black' ? "bg-black" : "bg-[#0d0d0d]"
          )}>
            <div className="absolute top-0 right-0 p-8 z-10 pointer-events-none">
               <div className={cn(
                 "backdrop-blur-md px-4 py-2 rounded-2xl border flex items-center gap-3 transition-all",
                 theme === 'light' ? "bg-white/80 border-zinc-200" : "bg-zinc-900/50 border-white/5"
               )}>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em]",
                    theme === 'light' ? "text-zinc-600" : "text-zinc-400"
                  )}>Terminal Sync Active</span>
               </div>
            </div>
  
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                theme={theme}
                language={selectedProblem?.language || 'python'}
                value={code}
                onChange={(value) => setCode(value || '')}
              onMount={(editor) => {
                editor.updateOptions({
                   fontFamily: "'JetBrains Mono', monospace",
                   fontSize: 14,
                   lineHeight: 1.5,
                   fontLigatures: true,
                   cursorSmoothCaretAnimation: 'on',
                   smoothScrolling: true,
                   scrollbar: {
                    vertical: 'hidden',
                    horizontal: 'hidden'
                   },
                   minimap: { enabled: false },
                   bracketPairColorization: { enabled: true },
                   guides: { indentation: true },
                   renderLineHighlight: 'all',
                   padding: { top: 40, bottom: 40 }
                });
              }}
              options={{
                automaticLayout: true,
              }}
            />
          </div>

          {/* Console / Terminal Section */}
          <div className={cn(
            "h-2/5 border-t flex flex-col backdrop-blur-3xl transition-colors duration-500",
            theme === 'light' ? "bg-white border-zinc-200" : "bg-zinc-950/80 border-zinc-900"
          )}>
            <div className={cn(
              "h-14 px-8 flex items-center justify-between border-b transition-colors",
              theme === 'light' ? "bg-zinc-50 border-zinc-200" : "bg-zinc-950 border-zinc-900"
            )}>
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                  </div>
                  <span className={cn("text-[10px] font-black uppercase tracking-[0.3em]", theme === 'light' ? "text-zinc-400" : "text-zinc-600")}>Virtual Terminal Output</span>
               </div>
               {isRunning && (
                 <div className="flex items-center gap-3 text-emerald-500">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Processing Execution</span>
                    <div className={cn("h-1 w-20 rounded-full overflow-hidden", theme === 'light' ? "bg-zinc-200" : "bg-zinc-900")}>
                       <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="h-full w-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" 
                       />
                    </div>
                 </div>
               )}
            </div>
            <div className="flex-1 p-10 font-mono text-sm overflow-y-auto scrollbar-hide">
              <AnimatePresence mode="wait">
                <motion.div
                  key={output}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {output ? (
                    <div className={cn("leading-relaxed break-words whitespace-pre-wrap", theme === 'light' ? "text-zinc-700" : "text-zinc-300")}>
                       {output}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
                       <Monitor className={cn("w-12 h-12 mb-4", theme === 'light' ? "text-zinc-950" : "text-white")} />
                       <p className={cn("text-xs font-black uppercase tracking-widest leading-none", theme === 'light' ? "text-zinc-950" : "text-white")}>Awaiting input signal</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'correct') {
    return <span className="flex items-center text-green-500 text-xs font-bold gap-1"><CheckCircle className="w-3 h-3" /> Correct</span>;
  }
  if (status === 'incorrect') {
    return <span className="flex items-center text-red-500 text-xs font-bold gap-1"><XCircle className="w-3 h-3" /> Re-submit</span>;
  }
  return <span className="text-zinc-400 text-xs font-bold">Pending</span>;
}
