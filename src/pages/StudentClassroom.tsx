import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Editor } from '@monaco-editor/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { ClassRoom, Problem, Submission, Resource, UserProfile } from '../types';
import { Button } from '../components/Button';
import { cn, getLanguageIcon, formatRelativeTime } from '../lib/utils';
import { 
  Play, 
  ChevronRight, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Sparkles,
  User,
  ExternalLink,
  Monitor,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Trophy,
  Flame,
  Star,
  Award,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface LeaderboardItem {
  id: string;
  name: string;
  avatar: string | null;
  xp: number;
  level: number;
  isSelf: boolean;
}

export default function StudentClassroom({ 
  classroom, 
  theme, 
  setTheme 
}: { 
  classroom: ClassRoom, 
  theme: 'vs-dark' | 'light',
  setTheme: (t: 'vs-dark' | 'light') => void 
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [activePanel, setActivePanel] = useState<'problem' | 'resources' | 'leaderboard'>('problem');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  // On small/medium screens, default the sidebar to closed so the editor
  // (the actual coding surface) is what mobile/tablet users see first,
  // instead of a 380px panel eating the whole narrow viewport.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarVisible(false);
    }
  }, []);
  const [teacherProfile, setTeacherProfile] = useState<UserProfile | null>(null);
  const [xp, setXp] = useState(1250);
  const [level, setLevel] = useState(12);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);

  useEffect(() => {
    async function fetchLeaderboard() {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, photo_url, xp, level')
        .order('xp', { ascending: false })
        .limit(5);
      
      if (data) {
        setLeaderboard(data.map(d => ({
          id: d.id,
          name: d.name,
          xp: d.xp || 0,
          level: d.level || 1,
          avatar: d.photo_url || null,
          isSelf: d.id === user?.id
        })));
      }
    }
    fetchLeaderboard();
  }, [user]);
  
  const lastSyncRef = useRef<number>(0);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const hintDecorationRef = useRef<any>(null);
  const prevSubmissionStatusRef = useRef<Record<string, string>>({});
  const hasLoadedSubsOnceRef = useRef(false);
  const [reflectPrompt, setReflectPrompt] = useState<null | { submissionId: string; problemTitle: string; code: string; language?: string; question: string }>(null);
  const [reflectAnswer, setReflectAnswer] = useState('');
  const [reflectResult, setReflectResult] = useState<null | { understood: boolean; feedback: string }>(null);
  const [isReflectLoading, setIsReflectLoading] = useState(false);
  const [sharePrompt, setSharePrompt] = useState<null | { draft: string }>(null);
  const [isSharing, setIsSharing] = useState(false);

  const getDefaultCode = (lang: string) => {
    switch (lang) {
      case 'python': return 'print("Hello, World!")';
      case 'javascript': return 'console.log("Hello, World!");';
      case 'java': return 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}';
      case 'cpp': return '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello, World!" << endl;\n  return 0;\n}';
      default: return '';
    }
  };

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', classroom.teacherId)
          .single();
        
        if (data) {
          setTeacherProfile({ uid: data.id, ...data } as UserProfile);
        }
      } catch (err) {
        console.error('Error fetching teacher profile:', err);
      }
    };
    fetchTeacher();
  }, [classroom.teacherId]);

  const [activeUsers, setActiveUsers] = useState<{ id: string; name: string; photoURL: string }[]>([]);

  useEffect(() => {
    const fetchActiveUsers = async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('live_sessions')
        .select('student_id, profiles(name, photo_url)')
        .eq('classroom_id', classroom.id)
        .gt('last_updated', fiveMinutesAgo);
      
      if (data) {
        const uniqueUsers = Array.from(new Set(data.map(d => d.student_id)))
          .map(id => {
            const userSnap = data.find(d => d.student_id === id);
            const profile = userSnap?.profiles as unknown as { name: string; photo_url: string } | null;
            return {
              id,
              name: profile?.name || 'Peer',
              photoURL: profile?.photo_url || ''
            };
          })
          .filter(u => u.id !== user?.id);
        setActiveUsers(uniqueUsers);
      }
    };

    fetchActiveUsers();
    const interval = setInterval(fetchActiveUsers, 30000); // Update every 30s

    const liveSub = supabase
      .channel('live_users_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions', filter: `classroom_id=eq.${classroom.id}` }, () => {
        fetchActiveUsers();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      liveSub.unsubscribe();
    };
  }, [classroom.id, user?.id]);

  useEffect(() => {
    // Initial fetch and subscription for problems
    const fetchProblems = async () => {
      const { data } = await supabase
        .from('problems')
        .select('*')
        .eq('classroom_id', classroom.id)
        .order('created_at', { ascending: false });
      
      if (data) {
        const probs = data.map((row: any) => ({
          id: row.id,
          title: row.title,
          description: row.description,
          type: row.type,
          language: row.language,
          instructionsUrl: row.instructions_url,
          starterCode: row.starter_code,
          sampleInput: row.sample_input,
          expectedOutput: row.expected_output,
          createdAt: row.created_at,
        })) as Problem[];
        setProblems(probs);
        if (probs.length > 0 && !selectedProblem) {
          setSelectedProblem(probs[0]);
          setCode(probs[0].starterCode || getDefaultCode(probs[0].language));
        }
      }
    };

    const problemSub = supabase
      .channel('student_problems_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'problems', filter: `classroom_id=eq.${classroom.id}` }, () => {
        fetchProblems();
      })
      .subscribe();

    // Initial fetch and subscription for resources
    const fetchResources = async () => {
      const { data } = await supabase
        .from('resources')
        .select('*')
        .eq('classroom_id', classroom.id)
        .order('created_at', { ascending: false });
      if (data) setResources(data.map((row: any) => ({
        id: row.id,
        name: row.name,
        url: row.url,
        type: row.type,
        createdAt: row.created_at,
      })) as Resource[]);
    };

    const resourceSub = supabase
      .channel('student_resources_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources', filter: `classroom_id=eq.${classroom.id}` }, () => {
        fetchResources();
      })
      .subscribe();

    fetchProblems();
    fetchResources();

    return () => {
      problemSub.unsubscribe();
      resourceSub.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroom.id]);

  useEffect(() => {
    if (!selectedProblem || !user) return;
    
    // Fetch user's submissions for this problem
    const fetchSubmissions = async () => {
      const { data } = await supabase
        .from('submissions')
        .select('*, problems(title, language)')
        .eq('student_id', user.id)
        .eq('problem_id', selectedProblem.id)
        .order('submitted_at', { ascending: false });
      
      if (data) {
        const mapped = data.map(d => ({
          id: d.id,
          studentId: d.student_id,
          problemId: d.problem_id,
          problemTitle: d.problems?.title,
          language: d.problems?.language,
          code: d.code,
          output: d.output,
          status: d.status,
          feedback: d.feedback,
          submittedAt: d.submitted_at
        } as Submission));

        setSubmissions(mapped);

        // Only celebrate a submission the FIRST time we witness it become
        // 'correct' live (via the realtime subscription below) — not on
        // initial page load, and not repeatedly on every re-fetch.
        const newlyCorrect = mapped.find(
          (s) => s.status === 'correct' && prevSubmissionStatusRef.current[s.id] !== 'correct'
        );
        mapped.forEach((s) => { prevSubmissionStatusRef.current[s.id] = s.status; });

        if (hasLoadedSubsOnceRef.current && newlyCorrect) {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#10b981', '#f59e0b']
          });
          triggerReflectCheck(newlyCorrect);
        }
        hasLoadedSubsOnceRef.current = true;
      }
    };

    const subSub = supabase
      .channel('student_subs_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions', filter: `student_id=eq.${user.id}` }, () => {
        fetchSubmissions();
      })
      .subscribe();

    fetchSubmissions();

    return () => {
      subSub.unsubscribe();
    };
  }, [selectedProblem, user, classroom.id]);

  // Sync code to Supabase (throttled)
  useEffect(() => {
    if (!user || !selectedProblem || !code) return;

    const syncCode = async () => {
      const now = Date.now();
      if (now - lastSyncRef.current < 2000) return; // Sync every 2 seconds

      try {
        await supabase
          .from('live_sessions')
          .upsert({
            classroom_id: classroom.id,
            student_id: user.id,
            problem_id: selectedProblem.id,
            code,
            language: selectedProblem.language,
            last_updated: new Date().toISOString()
          }, { onConflict: 'classroom_id,student_id' });
        
        lastSyncRef.current = now;
      } catch (err) {
        console.error('Failed to sync code:', err);
      }
    };

    const timeout = setTimeout(syncCode, 1000);
    return () => clearTimeout(timeout);
  }, [code, user, selectedProblem, classroom.id]);

  const [isGettingHint, setIsGettingHint] = useState(false);

  const handleGetHint = async () => {
    if (!selectedProblem || !code) return;
    setIsGettingHint(true);
    try {
      const response = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemTitle: selectedProblem.title,
          problemDescription: selectedProblem.description,
          code,
          language: selectedProblem.language
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (errData.error === 'missing_api_key') {
          setOutput(prev => `[AI Error] Gemini API Key configuration required. Please ensure GEMINI_API_KEY / VITE_GEMINI_API_KEY is configured in Vercel settings.\n\n${prev}`);
          setActivePanel('problem');
          return;
        }
        throw new Error(errData.message || 'Hint generation failed');
      }

      const data = await response.json();
      const hint = data.text || "I'm sorry, I couldn't think of a hint right now. Try reviewing the problem requirements!";
      
      // Add hint to the console output area
      setOutput(prev => `[AI TUTOR HINT]\n${hint}\n\n${prev}`);
      setActivePanel('problem'); // Ensure they see the description/log area if needed, but we put it in output

      // Highlight the specific line the AI pointed to, if it gave one
      if (editorRef.current && monacoRef.current) {
        if (typeof data.line === 'number' && data.line > 0) {
          const decorations = [{
            range: new monacoRef.current.Range(data.line, 1, data.line, 1),
            options: {
              isWholeLine: true,
              className: 'ai-hint-line-highlight',
              glyphMarginClassName: 'ai-hint-glyph',
              glyphMarginHoverMessage: { value: 'AI Tutor flagged this line' },
            },
          }];
          hintDecorationRef.current = editorRef.current.createDecorationsCollection
            ? editorRef.current.createDecorationsCollection(decorations)
            : editorRef.current.deltaDecorations(hintDecorationRef.current ? [hintDecorationRef.current] : [], decorations);
          editorRef.current.revealLineInCenter(data.line);
        } else if (hintDecorationRef.current) {
          if (hintDecorationRef.current.clear) hintDecorationRef.current.clear();
          hintDecorationRef.current = null;
        }
      }
    } catch (err) {
      console.error('AI Hint Error:', err);
      setOutput(prev => `[AI Error] Could not get a hint. ${prev}`);
    } finally {
      setIsGettingHint(false);
    }
  };

  // When a submission is confirmed correct, ask the AI to generate one
  // short comprehension question specific to THIS student's code — a quick,
  // low-stakes check that they understand what they wrote, not just that it
  // happened to work. This is intentionally generous, not a hard gate.
  const triggerReflectCheck = async (submission: Submission) => {
    try {
      const response = await fetch('/api/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemTitle: submission.problemTitle || 'this problem',
          code: submission.code,
          language: submission.language,
        }),
      });
      if (!response.ok) return; // Fail silently — this is a bonus feature, never block the celebration
      const data = await response.json();
      if (data.question) {
        setReflectAnswer('');
        setReflectResult(null);
        setReflectPrompt({
          submissionId: submission.id,
          problemTitle: submission.problemTitle || 'this problem',
          code: submission.code,
          language: submission.language,
          question: data.question,
        });
      }
    } catch (err) {
      console.error('Reflect check generation failed (non-blocking):', err);
    }
  };

  const submitReflectAnswer = async () => {
    if (!reflectPrompt || !reflectAnswer.trim()) return;
    setIsReflectLoading(true);
    try {
      const response = await fetch('/api/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemTitle: reflectPrompt.problemTitle,
          code: reflectPrompt.code,
          language: reflectPrompt.language,
          answer: reflectAnswer,
        }),
      });
      const data = await response.json();
      setReflectResult({
        understood: data.understood !== false,
        feedback: data.feedback || "Thanks for sharing your thinking!",
      });
    } catch (err) {
      console.error('Reflect answer check failed:', err);
      setReflectResult({ understood: true, feedback: "Thanks for sharing your thinking!" });
    } finally {
      setIsReflectLoading(false);
    }
  };

  const openSharePrompt = () => {
    const title = reflectPrompt?.problemTitle || 'a problem';
    setReflectPrompt(null);
    setSharePrompt({ draft: `Just solved "${title}" in ${classroom.className}! 🎉` });
  };

  const postShareToPeerHub = async () => {
    if (!user || !sharePrompt?.draft.trim()) return;
    setIsSharing(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('name, photo_url').eq('id', user.id).single();
      await supabase.from('posts').insert({
        author_id: user.id,
        author_name: profile?.name || user.email?.split('@')[0] || 'Anonymous',
        author_avatar: profile?.photo_url || user.id,
        content: sharePrompt.draft.trim(),
        likes_count: 0,
      });
      setSharePrompt(null);
    } catch (err) {
      console.error('Share to Peer Hub failed:', err);
      setSharePrompt(null);
    } finally {
      setIsSharing(false);
    }
  };

  const handleRun = async () => {
    if (!selectedProblem || !code) return;
    setIsRunning(true);
    let outputResult: string;
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
      setOutput(outputResult!);
      setIsRunning(false);
    }
  };

  const simulateOutput = async (code: string, language: string) => {
    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });

      if (!response.ok) {
        throw new Error('Simulation failed');
      }

      const data = await response.json();
      return data.text || 'No output produced.';
    } catch (e) {
      console.error('AI Simulation Error:', e);
      return 'Execution Engine Error: Connection failed. Please check your network.';
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedProblem || !code) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .insert({
          student_id: user.id,
          problem_id: selectedProblem.id,
          code,
          output,
          status: 'pending'
        });
      
      if (error) throw error;
      
      // Notification for teacher
      const { data: profile } = await supabase.from('profiles').select('name, photo_url').eq('id', user.id).single();
      await supabase.from('notifications').insert({
        user_id: classroom.teacherId, // Notify the teacher
        actor_id: user.id,
        actor_name: profile?.name || user.email?.split('@')[0] || 'Anonymous',
        actor_avatar: profile?.photo_url || user.id,
        type: 'submission',
        content: `submitted ${selectedProblem.title} in ${classroom.className}`,
        resource_id: classroom.id
      });

      // Celebration & Gamification
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b']
      });
      
      setXp(prev => prev + 150);
      if (xp + 150 >= 1500) {
        setLevel(prev => prev + 1);
        setXp(0);
        // Level up special effect
        setTimeout(() => {
          confetti({
            particleCount: 400,
            spread: 160,
            origin: { y: 0.5 },
            colors: ['#FFD700', '#FFA500']
          });
        }, 500);
      }

    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-screen overflow-hidden transition-colors duration-500",
      theme === 'light' ? "bg-white text-zinc-950 font-medium" : "bg-zinc-950 text-zinc-100"
    )}>
      {/* Premium Header */}
      <header className={cn(
        "min-h-14 backdrop-blur-3xl border-b px-4 sm:px-6 flex flex-wrap items-center justify-between gap-y-2 py-2 relative z-50 transition-all",
        theme === 'light' ? "bg-white/80 border-zinc-200" : "bg-zinc-950/80 border-zinc-900"
      )}>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className={cn(
            "transition-all group flex items-center gap-2",
            theme === 'light' ? "text-zinc-600 hover:text-zinc-950" : "text-zinc-500 hover:text-white"
          )}>
            <div className={cn(
              "w-7 h-7 rounded-lg border flex items-center justify-center transition-all",
              theme === 'light' ? "bg-zinc-50 border-zinc-200 group-hover:bg-zinc-950 group-hover:text-white" : "bg-zinc-900 border-zinc-800 group-hover:bg-white group-hover:text-zinc-950"
            )}>
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Dashboard</span>
          </Link>
          <div className={cn("h-5 w-px", theme === 'light' ? "bg-zinc-200" : "bg-zinc-800")} />
          <div className="flex items-center gap-2.5">
            <h1 className={cn("font-display font-bold text-base tracking-tight truncate max-w-[140px] sm:max-w-none", theme === 'light' ? "text-zinc-950" : "text-white")}>{classroom.className}</h1>
            <div className={cn("px-2 py-0.5 rounded-md border hidden sm:block", theme === 'light' ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900 border-zinc-800")}>
               <span className={cn("text-[9px] font-mono uppercase tracking-widest", theme === 'light' ? "text-zinc-600" : "text-zinc-500")}>{classroom.roomCode}</span>
            </div>
          </div>
          <div className={cn("h-5 w-px ml-4", theme === 'light' ? "bg-zinc-200" : "bg-zinc-800")} />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsSidebarVisible(!isSidebarVisible)}
            className={cn(
              "ml-2 rounded-xl transition-all h-9 px-3",
              theme === 'light' ? "text-zinc-600 hover:bg-zinc-100" : "text-zinc-400 hover:bg-white/5 hover:text-white"
            )}
            title={isSidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
          >
            {isSidebarVisible ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {/* XP & Level Indicator */}
          <div className={cn(
            "hidden lg:flex items-center gap-4 px-4 py-1.5 rounded-2xl border transition-all",
            theme === 'light' ? "bg-white border-zinc-200" : "bg-zinc-900 border-zinc-800"
          )}>
            <div className="flex flex-col items-end">
              <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] opacity-50", theme === 'light' ? "text-zinc-600" : "text-zinc-400")}>LVL {level}</span>
              <div className={cn("w-20 h-1 rounded-full overflow-hidden mt-1", theme === 'light' ? "bg-zinc-100" : "bg-zinc-950")}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(xp / 1500) * 100}%` }}
                  className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                />
              </div>
            </div>
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center border shadow-inner",
              theme === 'light' ? "bg-zinc-50 border-zinc-100" : "bg-zinc-950 border-zinc-800"
            )}>
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
          </div>

          <div className={cn(
            "flex items-center gap-1 rounded-lg p-1 border transition-all",
            theme === 'light' ? "bg-zinc-100 border-zinc-200" : "bg-zinc-900 border-zinc-800"
          )}>
            <button 
              onClick={() => setTheme('light')} 
              className={cn("p-1.5 rounded-md transition-all flex items-center gap-2 px-2 sm:px-3", theme === 'light' ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-950")}
              title="Light Theme"
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold hidden sm:inline">Light</span>
            </button>
            <button 
              onClick={() => setTheme('vs-dark')} 
              className={cn("p-1.5 rounded-md transition-all flex items-center gap-2 px-2 sm:px-3", theme === 'vs-dark' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-white")}
              title="Dark Theme"
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold hidden sm:inline">Dark</span>
            </button>
          </div>

          <Link to="/ai-tutor">
            <Button size="sm" variant="ghost" className={cn(
              "rounded-xl group transition-all text-xs border border-transparent",
              theme === 'light' ? "text-zinc-800 hover:text-zinc-950 hover:bg-zinc-100 hover:border-zinc-200" : "text-zinc-400 hover:text-white hover:bg-white/5 hover:border-zinc-800"
            )}>
              <Sparkles className="w-3.5 h-3.5 md:mr-2 text-amber-500 group-hover:scale-125 transition-transform" /> <span className="hidden md:inline">AI Tutor</span>
            </Button>
          </Link>
          
          <div className={cn(
            "flex items-center gap-2 p-1 rounded-xl border transition-all",
            theme === 'light' ? "bg-zinc-100 border-zinc-200" : "bg-zinc-900/50 border-zinc-900"
          )}>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleGetHint} 
              isLoading={isGettingHint}
              className="text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all h-8"
              title="Get a hint from AI"
            >
              <Sparkles className="w-3.5 h-3.5 sm:mr-2" /> <span className="hidden sm:inline">Hint</span>
            </Button>
            <div className={cn("w-px h-4 mx-1", theme === 'light' ? "bg-zinc-200" : "bg-zinc-800")} />
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleRun} 
              isLoading={isRunning}
              className="text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all h-8"
            >
              <Play className="w-3.5 h-3.5 sm:mr-2 fill-emerald-500" /> <span className="hidden sm:inline">Run</span>
            </Button>
            <Button 
              size="md" 
              onClick={handleSubmit} 
              isLoading={isSubmitting}
              className={cn(
                "rounded-lg font-black uppercase text-[10px] tracking-widest h-8 px-4 shadow-2xl transition-all",
                theme === 'light' ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200" : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-900/40"
              )}
            >
              Submit
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Backdrop — closes the sidebar overlay on small/medium screens when tapped outside it */}
        {isSidebarVisible && (
          <div
            onClick={() => setIsSidebarVisible(false)}
            className="fixed inset-0 top-14 z-30 bg-black/40 lg:hidden"
          />
        )}
        {/* Left Side: Tasks & Resources (Glassmorphism Sidebar) */}
        <motion.div 
          initial={false}
          animate={{ 
            width: isSidebarVisible ? 380 : 0,
            opacity: isSidebarVisible ? 1 : 0,
            x: isSidebarVisible ? 0 : -20
          }}
          transition={{ 
            duration: 0.4, 
            ease: [0.16, 1, 0.3, 1],
            opacity: { duration: 0.2 }
          }}
          className={cn(
            "border-r flex flex-col overflow-hidden transition-colors duration-500 shrink-0",
            "fixed inset-y-14 left-0 z-40 lg:relative lg:inset-auto lg:z-40",
            theme === 'light' ? "bg-zinc-50 border-zinc-200" : "bg-zinc-950 border-zinc-900"
          )}
        >
          <div className="w-[min(380px,88vw)] flex flex-col h-full"> 
            <div className="p-4 pb-2 flex gap-3">
                  <button 
                    onClick={() => setActivePanel('problem')}
                    className={cn(
                      "flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden",
                      activePanel === 'problem' 
                        ? (theme === 'light' ? "text-zinc-950" : "text-white") 
                        : "text-zinc-500 hover:text-zinc-400"
                    )}
                  >
                    Assignments
                    {activePanel === 'problem' && (
                      <motion.div layoutId="panel-active" className={cn(
                        "absolute inset-0 border -z-10 rounded-xl shadow-inner",
                        theme === 'light' ? "bg-white border-zinc-200 shadow-zinc-200" : "bg-white/5 border-white/10 shadow-white/5"
                      )} />
                    )}
                  </button>
                  <button 
                    onClick={() => setActivePanel('leaderboard')}
                    className={cn(
                      "flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden flex items-center justify-center gap-2",
                      activePanel === 'leaderboard' 
                        ? (theme === 'light' ? "text-zinc-950" : "text-white") 
                        : "text-zinc-500 hover:text-zinc-400"
                    )}
                  >
                    Hall of Fame
                    {activePanel === 'leaderboard' && (
                      <motion.div layoutId="panel-active" className={cn(
                        "absolute inset-0 border -z-10 rounded-xl shadow-inner",
                        theme === 'light' ? "bg-white border-zinc-200 shadow-zinc-200" : "bg-white/5 border-white/10 shadow-white/5"
                      )} />
                    )}
                    <Trophy className={cn("w-3 h-3 transition-colors", activePanel === 'leaderboard' ? "text-yellow-500" : "opacity-30")} />
                  </button>
                  <button 
                    onClick={() => setActivePanel('resources')}
                    className={cn(
                      "flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden flex items-center justify-center gap-2",
                      activePanel === 'resources' 
                        ? (theme === 'light' ? "text-zinc-950" : "text-white") 
                        : "text-zinc-500 hover:text-zinc-400"
                    )}
                  >
                    Resources
                    {activePanel === 'resources' && (
                      <motion.div layoutId="panel-active" className={cn(
                        "absolute inset-0 border -z-10 rounded-xl shadow-inner",
                        theme === 'light' ? "bg-white border-zinc-200 shadow-zinc-200" : "bg-white/5 border-white/10 shadow-white/5"
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
                  <label className={cn("text-[10px] font-black uppercase tracking-[0.3em] mb-4 block ml-1", theme === 'light' ? "text-zinc-500" : "text-zinc-600")}>Class Projects</label>
                  
                  <div className="space-y-3">
                    {problems.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedProblem(p);
                          setCode(p.starterCode || getDefaultCode(p.language));
                        }}
                        className={cn(
                          "w-full p-3.5 rounded-2xl border text-left transition-all group relative overflow-hidden",
                          selectedProblem?.id === p.id 
                            ? (theme === 'light' ? "bg-zinc-950 border-black shadow-xl" : "bg-white border-white shadow-[0_0_40px_rgba(255,255,255,0.1)]")
                            : (theme === 'light' ? "bg-white border-zinc-200 hover:border-zinc-400" : "bg-zinc-900 border-zinc-800 hover:border-zinc-700")
                        )}
                      >
                        <div className="flex items-center gap-4 relative z-10 transition-transform duration-500 group-hover:translate-x-1">
                          <div className={cn(
                            "w-8 h-8 rounded-xl border flex items-center justify-center p-1.5 transition-all",
                            selectedProblem?.id === p.id 
                              ? (theme === 'light' ? "bg-white border-zinc-200 text-zinc-950" : "bg-black border-zinc-800 text-white") 
                              : (theme === 'light' ? "bg-zinc-50 border-zinc-100 text-zinc-950" : "bg-zinc-950 border-zinc-800 text-white")
                          )}>
                            <img src={getLanguageIcon(p.language)} alt={p.language} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <p className={cn(
                              "text-sm font-bold tracking-tight",
                              selectedProblem?.id === p.id 
                                ? (theme === 'light' ? "text-white" : "text-zinc-950") 
                                : (theme === 'light' ? "text-zinc-950" : "text-zinc-200")
                            )}>{p.title}</p>
                            <p className={cn(
                              "text-[9px] font-black uppercase tracking-[0.1em] opacity-40 mt-0.5",
                              selectedProblem?.id === p.id ? (theme === 'light' ? "text-zinc-200" : "text-zinc-900") : (theme === 'light' ? "text-zinc-600" : "text-zinc-500")
                            )}>{p.type || 'EXERCISE'} • {p.language}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {selectedProblem && (
                      <div className="pt-6 border-t border-zinc-100 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h2 className={cn("text-xl font-display font-bold tracking-tight leading-tight", theme === 'light' ? "text-black" : "text-white")}>{selectedProblem.title}</h2>
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
                        <Link to={`/profile/${teacherProfile.uid}`}>
                          <div className={cn("flex items-center gap-3 p-2.5 rounded-xl border transition-all hover:border-blue-600 hover:shadow-lg group/teacher cursor-pointer", theme === 'light' ? "bg-zinc-100 border-zinc-200" : "bg-white/5 border-white/10")}>
                            <div className={cn("w-8 h-8 rounded-xl overflow-hidden border", theme === 'light' ? "border-zinc-300" : "border-white/10")}>
                              <img 
                                src={teacherProfile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacherProfile.uid}`} 
                                alt={teacherProfile.name} 
                                className="w-full h-full object-cover group-hover/teacher:scale-110 transition-transform"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <p className={cn("text-[8px] font-black uppercase tracking-[0.2em]", theme === 'light' ? "text-zinc-600" : "text-zinc-500")}>Teacher</p>
                            <p className={cn("text-[11px] font-bold group-hover/teacher:text-blue-600 transition-colors", theme === 'light' ? "text-zinc-950" : "text-zinc-300")}>{teacherProfile.name}</p>
                          </div>
                        </Link>
                      )}

                      {selectedProblem.instructionsUrl && (
                        <a 
                          href={selectedProblem.instructionsUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className={cn(
                            "flex items-center justify-between p-4 rounded-2xl border transition-all duration-500 group",
                            theme === 'light' ? "bg-zinc-50 border-zinc-200 hover:bg-zinc-950 hover:text-white" : "bg-zinc-900 border-zinc-800 hover:bg-white hover:text-zinc-950"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl border flex items-center justify-center transition-all",
                              theme === 'light' ? "bg-white border-zinc-200 group-hover:bg-zinc-950 group-hover:text-white" : "bg-white/5 border-white/10 group-hover:bg-zinc-950 group-hover:text-white"
                            )}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className={cn("text-sm font-bold", theme === 'light' ? "group-hover:text-white" : "")}>Project Handout</p>
                              <p className={cn("text-[10px] uppercase font-black tracking-widest", theme === 'light' ? "text-zinc-600 group-hover:text-zinc-400" : "opacity-50")}>Instructions PDF</p>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 opacity-30 group-hover:opacity-100" />
                        </a>
                      )}
                    </div>

                    <div className={cn(
                      "p-6 rounded-[2rem] border relative overflow-hidden group transition-colors",
                      theme === 'light' ? "bg-zinc-50 border-zinc-200" : "bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-900"
                    )}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-[80px] opacity-[0.02] -mr-16 -mt-16 group-hover:opacity-[0.05] transition-opacity" />
                      <label className={cn("text-[10px] font-black uppercase tracking-[0.3em] mb-4 block", theme === 'light' ? "text-zinc-700" : "text-zinc-600")}>Requirements</label>
                      <div className={cn(
                        "text-sm leading-relaxed whitespace-pre-wrap font-medium markdown-body",
                        theme === 'light' ? "text-zinc-950" : "text-zinc-100"
                      )}>
                        <ReactMarkdown
                          components={{
                            code({ inline, className, children, ...props }: { inline?: boolean, className?: string, children?: React.ReactNode }) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <div className={cn(
                                  "my-6 rounded-2xl overflow-hidden border shadow-2xl",
                                  theme === 'light' ? "border-zinc-200" : "border-zinc-800"
                                )}>
                                  <div className={cn(
                                    "px-4 py-2 border-b flex justify-between items-center",
                                    theme === 'light' ? "bg-zinc-50 border-zinc-200" : "bg-black/40 border-zinc-800"
                                  )}>
                                    <span className={cn("text-[10px] font-black uppercase tracking-widest", theme === 'light' ? "text-zinc-500" : "text-zinc-500")}>{match[1]}</span>
                                  </div>
                                  <SyntaxHighlighter
                                    style={theme === 'light' ? prism : vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{ margin: 0, padding: '24px', fontSize: '13px', backgroundColor: theme === 'light' ? '#f8fafc' : '#0c0c0e' }}
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                </div>
                              ) : (
                                <code className={cn(
                                  "px-2 py-0.5 rounded-lg font-bold font-mono text-[0.85em]",
                                  theme === 'light' ? "bg-zinc-100 text-zinc-950" : "bg-white/5 text-blue-400"
                                )} {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {selectedProblem.description}
                        </ReactMarkdown>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className={cn("text-[10px] font-black uppercase tracking-[0.3em] ml-1", theme === 'light' ? "text-zinc-500" : "text-zinc-600")}>Submission Log</label>
                      <div className="space-y-3">
                        {submissions.length === 0 ? (
                          <div className={cn("p-10 text-center border border-dashed rounded-[2rem]", theme === 'light' ? "bg-zinc-100 border-zinc-200 text-zinc-500" : "bg-zinc-950 border-zinc-900 text-zinc-600")}>
                             <p className="text-xs font-bold italic">No submissions yet.</p>
                          </div>
                        ) : (
                          submissions.map(sub => (
                            <div key={sub.id} className={cn(
                              "p-5 rounded-3xl border backdrop-blur-md relative group overflow-hidden transition-all",
                              theme === 'light' ? "bg-white border-zinc-200 shadow-sm" : "bg-zinc-900/40 border-zinc-900 shadow-2xl"
                            )}>
                              <div className={cn("absolute top-0 left-0 w-1 h-full transition-colors", theme === 'light' ? "bg-zinc-200 group-hover:bg-zinc-950" : "bg-zinc-800 group-hover:bg-white")} />
                              <div className="flex justify-between items-center mb-4">
                                <span 
                                  className={cn("text-[11px] font-mono uppercase tracking-widest", theme === 'light' ? "text-zinc-500" : "text-zinc-500")}
                                  title={new Date(sub.submittedAt).toLocaleString()}
                                >
                                  {formatRelativeTime(sub.submittedAt)}
                                </span>
                                <StatusBadge status={sub.status} theme={theme} />
                              </div>
                              {sub.feedback && (
                                <div className={cn(
                                  "mt-2 flex items-start gap-4 p-4 rounded-2xl border",
                                  theme === 'light' ? "bg-zinc-50 border-zinc-100" : "bg-white/5 border-white/5"
                                )}>
                                  <div className={cn(
                                    "w-8 h-8 rounded-full border flex items-center justify-center shrink-0",
                                    theme === 'light' ? "bg-white border-zinc-200 shadow-sm" : "bg-zinc-950 border-white/10"
                                  )}>
                                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                                  </div>
                                  <p className={cn("text-xs font-medium leading-relaxed italic", theme === 'light' ? "text-zinc-900" : "text-zinc-300")}>"{sub.feedback}"</p>
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
              ) : activePanel === 'leaderboard' ? (
                <motion.div
                  key="leaderboard-panel"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8 mt-6 pb-20"
                >
                  <div>
                    <h2 className={cn("text-2xl font-display font-bold mb-2 tracking-tight", theme === 'light' ? "text-zinc-950" : "text-white")}>Hall of Fame</h2>
                    <p className="text-xs font-medium text-zinc-500">The top coding students in this classroom.</p>
                  </div>

                  <div className="space-y-3">
                    {leaderboard.map((student, idx) => (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={student.id || student.name}
                        onClick={() => student.id && navigate(`/profile/${student.id}`)}
                        className={cn(
                          "p-4 rounded-3xl border flex items-center justify-between group transition-all cursor-pointer",
                          student.isSelf 
                            ? (theme === 'light' ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200" : "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-900/40")
                            : (theme === 'light' ? "bg-white border-zinc-200 hover:border-zinc-400" : "bg-zinc-900 border-zinc-800 hover:border-zinc-700")
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs",
                            student.isSelf ? "bg-white/20 border-white/30 text-white" : (theme === 'light' ? "bg-zinc-50 border-zinc-200" : "bg-zinc-950 border-zinc-800")
                          )}>
                            {idx + 1}
                          </div>
                          <div className="w-10 h-10 rounded-2xl overflow-hidden border border-inherit">
                             {student.avatar && student.avatar.startsWith('http') ? (
                               <img src={student.avatar} alt={`${student.name}'s avatar`} className="w-full h-full object-cover" />
                             ) : (
                               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.avatar}`} alt={`${student.name}'s avatar`} className="w-full h-full object-cover" />
                             )}
                          </div>
                          <div>
                            <p className="text-sm font-bold tracking-tight uppercase">{student.name}</p>
                            <p className={cn("text-[9px] font-black uppercase tracking-widest opacity-60", student.isSelf ? "text-blue-100" : "")}>LEVEL {student.level}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <Star className={cn("w-3 h-3", student.isSelf ? "text-blue-200" : "text-amber-500")} />
                            <span className="text-xs font-black">{student.xp.toLocaleString()}</span>
                          </div>
                          <p className={cn("text-[8px] font-bold uppercase opacity-40", student.isSelf ? "text-blue-100" : "")}>TOTAL XP</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className={cn(
                    "p-6 rounded-[2rem] border border-dashed flex flex-col items-center text-center",
                    theme === 'light' ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900 border-zinc-800"
                  )}>
                    <Award className="w-8 h-8 text-blue-500 mb-3" />
                    <p className="text-xs font-bold mb-1">Weekly Challenge</p>
                    <p className={cn("text-[10px] leading-relaxed", theme === 'light' ? "text-zinc-600" : "text-zinc-500")}>Solve 3 assignments this week to earn the <span className="text-blue-500 font-black">"Speed Coder"</span> badge!</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="resources-panel"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8 mt-6 pb-20"
                >
                    <div>
                    <h2 className={cn("text-2xl font-display font-bold mb-2 tracking-tight transition-colors", theme === 'light' ? "text-zinc-950" : "text-white")}>Study Materials</h2>
                    <p className={cn("text-sm font-medium transition-colors", theme === 'light' ? "text-zinc-800 font-bold" : "text-zinc-500")}>Learning resources shared by your teacher.</p>
                  </div>
                  {resources.length === 0 ? (
                    <div className={cn("py-20 text-center border-2 border-dashed rounded-[3rem] transition-colors", theme === 'light' ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900 border-zinc-800")}>
                      <FileText className={cn("w-12 h-12 mx-auto mb-4 transition-colors", theme === 'light' ? "text-zinc-300" : "text-zinc-800")} />
                      <p className={cn("text-[10px] font-black uppercase tracking-widest", theme === 'light' ? "text-zinc-400" : "text-zinc-700")}>No data found in cache</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {resources.map(res => (
                        <a 
                          key={res.id}
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(
                            "flex items-center gap-5 p-5 rounded-[2.5rem] border transition-all duration-500 group",
                            theme === 'light' ? "bg-white border-zinc-200 hover:border-zinc-900 hover:shadow-xl" : "bg-zinc-900 border-zinc-800 hover:bg-white hover:text-zinc-950"
                          )}
                        >
                          <div className={cn(
                            "w-14 h-14 rounded-3xl border flex items-center justify-center shadow-sm transition-all",
                            theme === 'light' ? "bg-zinc-50 border-zinc-100 group-hover:bg-zinc-950 group-hover:text-white" : "bg-zinc-900 border-zinc-800 group-hover:bg-zinc-950 group-hover:text-white"
                          )}>
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className={cn("text-base font-bold truncate tracking-tight transition-colors", theme === 'light' ? "text-zinc-950" : "text-zinc-100")}>{res.name}</p>
                            <p className={cn("text-[10px] font-mono tracking-widest uppercase mt-1", theme === 'light' ? "text-zinc-500 group-hover:text-zinc-400" : "text-zinc-500 group-hover:text-zinc-400")}>{res.type.replace('application/', '')}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all" />
                        </a>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active Peers Display */}
            {activeUsers.length > 0 && (
               <div className="mt-auto pt-8 border-t border-zinc-100/10">
                  <p className={cn("text-[9px] font-black uppercase tracking-[0.3em] mb-4 opacity-40 mx-8", theme === 'light' ? "text-zinc-600" : "text-zinc-400")}>Peers Coding Now</p>
                  <div className="flex flex-wrap gap-2 px-8 pb-8">
                     {activeUsers.map(peer => (
                       <div 
                         key={peer.id}
                         className={cn(
                           "flex items-center gap-2 p-1.5 pr-4 rounded-full border transition-all hover:scale-105",
                           theme === 'light' ? "bg-white border-zinc-100 shadow-sm" : "bg-white/5 border-white/5"
                         )}
                         title={`${peer.name} is coding...`}
                       >
                         <div className="w-7 h-7 rounded-full overflow-hidden border border-white/10 shrink-0">
                           {peer.photoURL ? (
                             <img src={peer.photoURL} alt={peer.name} className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                               <User className="w-4 h-4 text-white" />
                             </div>
                           )}
                         </div>
                         <span className={cn("text-[10px] font-bold truncate max-w-[90px]", theme === 'light' ? "text-zinc-950" : "text-white")}>{peer.name}</span>
                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                       </div>
                     ))}
                  </div>
               </div>
            )}
          </div>
        </div>
        </motion.div>

          <div className={cn(
            "flex-1 flex flex-col relative shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] transition-colors duration-500",
            theme === 'light' ? "bg-zinc-50" : "bg-[#0d0d0d]"
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
                  )}>Live Syncing</span>
               </div>
            </div>
  
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                theme={theme}
                language={selectedProblem?.language || 'python'}
                value={code}
                onChange={(value) => {
                  setCode(value || '');
                  if (hintDecorationRef.current) {
                    if (hintDecorationRef.current.clear) {
                      hintDecorationRef.current.clear();
                    } else if (editorRef.current) {
                      editorRef.current.deltaDecorations([hintDecorationRef.current], []);
                    }
                    hintDecorationRef.current = null;
                  }
                }}
              onMount={(editor, monacoInstance) => {
                editorRef.current = editor;
                monacoRef.current = monacoInstance;
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
                   glyphMargin: true,
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
                  <span className={cn("text-[10px] font-black uppercase tracking-[0.3em]", theme === 'light' ? "text-zinc-400" : "text-zinc-600")}>Code Output</span>
               </div>
               {isRunning && (
                 <div className="flex items-center gap-3 text-emerald-500">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Running...</span>
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
                    <div className={cn("leading-relaxed break-words whitespace-pre-wrap font-bold", theme === 'light' ? "text-zinc-950" : "text-zinc-300")}>
                       {output}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
                       <Monitor className={cn("w-12 h-12 mb-4", theme === 'light' ? "text-zinc-950" : "text-white")} />
                       <p className={cn("text-xs font-black uppercase tracking-widest leading-none", theme === 'light' ? "text-zinc-950" : "text-white")}>Run your code to see the output here</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Check: appears after a submission is confirmed correct, asking
          one short question about THIS student's specific code — reinforces
          that understanding matters, not just a passing status. */}
      <AnimatePresence>
        {reflectPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "w-full max-w-md rounded-3xl p-6 shadow-2xl border",
                theme === 'light' ? "bg-white border-zinc-200" : "bg-zinc-950 border-zinc-800"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <p className={cn("text-[10px] font-black uppercase tracking-widest", theme === 'light' ? "text-emerald-600" : "text-emerald-400")}>
                  Correct! Quick check
                </p>
              </div>
              <p className={cn("text-xs mb-4", theme === 'light' ? "text-zinc-500" : "text-zinc-400")}>
                One quick question about your own solution — no pressure, just curious.
              </p>

              {!reflectResult ? (
                <>
                  <p className={cn("font-bold text-sm mb-4 leading-relaxed", theme === 'light' ? "text-zinc-950" : "text-white")}>
                    {reflectPrompt.question}
                  </p>
                  <textarea
                    value={reflectAnswer}
                    onChange={(e) => setReflectAnswer(e.target.value)}
                    placeholder="Explain in a sentence or two..."
                    rows={3}
                    className={cn(
                      "w-full rounded-2xl p-3 text-sm resize-none border outline-none transition-colors mb-4",
                      theme === 'light'
                        ? "bg-zinc-50 border-zinc-200 text-zinc-950 focus:border-blue-400"
                        : "bg-zinc-900 border-zinc-800 text-white focus:border-blue-500"
                    )}
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={openSharePrompt}
                      className={cn("text-[10px] font-black uppercase tracking-widest px-4 py-2.5", theme === 'light' ? "text-zinc-400 hover:text-zinc-600" : "text-zinc-600 hover:text-zinc-400")}
                    >
                      Skip
                    </button>
                    <Button
                      onClick={submitReflectAnswer}
                      isLoading={isReflectLoading}
                      disabled={!reflectAnswer.trim()}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl"
                    >
                      Submit Answer
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-2">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center",
                    reflectResult.understood ? "bg-emerald-500/10" : "bg-amber-500/10"
                  )}>
                    {reflectResult.understood
                      ? <CheckCircle className="w-7 h-7 text-emerald-500" />
                      : <Sparkles className="w-7 h-7 text-amber-500" />}
                  </div>
                  <p className={cn("text-sm font-bold mb-6", theme === 'light' ? "text-zinc-950" : "text-white")}>
                    {reflectResult.feedback}
                  </p>
                  <Button
                    onClick={openSharePrompt}
                    className="w-full bg-zinc-950 hover:bg-zinc-800 text-white rounded-2xl"
                  >
                    Continue
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share to Peer Hub — offered right after the Quick Check flow, so
          Classroom and Peer Hub feel like one connected product, not two
          bolted-together features. */}
      <AnimatePresence>
        {sharePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "w-full max-w-md rounded-3xl p-6 shadow-2xl border",
                theme === 'light' ? "bg-white border-zinc-200" : "bg-zinc-950 border-zinc-800"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-5 h-5 text-blue-500" />
                <p className={cn("text-[10px] font-black uppercase tracking-widest", theme === 'light' ? "text-blue-600" : "text-blue-400")}>
                  Share this win?
                </p>
              </div>
              <p className={cn("text-xs mb-4", theme === 'light' ? "text-zinc-500" : "text-zinc-400")}>
                Let your classmates in Peer Hub know — totally optional.
              </p>
              <textarea
                value={sharePrompt.draft}
                onChange={(e) => setSharePrompt({ draft: e.target.value })}
                rows={3}
                className={cn(
                  "w-full rounded-2xl p-3 text-sm resize-none border outline-none transition-colors mb-4",
                  theme === 'light'
                    ? "bg-zinc-50 border-zinc-200 text-zinc-950 focus:border-blue-400"
                    : "bg-zinc-900 border-zinc-800 text-white focus:border-blue-500"
                )}
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSharePrompt(null)}
                  className={cn("text-[10px] font-black uppercase tracking-widest px-4 py-2.5", theme === 'light' ? "text-zinc-400 hover:text-zinc-600" : "text-zinc-600 hover:text-zinc-400")}
                >
                  Not Now
                </button>
                <Button
                  onClick={postShareToPeerHub}
                  isLoading={isSharing}
                  disabled={!sharePrompt.draft.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl"
                >
                  Post to Peer Hub
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status, theme }: { status: string, theme: 'light' | 'vs-dark' }) {
  if (status === 'correct') {
    return <span className="flex items-center text-green-500 text-xs font-bold gap-1"><CheckCircle className="w-3 h-3" /> Correct</span>;
  }
  if (status === 'incorrect') {
    return <span className="flex items-center text-red-500 text-xs font-bold gap-1"><XCircle className="w-3 h-3" /> Re-submit</span>;
  }
  return <span className={cn("text-xs font-bold", theme === 'light' ? "text-zinc-400" : "text-zinc-600")}>Pending</span>;
}
