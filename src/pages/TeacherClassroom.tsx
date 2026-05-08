import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ClassRoom, Problem, LiveCode, Submission, Resource } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Users, 
  Code, 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  LayoutGrid, 
  ListTodo, 
  MessageSquare, 
  Monitor,
  Copy,
  Check,
  FileText,
  Upload,
  Link as LinkIcon,
  Trash2,
  Sun,
  Moon,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { Editor } from '@monaco-editor/react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { cn, getLanguageIcon } from '../lib/utils';
import { deleteDoc } from 'firebase/firestore';

import DashboardLayout from '../components/DashboardLayout';

export default function TeacherClassroom({ 
  classroom, 
  theme, 
  setTheme 
}: { 
  classroom: ClassRoom,
  theme: 'light' | 'vs-dark',
  setTheme: (t: 'light' | 'vs-dark') => void
}) {
  const [activeTab, setActiveTab] = useState<'monitor' | 'problems' | 'submissions' | 'resources'>('monitor');
  const [problems, setProblems] = useState<Problem[]>([]);
  const [liveCodes, setLiveCodes] = useState<LiveCode[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const joinUrl = `${window.location.origin}/dashboard?join=${classroom.roomCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteProblem = async (problemId: string) => {
    if (!window.confirm('Are you sure you want to delete this problem?')) return;
    try {
      await deleteDoc(doc(db, 'classes', classroom.id, 'problems', problemId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `classes/${classroom.id}/problems/${problemId}`);
      alert('Failed to delete problem');
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await deleteDoc(doc(db, 'classes', classroom.id, 'resources', resourceId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `classes/${classroom.id}/resources/${resourceId}`);
      alert('Failed to delete resource');
    }
  };

  useEffect(() => {
    const unsubProblems = onSnapshot(
      query(collection(db, 'classes', classroom.id, 'problems'), orderBy('createdAt', 'desc')),
      (snap) => setProblems(snap.docs.map(d => ({ id: d.id, ...d.data() } as Problem))),
      (error) => handleFirestoreError(error, OperationType.LIST, `classes/${classroom.id}/problems`)
    );

    const unsubLive = onSnapshot(
      collection(db, 'classes', classroom.id, 'liveCode'),
      (snap) => setLiveCodes(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveCode))),
      (error) => handleFirestoreError(error, OperationType.LIST, `classes/${classroom.id}/liveCode`)
    );

    const unsubSubmissions = onSnapshot(
      query(collection(db, 'classes', classroom.id, 'submissions'), orderBy('submittedAt', 'desc')),
      (snap) => setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Submission))),
      (error) => handleFirestoreError(error, OperationType.LIST, `classes/${classroom.id}/submissions`)
    );

    const unsubResources = onSnapshot(
      query(collection(db, 'classes', classroom.id, 'resources'), orderBy('createdAt', 'desc')),
      (snap) => setResources(snap.docs.map(d => ({ id: d.id, ...d.data() } as Resource))),
      (error) => handleFirestoreError(error, OperationType.LIST, `classes/${classroom.id}/resources`)
    );

    return () => {
      unsubProblems();
      unsubLive();
      unsubSubmissions();
      unsubResources();
    };
  }, [classroom.id]);

  return (
    <DashboardLayout theme={theme}>
      <div className="max-w-[1600px] mx-auto pb-20">
        {/* Advanced Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-4 mb-2">
              <h1 className={cn("font-display font-bold text-3xl tracking-tighter leading-none", theme === 'light' ? "text-zinc-950" : "text-white")}>{classroom.className}</h1>
              <div className={cn("px-3 py-1 rounded-xl border", theme === 'light' ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900 border-zinc-800")}>
                <span className={cn("text-xs font-mono font-bold tracking-widest", theme === 'light' ? "text-zinc-600" : "text-zinc-400")}>{classroom.roomCode}</span>
              </div>
              <div className={cn(
                "flex items-center gap-1 rounded-xl p-1 border ml-4",
                theme === 'light' ? "bg-zinc-100 border-zinc-200 shadow-sm" : "bg-zinc-900 border-zinc-800 shadow-xl"
              )}>
                <button 
                  onClick={() => setTheme('light')} 
                  className={cn("p-1.5 rounded-lg transition-all flex items-center gap-2 px-3", theme === 'light' ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-950")}
                  title="Light mode"
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">Light</span>
                </button>
                <button 
                  onClick={() => setTheme('vs-dark')} 
                  className={cn("p-1.5 rounded-lg transition-all flex items-center gap-2 px-3", theme === 'vs-dark' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-white")}
                  title="Dark mode"
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">Dark</span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <p className={cn("font-medium tracking-tight", theme === 'light' ? "text-zinc-600" : "text-zinc-500")}>Classroom Management</p>
              <div className={cn("h-1 w-1 rounded-full", theme === 'light' ? "bg-zinc-300" : "bg-zinc-700")} />
              <button 
                onClick={handleCopyLink}
                className={cn("text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 group", theme === 'light' ? "text-zinc-500 hover:text-zinc-950" : "text-zinc-400 hover:text-white")}
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 group-hover:scale-110 transition-transform" />}
                {copied ? 'Link Copied!' : 'Copy Join Link'}
              </button>
              <div className={cn("h-1 w-1 rounded-full", theme === 'light' ? "bg-zinc-300" : "bg-zinc-700")} />
              <button 
                onClick={() => setShowQrCode(true)}
                className={cn("text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 group", theme === 'light' ? "text-zinc-500 hover:text-zinc-950" : "text-zinc-400 hover:text-white")}
              >
                <QrCode className="w-3 h-3 group-hover:scale-110 transition-transform" />
                Show QR Protocol
              </button>
            </div>
          </motion.div>
          
          <div className={cn("flex p-1.5 rounded-2xl border transition-all self-stretch lg:self-auto", theme === 'light' ? "bg-zinc-100 border-zinc-200 shadow-sm" : "bg-zinc-900 border-zinc-800")}>
            <TabButton 
              active={activeTab === 'monitor'} 
              onClick={() => setActiveTab('monitor')}
              icon={<Monitor className="w-3.5 h-3.5" />}
              label="Student Progress"
              theme={theme}
            />
            <TabButton 
              active={activeTab === 'problems'} 
              onClick={() => setActiveTab('problems')}
              icon={<Code className="w-3.5 h-3.5" />}
              label="Curriculum"
              theme={theme}
            />
            <TabButton 
              active={activeTab === 'submissions'} 
              onClick={() => setActiveTab('submissions')}
              icon={<CheckCircle className="w-3.5 h-3.5" />}
              label="Review"
              theme={theme}
            />
            <TabButton 
              active={activeTab === 'resources'} 
              onClick={() => setActiveTab('resources')}
              icon={<FileText className="w-3.5 h-3.5" />}
              label="Materials"
              theme={theme}
            />
          </div>
        </div>

        {/* Dynamic Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'monitor' && (
            <motion.div 
              key="monitor"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
            >
              {liveCodes.length === 0 ? (
                <div className={cn("col-span-full py-20 text-center rounded-3xl border border-dashed transition-all", theme === 'light' ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/20 border-zinc-800")}>
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner", theme === 'light' ? "bg-white text-zinc-100" : "bg-zinc-950 text-zinc-800")}>
                    <Code className="w-6 h-6" />
                  </div>
                  <h3 className={cn("font-display font-bold text-2xl tracking-tight", theme === 'light' ? "text-zinc-950" : "text-white")}>No Students Active</h3>
                  <p className={cn("mt-2 text-sm font-medium", theme === 'light' ? "text-zinc-500" : "text-zinc-400")}>When students start coding, their progress will appear here.</p>
                </div>
              ) : (
                liveCodes.map((code, idx) => (
                  <motion.div 
                    key={code.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "rounded-[2.5rem] border overflow-hidden flex flex-col h-[450px] group relative transition-all",
                      theme === 'light' ? "bg-white border-zinc-200 shadow-xl" : "bg-zinc-950 border-zinc-900 shadow-2xl"
                    )}
                  >
                    <div className={cn(
                      "p-6 border-b flex justify-between items-center backdrop-blur-3xl relative z-10",
                      theme === 'light' ? "bg-white/80 border-zinc-100" : "bg-zinc-950/50 border-zinc-900"
                    )}>
                      <div className="flex items-center gap-4">
                        <Link to={`/profile/${code.studentId}`} className="w-12 h-12 rounded-2xl overflow-hidden border border-zinc-900 shadow-xl group-hover:scale-110 transition-transform cursor-pointer">
                          <img 
                            src={code.studentPhotoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${code.id}`} 
                            alt={code.studentName} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </Link>
                        <div>
                          <Link to={`/profile/${code.studentId}`} className={cn("text-sm font-bold tracking-tight hover:text-blue-400 transition-colors cursor-pointer", theme === 'light' ? "text-zinc-950" : "text-white")}>{code.studentName}</Link>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">Working...</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-zinc-500 font-mono block uppercase tracking-widest mb-1">Last Update</span>
                        <span className={cn("text-[11px] font-mono", theme === 'light' ? "text-zinc-700" : "text-zinc-300")}>{new Date(code.lastUpdated).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden group-hover:opacity-100 opacity-80 transition-opacity">
                      <Editor 
                        height="100%"
                        theme={theme === 'light' ? 'light' : 'vs-dark'}
                        language={code.language}
                        value={code.code}
                        onMount={(editor) => {
                          editor.updateOptions({
                            fontSize: 13,
                            fontFamily: "'JetBrains Mono', monospace",
                            lineHeight: 1.5,
                            minimap: { enabled: false },
                            scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
                            readOnly: true,
                            renderLineHighlight: 'none',
                            padding: { top: 20, bottom: 20 }
                          });
                        }}
                        options={{
                          readOnly: true,
                          automaticLayout: true,
                        }}
                      />
                    </div>
                    {theme === 'vs-dark' && <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />}
                    <div className="p-6 pt-0 mt-auto relative z-10 flex justify-end">
                       <div className={cn(
                         "px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-[0.2em]",
                         theme === 'light' ? "bg-zinc-100 border-zinc-200 text-zinc-600" : "bg-white/5 border-white/5 text-zinc-500"
                       )}>
                         {code.language}
                       </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'problems' && (
            <motion.div 
              key="problems"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                  <h2 className={cn("text-2xl font-display font-bold tracking-tight", theme === 'light' ? "text-zinc-950" : "text-white")}>Active Assignments</h2>
                  <p className={cn("text-sm font-medium mt-1", theme === 'light' ? "text-zinc-800" : "text-zinc-400")}>Create and manage coding challenges for your students.</p>
                </div>
                <Button size="lg" className="h-14 px-8 rounded-2xl shadow-xl bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-5 h-5 mr-3" /> New Assignment
                </Button>
              </div>

              <div className="grid gap-6">
                {problems.map((prob, idx) => (
                  <motion.div 
                    key={prob.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "p-8 rounded-[2.5rem] border shadow-sm flex flex-col md:flex-row items-center justify-between hover:shadow-2xl transition-all group",
                      theme === 'light' ? "bg-white border-zinc-100 hover:border-zinc-200" : "bg-zinc-950 border-zinc-900 hover:border-zinc-800"
                    )}
                  >
                    <div className="flex items-center gap-8 flex-1">
                      <div className={cn(
                        "w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 shadow-2xl transition-transform p-4",
                        theme === 'light' ? "bg-white border border-zinc-100 shadow-zinc-100 group-hover:scale-110" : "bg-zinc-900 border border-zinc-800 shadow-black group-hover:scale-110"
                      )}>
                        <img 
                          src={getLanguageIcon(prob.language)} 
                          alt="" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h3 className={cn("font-display font-bold text-3xl tracking-tighter", theme === 'light' ? "text-zinc-950" : "text-white")}>{prob.title}</h3>
                          <div className={cn(
                            "text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border shadow-sm",
                            prob.type === 'assignment' ? (theme === 'light' ? "bg-red-50 text-red-600 border-red-100" : "bg-red-500/10 text-red-500 border-red-500/20") : (theme === 'light' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20")
                          )}>
                            {prob.type || 'exercise'}
                          </div>
                        </div>
                        <p className={cn("font-bold max-w-2xl leading-relaxed", theme === 'light' ? "text-zinc-950" : "text-zinc-400")}>{prob.description.substring(0, 120)}...</p>
                        <div className="flex flex-wrap gap-4 mt-6 items-center">
                          <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl border", theme === 'light' ? "bg-zinc-100 border-zinc-200" : "bg-zinc-900 border-zinc-800")}>
                             <span className={cn("text-[10px] font-black uppercase tracking-widest", theme === 'light' ? "text-zinc-500" : "text-zinc-400")}>{prob.language}</span>
                          </div>
                          <div className={cn("h-1 w-1 rounded-full", theme === 'light' ? "bg-zinc-300" : "bg-zinc-700")} />
                          <span className={cn("text-[11px] font-mono font-bold uppercase tracking-widest", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>DEPLOYED {new Date(prob.createdAt).toLocaleDateString()}</span>
                          {prob.instructionsUrl && (
                            <>
                              <div className={cn("h-1 w-1 rounded-full", theme === 'light' ? "bg-zinc-300" : "bg-zinc-700")} />
                              <a 
                                href={prob.instructionsUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all", theme === 'light' ? "text-blue-600 hover:text-blue-700" : "text-blue-400 hover:text-blue-300")}
                              >
                                <FileText className="w-3 h-3" /> Technical Brief
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-8 md:mt-0 self-end md:self-auto">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setEditingProblem(prob);
                        }}
                        className={cn("h-12 w-12 rounded-2xl", theme === 'light' ? "hover:bg-zinc-100 text-zinc-400 hover:text-zinc-950" : "hover:bg-white/5 text-zinc-500 hover:text-white")}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteProblem(prob.id)}
                        className={cn("h-12 w-12 rounded-2xl", theme === 'light' ? "hover:bg-red-50 text-red-400 hover:text-red-600" : "hover:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button className={cn("h-12 px-6 rounded-2xl font-bold text-xs transition-all", theme === 'light' ? "bg-zinc-950 text-white shadow-xl hover:bg-zinc-800" : "bg-white text-zinc-950 hover:bg-zinc-200 shadow-xl shadow-black/20")}>
                        View Results
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'resources' && (
             <motion.div 
              key="resources"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                  <h2 className={cn("text-4xl font-display font-bold tracking-tight", theme === 'light' ? "text-zinc-950" : "text-white")}>Study Materials</h2>
                  <p className={cn("font-medium mt-1", theme === 'light' ? "text-zinc-600" : "text-zinc-400")}>Share learning resources and reference materials with your class.</p>
                </div>
                <Button size="lg" className="h-16 px-10 rounded-2xl shadow-xl bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowUploadModal(true)}>
                  <Upload className="w-5 h-5 mr-3" /> Upload Material
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {resources.length === 0 ? (
                  <div className={cn("col-span-full py-40 text-center rounded-[3rem] border border-dashed shadow-sm", theme === 'light' ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/20 border-zinc-900")}>
                    <div className={cn("w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner", theme === 'light' ? "bg-white text-zinc-100" : "bg-zinc-950 text-zinc-800")}>
                      <FileText className="w-10 h-10" />
                    </div>
                    <h3 className={cn("font-display font-bold text-3xl tracking-tight", theme === 'light' ? "text-zinc-950" : "text-white")}>No materials yet</h3>
                    <p className={cn("mt-3 font-medium text-sm", theme === 'light' ? "text-zinc-500" : "text-zinc-400")}>Resources you upload will appear here for your students.</p>
                  </div>
                ) : (
                  resources.map((res, idx) => (
                    <motion.div 
                      key={res.id} 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className={cn(
                        "p-8 rounded-[2.5rem] border shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between group",
                        theme === 'light' ? "bg-white border-zinc-100 hover:border-zinc-200 shadow-zinc-100" : "bg-zinc-950 border-zinc-900 hover:border-zinc-800"
                      )}
                    >
                      <div className="flex items-start justify-between mb-8">
                        <div className={cn(
                          "w-16 h-16 rounded-3xl border flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform",
                          theme === 'light' ? "bg-zinc-950 border-zinc-900 text-white" : "bg-zinc-900 border-zinc-800 text-white"
                        )}>
                          <FileText className="w-8 h-8" />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="md" 
                          className={cn("w-10 h-10 rounded-xl transition-colors", theme === 'light' ? "text-zinc-300 hover:text-red-500 hover:bg-red-50" : "text-zinc-600 hover:text-red-500 hover:bg-red-500/10")}
                          onClick={() => handleDeleteResource(res.id)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                      <div className="overflow-hidden mb-8">
                        <h3 className={cn("font-bold text-xl tracking-tight truncate", theme === 'light' ? "text-zinc-950" : "text-white")} title={res.name}>{res.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                           <div className={cn("w-1.5 h-1.5 rounded-full", theme === 'light' ? "bg-zinc-200" : "bg-zinc-800")} />
                           <p className={cn("text-[10px] font-black uppercase tracking-widest", theme === 'light' ? "text-zinc-500" : "text-zinc-500")}>{res.type.replace('application/', '')}</p>
                        </div>
                      </div>
                      <div className={cn("pt-8 border-t flex items-center justify-between", theme === 'light' ? "border-zinc-50" : "border-zinc-900")}>
                        <span className={cn("text-[11px] font-mono font-bold uppercase tracking-widest", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>
                          {new Date(res.createdAt).toLocaleDateString()}
                        </span>
                        <a 
                          href={res.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className={cn("text-sm font-black flex items-center gap-1 group/btn", theme === 'light' ? "text-zinc-950" : "text-white hover:text-blue-400 transition-colors")}
                        >
                          ACCESS <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </a>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'submissions' && (
            <motion.div 
              key="submissions"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="mb-12">
                <h2 className={cn("text-4xl font-display font-bold tracking-tight", theme === 'light' ? "text-zinc-950" : "text-white")}>Submissions</h2>
                <p className={cn("font-bold mt-1", theme === 'light' ? "text-zinc-800" : "text-zinc-500")}>Review and grade your students' work.</p>
              </div>
              <div className="space-y-6">
                {submissions.length === 0 ? (
                  <div className={cn("py-40 text-center rounded-[3rem] border border-dashed shadow-sm", theme === 'light' ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/20 border-zinc-900")}>
                    <div className={cn("w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner", theme === 'light' ? "bg-white text-zinc-100" : "bg-zinc-950 text-zinc-800")}>
                      <CheckCircle className="w-10 h-10" />
                    </div>
                    <h3 className={cn("font-display font-bold text-3xl tracking-tight", theme === 'light' ? "text-zinc-950" : "text-white")}>All graded!</h3>
                    <p className={cn("mt-3 font-medium text-sm", theme === 'light' ? "text-zinc-500" : "text-zinc-400")}>All student submissions have been reviewed.</p>
                  </div>
                ) : (
                  submissions.map((sub, idx) => (
                    <motion.div
                      key={sub.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      {/* @ts-ignore */}
                      <SubmissionCard key={sub.id} sub={sub} classroomId={classroom.id} theme={theme} />
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {(showCreateModal || editingProblem) && (
        <ProblemModal 
          onClose={() => {
            setShowCreateModal(false);
            setEditingProblem(null);
          }} 
          classroomId={classroom.id} 
          problem={editingProblem}
          theme={theme}
        />
      )}
      {showUploadModal && (
        <UploadResourceModal 
          onClose={() => setShowUploadModal(false)}
          classroomId={classroom.id}
          theme={theme}
        />
      )}
      <AnimatePresence>
        {showQrCode && (
          <QrModal 
            onClose={() => setShowQrCode(false)} 
            joinUrl={joinUrl} 
            roomCode={classroom.roomCode}
            className={classroom.className}
            theme={theme}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

function QrModal({ onClose, joinUrl, roomCode, className, theme }: { onClose: () => void, joinUrl: string, roomCode: string, className: string, theme: 'light' | 'vs-dark' }) {
  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-2xl transition-colors", theme === 'light' ? "bg-zinc-950/20" : "bg-black/60")}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        className={cn(
          "w-full max-w-lg rounded-[3rem] p-12 shadow-[0_50px_100px_rgba(0,0,0,0.3)] relative overflow-hidden border text-center",
          theme === 'light' ? "bg-white border-zinc-100" : "bg-zinc-950 border-zinc-900"
        )}
      >
        <div className={cn("absolute top-0 left-0 w-64 h-64 rounded-full blur-[100px] -ml-32 -mt-32 opacity-30", theme === 'light' ? "bg-zinc-100" : "bg-blue-500/20")} />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6", theme === 'light' ? "bg-zinc-50 border border-zinc-100" : "bg-white/5 border border-white/10")}>
            <QrCode className={cn("w-8 h-8", theme === 'light' ? "text-zinc-950" : "text-white")} />
          </div>
          
          <h2 className={cn("text-3xl font-display font-bold tracking-tighter mb-2", theme === 'light' ? "text-zinc-950" : "text-white")}>
            Join Classroom
          </h2>
          <p className={cn("text-sm font-medium mb-12", theme === 'light' ? "text-zinc-500" : "text-zinc-400")}>
            Direct link to {className}
          </p>

          <div className={cn(
            "p-8 rounded-[2.5rem] mb-12 transition-all shadow-2xl",
            theme === 'light' ? "bg-white border-zinc-100 shadow-zinc-200/50" : "bg-white border-zinc-200 p-8"
          )}>
            <QRCodeSVG 
              value={joinUrl} 
              size={240} 
              level="H" 
              includeMargin={false}
              fgColor="#000000"
              bgColor="#ffffff"
            />
          </div>

          <div className="space-y-6 w-full">
            <div className={cn("p-6 rounded-2xl border", theme === 'light' ? "bg-zinc-50 border-zinc-100" : "bg-white/5 border-white/5")}>
              <p className={cn("text-[9px] font-black uppercase tracking-[0.2em] mb-2", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>Manual Entry Protocol</p>
              <p className={cn("text-2xl font-mono font-bold tracking-[0.3em]", theme === 'light' ? "text-zinc-950" : "text-white")}>{roomCode}</p>
            </div>

            <Button 
              onClick={onClose}
              className={cn(
                "w-full h-14 rounded-2xl font-bold tracking-tight text-base",
                theme === 'light' ? "bg-zinc-950 text-white hover:bg-zinc-900" : "bg-white text-zinc-950 hover:bg-zinc-100"
              )}
            >
              Close Connection
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, theme }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, theme: 'light' | 'vs-dark' }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl",
        active 
          ? (theme === 'light' ? "bg-zinc-950 text-white shadow-zinc-200" : "bg-white text-zinc-950 shadow-black") 
          : (theme === 'light' ? "text-zinc-500 hover:text-zinc-950 hover:bg-white" : "text-zinc-400 hover:text-white hover:bg-white/5")
      )}
    >
      <div className={cn("transition-transform duration-500", active && "scale-110")}>
        {icon}
      </div>
      <span>{label}</span>
    </button>
  );
}

interface SubmissionCardProps {
  sub: Submission;
  classroomId: string;
}

function SubmissionCard({ sub, classroomId, theme }: SubmissionCardProps & { theme: 'light' | 'vs-dark' }) {
  const [feedback, setFeedback] = useState(sub.feedback || '');
  const [updating, setUpdating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleUpdateStatus = async (status: 'correct' | 'incorrect') => {
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'classes', classroomId, 'submissions', sub.id), {
        status,
        feedback
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `classes/${classroomId}/submissions/${sub.id}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={cn(
      "rounded-[2.5rem] border overflow-hidden shadow-sm group hover:shadow-xl transition-all duration-500",
      theme === 'light' ? "bg-white border-zinc-100" : "bg-zinc-950 border-zinc-900"
    )}>
    <div className={cn("p-6 flex items-center justify-between cursor-pointer transition-colors", theme === 'light' ? "hover:bg-zinc-50/50" : "hover:bg-white/5")} 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <Link to={`/profile/${sub.studentId}`} className="w-14 h-14 rounded-2xl overflow-hidden border border-zinc-100 shadow-xl relative group-hover:scale-110 transition-transform cursor-pointer">
            <img 
              src={sub.studentPhotoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.studentId}`} 
              alt={sub.studentName} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center p-1 shadow-2xl">
              <img 
                src={getLanguageIcon(sub.language)} 
                alt="" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Link to={`/profile/${sub.studentId}`} className={cn("text-base font-bold tracking-tight hover:text-blue-600 transition-colors cursor-pointer", theme === 'light' ? "text-zinc-950" : "text-white")}>{sub.studentName}</Link>
              <div className={cn("w-1 h-1 rounded-full", theme === 'light' ? "bg-zinc-200" : "bg-zinc-800")} />
              <p className={cn("text-[10px] font-mono font-bold tracking-widest", theme === 'light' ? "text-zinc-500" : "text-zinc-400")}>{sub.problemTitle || 'Technical Task'}</p>
            </div>
            <p className={cn("text-[9px] font-black uppercase tracking-[0.2em]", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>{new Date(sub.submittedAt).toLocaleTimeString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className={cn(
             "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm",
             sub.status === 'pending' ? (theme === 'light' ? "bg-zinc-50 text-zinc-500 border-zinc-100" : "bg-zinc-900/50 text-zinc-400 border-zinc-800") :
             sub.status === 'correct' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
             "bg-red-500/10 text-red-500 border-red-500/20"
          )}>
            {sub.status}
          </div>
          <div className={cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500",
            isExpanded ? "rotate-90 bg-blue-600 text-white shadow-lg shadow-blue-500/20" : (theme === 'light' ? "bg-zinc-100 text-zinc-400 hover:text-zinc-950" : "bg-white/5 text-zinc-500 hover:text-white")
          )}>
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-10 pt-0 space-y-10">
              <div className={cn("relative rounded-[2rem] overflow-hidden border shadow-2xl bg-zinc-950", theme === 'light' ? "border-zinc-200" : "border-zinc-900")}>
                <div className={cn("h-10 px-6 flex items-center justify-between border-b", theme === 'light' ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900 border-zinc-800")}>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className={cn("text-[9px] font-black uppercase tracking-widest ml-2", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>Source Code :: READ ONLY</span>
                   </div>
                   <div className="bg-white/5 px-2 py-0.5 rounded text-[8px] font-black text-zinc-500 uppercase">UTF-8</div>
                </div>
                <div className="h-[400px]">
                  <Editor 
                    height="100%"
                    theme={theme === 'light' ? 'light' : 'vs-dark'}
                    language={sub.language}
                    value={sub.code}
                    options={{
                       fontSize: 14,
                       readOnly: true,
                       minimap: { enabled: false },
                       padding: { top: 20, bottom: 20 }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className={cn("text-[10px] font-black uppercase tracking-[0.3em] ml-1", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>Your Comments</label>
                  <textarea 
                    className={cn(
                      "w-full h-44 p-6 rounded-[2rem] border text-sm font-medium focus:ring-2 focus:outline-hidden transition-all placeholder:text-zinc-300",
                      theme === 'light' ? "bg-zinc-50 border-zinc-100 focus:bg-white focus:ring-zinc-950" : "bg-white/5 border-white/5 focus:bg-white/10 focus:ring-white/20"
                    )}
                    placeholder="Enter helpful feedback for the student..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>
                <div className="flex flex-col justify-end gap-4 pb-2">
                   <div className={cn("p-6 rounded-[2rem] border", theme === 'light' ? "bg-zinc-50 border-zinc-100" : "bg-zinc-900/50 border-zinc-800")}>
                      <p className={cn("text-[10px] font-black uppercase tracking-widest mb-4", theme === 'light' ? "text-zinc-400" : "text-zinc-600")}>Final Grade</p>
                      <div className="flex gap-3">
                        <Button 
                          variant="primary" 
                          size="lg" 
                          className="flex-1 h-14 bg-emerald-500 hover:bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/20 text-[10px] font-black uppercase tracking-widest"
                          onClick={() => handleUpdateStatus('correct')}
                          isLoading={updating}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Accept
                        </Button>
                        <Button 
                          variant="danger" 
                          size="lg" 
                          className="flex-1 h-14 bg-red-500 hover:bg-red-600 rounded-2xl shadow-lg shadow-red-500/20 text-[10px] font-black uppercase tracking-widest"
                          onClick={() => handleUpdateStatus('incorrect')}
                          isLoading={updating}
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Request Revision
                        </Button>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UploadResourceModal({ onClose, classroomId, theme }: { onClose: () => void, classroomId: string, theme: 'light' | 'vs-dark' }) {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    try {
      const storageRef = ref(storage, `classes/${classroomId}/resources/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);

      await addDoc(collection(db, 'classes', classroomId, 'resources'), {
        name: name || file.name,
        url,
        type: file.type,
        createdAt: new Date().toISOString()
      });
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `classes/${classroomId}/resources`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-2xl transition-colors", theme === 'light' ? "bg-zinc-950/20" : "bg-black/60")}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={cn(
          "w-full max-w-2xl rounded-[3rem] p-12 shadow-[0_30px_100px_rgba(0,0,0,0.1)] relative overflow-hidden border",
          theme === 'light' ? "bg-white border-zinc-100" : "bg-zinc-950 border-zinc-900"
        )}
      >
        <div className={cn("absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-32 -mt-32 opacity-50", theme === 'light' ? "bg-zinc-50" : "bg-blue-900/10")} />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className={cn("text-4xl font-display font-bold tracking-tight", theme === 'light' ? "text-zinc-950" : "text-white")}>Push Data Asset</h2>
              <p className={cn("font-medium mt-2", theme === 'light' ? "text-zinc-500" : "text-zinc-400")}>Add reference materials to the classroom vault.</p>
            </div>
            <button onClick={onClose} className={cn("p-2 rounded-full transition-colors", theme === 'light' ? "hover:bg-zinc-100" : "hover:bg-white/5")}>
              <Plus className={cn("w-6 h-6 rotate-45", theme === 'light' ? "text-zinc-400" : "text-zinc-500")} />
            </button>
          </div>

          <form onSubmit={handleUpload} className="space-y-8">
            <div className="space-y-3">
              <label className={cn("text-[10px] font-black uppercase tracking-[0.3em] ml-1", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>Asset Designation</label>
              <Input 
                placeholder="e.g. Technical Specifications v1.0"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={cn(
                  "h-16 px-6 rounded-2xl transition-all text-lg font-bold border",
                  theme === 'light' ? "border-zinc-100 bg-zinc-50/50 focus:bg-white focus:border-zinc-950" : "border-zinc-800 bg-white/5 focus:bg-white/10 focus:border-white/20 text-white"
                )}
              />
            </div>
            
            <div className="space-y-3">
              <label className={cn("text-[10px] font-black uppercase tracking-[0.3em] ml-1", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>Payload Upload</label>
              <div className={cn(
                "group relative border-2 border-dashed rounded-[2.5rem] p-12 transition-all duration-500 text-center overflow-hidden",
                theme === 'light' ? "border-zinc-100 bg-zinc-50/30 hover:border-zinc-950" : "border-zinc-800 bg-white/5 hover:border-white/20"
              )}>
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
                <div className="relative z-10">
                  <div className={cn(
                    "w-20 h-20 rounded-3xl border shadow-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500",
                    theme === 'light' ? "bg-white border-zinc-100 text-zinc-950" : "bg-zinc-900 border-zinc-800 text-white"
                  )}>
                    <Upload className="w-8 h-8" />
                  </div>
                  <h4 className={cn("text-lg font-bold mb-1", theme === 'light' ? "text-zinc-950" : "text-white")}>
                    {file ? file.name : 'Select Data Package'}
                  </h4>
                  <p className={cn("text-sm font-medium italic", theme === 'light' ? "text-zinc-500" : "text-zinc-400")}>
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Drop files here or click to browse system files'}
                  </p>
                </div>
                <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity", theme === 'light' ? "bg-zinc-950" : "bg-white")} />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="ghost" className={cn("flex-1 h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest", theme === 'light' ? "" : "text-zinc-400 hover:text-white hover:bg-white/5")} onClick={onClose}>Abort</Button>
              <Button type="submit" className={cn("flex-1 h-16 rounded-2xl shadow-2xl text-[10px] font-black uppercase tracking-widest", theme === 'light' ? "bg-zinc-950 text-white shadow-zinc-200 hover:bg-zinc-800" : "bg-white text-zinc-950 hover:bg-zinc-200")} isLoading={loading}>
                Execute Push
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function ProblemModal({ onClose, classroomId, problem, theme }: { onClose: () => void, classroomId: string, problem: Problem | null, theme: 'light' | 'vs-dark' }) {
  const [title, setTitle] = useState(problem?.title || '');
  const [desc, setDesc] = useState(problem?.description || '');
  const [lang, setLang] = useState(problem?.language || 'python');
  const [type, setType] = useState<'exercise' | 'assignment'>(problem?.type || 'exercise');
  const [starterCode, setStarterCode] = useState(problem?.starterCode || '');
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let instructionsUrl = problem?.instructionsUrl || '';
      
      if (pdfFile) {
        const storageRef = ref(storage, `classes/${classroomId}/problems/${Date.now()}_${pdfFile.name}`);
        const snapshot = await uploadBytes(storageRef, pdfFile);
        instructionsUrl = await getDownloadURL(snapshot.ref);
      }

      const data = {
        title,
        description: desc,
        language: lang,
        type,
        instructionsUrl,
        starterCode,
        createdAt: problem?.createdAt || new Date().toISOString()
      };

      if (problem) {
        await updateDoc(doc(db, 'classes', classroomId, 'problems', problem.id), data);
      } else {
        await addDoc(collection(db, 'classes', classroomId, 'problems'), data);
      }
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `classes/${classroomId}/problems`);
      alert('Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-2xl transition-colors", theme === 'light' ? "bg-zinc-950/20" : "bg-black/60")}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={cn(
          "w-full max-w-4xl rounded-[3rem] p-12 shadow-[0_30px_100px_rgba(0,0,0,0.1)] relative overflow-hidden border",
          theme === 'light' ? "bg-white border-zinc-100" : "bg-zinc-950 border-zinc-900"
        )}
      >
        <div className={cn("absolute top-0 left-0 w-96 h-96 rounded-full blur-[120px] -ml-48 -mt-48 opacity-50", theme === 'light' ? "bg-zinc-50" : "bg-blue-900/10")} />
        
        <div className="relative z-10 flex flex-col max-h-[90vh]">
          <div className="flex justify-between items-start mb-8 shrink-0">
            <div>
              <h2 className={cn("text-3xl lg:text-4xl font-display font-bold tracking-tighter leading-none mb-3", theme === 'light' ? "text-zinc-950" : "text-white")}>
                {problem ? 'Configure Task' : 'Deploy New Task'}
              </h2>
              <p className={cn("text-sm lg:text-base font-medium", theme === 'light' ? "text-zinc-900" : "text-zinc-400")}>Define coding parameters and technical requirements.</p>
            </div>
            <button onClick={onClose} className={cn("p-2 rounded-full transition-colors", theme === 'light' ? "hover:bg-zinc-100" : "hover:bg-white/5")}>
              <Plus className={cn("w-8 h-8 rotate-45", theme === 'light' ? "text-zinc-400" : "text-zinc-500")} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-6 -mr-6 scrollbar-hide space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className={cn("text-[11px] font-black uppercase tracking-[0.3em] ml-1", theme === 'light' ? "text-zinc-600" : "text-zinc-500")}>Protocol Handle</label>
                  <Input 
                    placeholder="e.g. Algorithmic Prime Detection"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className={cn(
                      "h-14 px-6 rounded-2xl border transition-all text-base font-bold",
                      theme === 'light' ? "border-zinc-200 bg-zinc-50/20 focus:bg-white focus:border-zinc-950 text-zinc-950" : "border-zinc-800 bg-white/5 focus:bg-white/10 focus:border-white/20 text-white"
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className={cn("text-[11px] font-black uppercase tracking-[0.3em] ml-1", theme === 'light' ? "text-zinc-600" : "text-zinc-500")}>Priority Tier</label>
                    <select 
                      className={cn(
                        "w-full h-14 rounded-2xl border px-6 text-sm font-bold focus:ring-2 focus:outline-hidden appearance-none cursor-pointer transition-all",
                        theme === 'light' ? "border-zinc-200 bg-zinc-50/20 focus:bg-white focus:ring-zinc-950 text-zinc-950" : "border-zinc-800 bg-white/5 focus:bg-white/10 focus:ring-white/20 text-white"
                      )}
                      value={type}
                      onChange={(e) => setType(e.target.value as 'exercise' | 'assignment')}
                    >
                      <option value="exercise">Standard Exercise</option>
                      <option value="assignment">Critical Assignment</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className={cn("text-[11px] font-black uppercase tracking-[0.3em] ml-1", theme === 'light' ? "text-zinc-600" : "text-zinc-500")}>Execution Env</label>
                    <select 
                      className={cn(
                        "w-full h-14 rounded-2xl border px-6 text-sm font-bold focus:ring-2 focus:outline-hidden appearance-none cursor-pointer transition-all",
                        theme === 'light' ? "border-zinc-200 bg-zinc-50/20 focus:bg-white focus:ring-zinc-950 text-zinc-950" : "border-zinc-800 bg-white/5 focus:bg-white/10 focus:ring-white/20 text-white"
                      )}
                      value={lang}
                      onChange={(e) => setLang(e.target.value)}
                    >
                      <optgroup label="Core Languages">
                        <option value="python">Python 3.x</option>
                        <option value="javascript">JavaScript / Node.js</option>
                        <option value="typescript">TypeScript</option>
                        <option value="cpp">C++ 20</option>
                        <option value="java">Java 17</option>
                        <option value="csharp">C# (.NET)</option>
                        <option value="go">Go (Golang)</option>
                        <option value="rust">Rust</option>
                        <option value="ruby">Ruby</option>
                        <option value="php">PHP 8.x</option>
                        <option value="swift">Swift</option>
                        <option value="kotlin">Kotlin</option>
                        <option value="dart">Dart</option>
                      </optgroup>
                      <optgroup label="Frameworks & Web">
                        <option value="react">React</option>
                        <option value="vue">Vue.js</option>
                        <option value="angular">Angular</option>
                        <option value="nextjs">Next.js</option>
                        <option value="express">Express</option>
                        <option value="django">Django</option>
                        <option value="flask">Flask</option>
                        <option value="html">HTML5</option>
                        <option value="css">CSS3</option>
                      </optgroup>
                      <optgroup label="Systems & Tools">
                        <option value="bash">Bash / Shell</option>
                        <option value="sql">SQL / Postgres</option>
                        <option value="lua">Lua</option>
                        <option value="r">R Language</option>
                        <option value="perl">Perl</option>
                      </optgroup>
                      <optgroup label="Frameworks & Runtimes">
                        <option value="react">React (Frontend)</option>
                        <option value="vue">Vue.js</option>
                        <option value="angular">Angular</option>
                        <option value="nextjs">Next.js</option>
                        <option value="express">Express.js</option>
                        <option value="django">Django (Python)</option>
                        <option value="flask">Flask (Python)</option>
                        <option value="laravel">Laravel (PHP)</option>
                        <option value="spring">Spring Boot (Java)</option>
                        <option value="flutter">Flutter</option>
                        <option value="react-native">React Native</option>
                      </optgroup>
                      <optgroup label="Web & Database">
                        <option value="sql">SQL / Database</option>
                        <option value="html">HTML / CSS</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className={cn("text-[10px] font-black uppercase tracking-[0.3em] ml-1", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>Technical Brief (PDF)</label>
                  <div className={cn(
                    "group relative border-2 border-dashed rounded-[2.5rem] p-6 transition-all duration-500 text-center",
                    theme === 'light' ? "border-zinc-50 bg-zinc-50/30 hover:border-zinc-950" : "border-zinc-800 bg-white/5 hover:border-white/20"
                  )}>
                    <input 
                      type="file" 
                      accept="application/pdf"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    />
                    <div className="flex items-center justify-center gap-4">
                       <div className={cn(
                         "w-10 h-10 rounded-2xl border shadow-lg flex items-center justify-center group-hover:rotate-6 transition-transform",
                         theme === 'light' ? "bg-white border-zinc-100 text-zinc-950" : "bg-zinc-900 border-zinc-800 text-white"
                       )}>
                          <FileText className="w-5 h-5" />
                       </div>
                       <div className="text-left">
                          <p className={cn("text-xs font-bold", theme === 'light' ? "text-zinc-950" : "text-white")}>
                            {pdfFile ? pdfFile.name : problem?.instructionsUrl ? 'Current Brief Active' : 'Upload Briefing PDF'}
                          </p>
                          <p className={cn("text-[10px] font-medium", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>Max Payload: 10MB</p>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between ml-1">
                    <label className={cn("text-[10px] font-black uppercase tracking-[0.3em]", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>Seed Code Protocol</label>
                    <Badge variant="outline" className={cn("text-[8px] font-black tracking-widest", theme === 'light' ? "border-zinc-200 text-zinc-600" : "border-zinc-800 text-zinc-400")}>{lang.toUpperCase()}</Badge>
                  </div>
                  <div className={cn(
                    "rounded-[2rem] overflow-hidden border flex-1",
                    theme === 'light' ? "border-zinc-100 bg-white shadow-inner" : "border-zinc-900 bg-zinc-950 shadow-2xl"
                  )}>
                    <Editor
                      height="100%"
                      defaultLanguage={lang}
                      language={lang}
                      theme={theme === 'light' ? 'light' : 'vs-dark'}
                      value={starterCode}
                      onChange={(val) => setStarterCode(val || '')}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 12,
                        padding: { top: 20 },
                        fontFamily: 'JetBrains Mono',
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  </div>
                  <p className={cn("text-[9px] font-medium italic leading-relaxed px-1", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>This logic will be broadcasted to all terminal nodes as the mission starting point.</p>
                </div>
              </div>

              <div className="space-y-6 flex flex-col h-full">
                <label className={cn("text-[11px] font-black uppercase tracking-[0.3em] ml-1", theme === 'light' ? "text-zinc-600" : "text-zinc-400")}>Requirement Matrix</label>
                <textarea 
                  className={cn(
                    "flex-1 w-full min-h-[250px] p-8 rounded-[2.5rem] border text-base font-medium focus:ring-2 transition-all placeholder:text-zinc-300 resize-none",
                    theme === 'light' ? "bg-zinc-50/50 border-zinc-200 text-zinc-950 focus:bg-white focus:ring-zinc-950" : "bg-zinc-900 border-zinc-800 text-white focus:ring-white/20"
                  )}
                  placeholder="Draft system requirements, constraints, and objective logic..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex gap-6 shrink-0 pt-2">
              <Button type="button" variant="ghost" className="h-16 flex-1 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 hover:text-zinc-950" onClick={onClose}>Abort Protocol</Button>
              <Button type="submit" className="h-16 flex-1 rounded-3xl bg-zinc-950 text-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] text-[10px] font-black uppercase tracking-[0.3em]" isLoading={loading}>
                {problem ? 'Update Deployment' : 'Deploy To Production'}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
