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
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Editor } from '@monaco-editor/react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { cn, getLanguageIcon } from '../lib/utils';
import { deleteDoc } from 'firebase/firestore';

import DashboardLayout from '../components/DashboardLayout';

export default function TeacherClassroom({ classroom }: { classroom: ClassRoom }) {
  const [activeTab, setActiveTab] = useState<'monitor' | 'problems' | 'submissions' | 'resources'>('monitor');
  const [problems, setProblems] = useState<Problem[]>([]);
  const [liveCodes, setLiveCodes] = useState<LiveCode[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/dashboard?join=${classroom.roomCode}`;
    navigator.clipboard.writeText(url);
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
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto pb-20">
        {/* Advanced Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-4 mb-2">
              <h1 className="font-display font-bold text-3xl text-zinc-950 tracking-tighter leading-none">{classroom.className}</h1>
              <div className="bg-zinc-100 px-3 py-1 rounded-xl border border-zinc-200">
                <span className="text-xs font-mono font-bold text-zinc-400 tracking-widest">{classroom.roomCode}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <p className="text-zinc-500 font-medium tracking-tight">Active Command Center</p>
              <div className="h-1 w-1 rounded-full bg-zinc-300" />
              <button 
                onClick={handleCopyLink}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-950 transition-all flex items-center gap-2 group"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 group-hover:scale-110 transition-transform" />}
                {copied ? 'Link Active' : 'Copy Network URL'}
              </button>
            </div>
          </motion.div>
          
          <div className="flex bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 shadow-sm self-stretch lg:self-auto">
            <TabButton 
              active={activeTab === 'monitor'} 
              onClick={() => setActiveTab('monitor')}
              icon={<Monitor className="w-3.5 h-3.5" />}
              label="Live Sync"
            />
            <TabButton 
              active={activeTab === 'problems'} 
              onClick={() => setActiveTab('problems')}
              icon={<ListTodo className="w-3.5 h-3.5" />}
              label="Mission Tasks"
            />
            <TabButton 
              active={activeTab === 'submissions'} 
              onClick={() => setActiveTab('submissions')}
              icon={<CheckCircle className="w-3.5 h-3.5" />}
              label="Review Queue"
            />
            <TabButton 
              active={activeTab === 'resources'} 
              onClick={() => setActiveTab('resources')}
              icon={<FileText className="w-3.5 h-3.5" />}
              label="Data Assets"
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
                <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-zinc-200 shadow-sm">
                  <div className="bg-zinc-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Code className="w-6 h-6 text-zinc-200" />
                  </div>
                  <h3 className="font-display font-bold text-2xl tracking-tight text-zinc-950">Awaiting Signal</h3>
                  <p className="text-zinc-500 mt-2 text-sm font-medium">Student nodes will broadcast telemetry here.</p>
                </div>
              ) : (
                liveCodes.map((code, idx) => (
                  <motion.div 
                    key={code.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-zinc-950 rounded-[2.5rem] border border-zinc-900 overflow-hidden shadow-2xl flex flex-col h-[450px] group relative"
                  >
                    <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/50 backdrop-blur-3xl relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-zinc-900 shadow-xl group-hover:scale-110 transition-transform">
                          <img 
                            src={code.studentPhotoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${code.id}`} 
                            alt={code.studentName} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white tracking-tight">{code.studentName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">Live Telemetry</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-zinc-500 font-mono block uppercase tracking-widest mb-1">Last Update</span>
                        <span className="text-[11px] text-zinc-300 font-mono">{new Date(code.lastUpdated).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden group-hover:opacity-100 opacity-80 transition-opacity">
                      <Editor 
                        height="100%"
                        theme="vs-dark"
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
                    <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
                    <div className="p-6 pt-0 mt-auto relative z-10 flex justify-end">
                       <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
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
                  <h2 className="text-2xl font-display font-bold text-zinc-950 tracking-tight">Active Tasks</h2>
                  <p className="text-zinc-500 text-sm font-medium mt-1">Initialize and manage codebase challenges.</p>
                </div>
                <Button size="lg" className="h-14 px-8 rounded-2xl shadow-xl shadow-zinc-100" onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-5 h-5 mr-3" /> New Task
                </Button>
              </div>

              <div className="grid gap-6">
                {problems.map((prob, idx) => (
                  <motion.div 
                    key={prob.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex flex-col md:flex-row items-center justify-between hover:shadow-2xl hover:border-zinc-200 transition-all group"
                  >
                    <div className="flex items-center gap-8 flex-1">
                      <div className="bg-white border border-zinc-100 w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 shadow-2xl shadow-zinc-200 group-hover:scale-110 transition-transform p-4">
                        <img 
                          src={getLanguageIcon(prob.language)} 
                          alt="" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h3 className="font-display font-bold text-3xl text-zinc-950 tracking-tighter">{prob.title}</h3>
                          <div className={cn(
                            "text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border shadow-sm",
                            prob.type === 'assignment' ? "bg-red-50 text-red-500 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                          )}>
                            {prob.type || 'exercise'}
                          </div>
                        </div>
                        <p className="text-zinc-500 font-medium max-w-2xl leading-relaxed">{prob.description.substring(0, 120)}...</p>
                        <div className="flex flex-wrap gap-4 mt-6 items-center">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 border border-zinc-200">
                             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{prob.language}</span>
                          </div>
                          <div className="h-1 w-1 rounded-full bg-zinc-300" />
                          <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest">DEPLOYED {new Date(prob.createdAt).toLocaleDateString()}</span>
                          {prob.instructionsUrl && (
                            <>
                              <div className="h-1 w-1 rounded-full bg-zinc-300" />
                              <a 
                                href={prob.instructionsUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[10px] flex items-center gap-2 text-blue-600 hover:text-blue-700 font-black uppercase tracking-widest group/link"
                              >
                                <FileText className="w-4 h-4" /> View Technical Package
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-8 md:mt-0 self-end md:self-auto">
                      <Button variant="outline" className="rounded-2xl h-14 px-8 font-bold border-zinc-200 hover:bg-zinc-50" onClick={() => setEditingProblem(prob)}>Configure</Button>
                      <Button 
                        variant="ghost" 
                        size="md" 
                        className="w-14 h-14 rounded-2xl text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteProblem(prob.id)}
                      >
                        <Trash2 className="w-5 h-5" />
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
                  <h2 className="text-4xl font-display font-bold text-zinc-950 tracking-tight">Data Assets</h2>
                  <p className="text-zinc-500 font-medium mt-1">Global repository for classroom knowledge and references.</p>
                </div>
                <Button size="lg" className="h-16 px-10 rounded-2xl shadow-xl shadow-zinc-100" onClick={() => setShowUploadModal(true)}>
                  <Upload className="w-5 h-5 mr-3" /> Push Asset
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {resources.length === 0 ? (
                  <div className="col-span-full py-40 text-center bg-white rounded-[3rem] border border-dashed border-zinc-200 shadow-sm">
                    <div className="bg-zinc-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                      <FileText className="w-10 h-10 text-zinc-200" />
                    </div>
                    <h3 className="font-display font-bold text-3xl tracking-tight text-zinc-950">Vault Empty</h3>
                    <p className="text-zinc-500 mt-3 font-medium">Resources uploaded by the teacher will appear here.</p>
                  </div>
                ) : (
                  resources.map((res, idx) => (
                    <motion.div 
                      key={res.id} 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between group"
                    >
                      <div className="flex items-start justify-between mb-8">
                        <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform text-white">
                          <FileText className="w-8 h-8" />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="md" 
                          className="w-10 h-10 rounded-xl text-zinc-300 hover:text-red-500"
                          onClick={() => handleDeleteResource(res.id)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                      <div className="overflow-hidden mb-8">
                        <h3 className="font-bold text-xl tracking-tight text-zinc-950 truncate" title={res.name}>{res.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                           <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">{res.type.replace('application/', '')}</p>
                        </div>
                      </div>
                      <div className="pt-8 border-t border-zinc-50 flex items-center justify-between">
                        <span className="text-[11px] text-zinc-400 font-mono font-bold uppercase tracking-widest">
                          {new Date(res.createdAt).toLocaleDateString()}
                        </span>
                        <a 
                          href={res.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-sm font-black text-zinc-950 flex items-center gap-1 group/btn"
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
                <h2 className="text-4xl font-display font-bold text-zinc-950 tracking-tight">Review Queue</h2>
                <p className="text-zinc-500 font-medium mt-1">Audit and validate student performance artifacts.</p>
              </div>
              <div className="space-y-6">
                {submissions.length === 0 ? (
                  <div className="py-40 text-center bg-white rounded-[3rem] border border-dashed border-zinc-200 shadow-sm">
                    <div className="bg-zinc-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                      <CheckCircle className="w-10 h-10 text-zinc-200" />
                    </div>
                    <h3 className="font-display font-bold text-3xl tracking-tight text-zinc-950">Queue Processed</h3>
                    <p className="text-zinc-500 mt-3 font-medium">All student submissions have been logged or reviewed.</p>
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
                      <SubmissionCard key={sub.id} sub={sub} classroomId={classroom.id} />
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
        />
      )}
      {showUploadModal && (
        <UploadResourceModal 
          onClose={() => setShowUploadModal(false)}
          classroomId={classroom.id}
        />
      )}
    </DashboardLayout>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
        active 
          ? "bg-white text-zinc-950 shadow-sm shadow-zinc-200" 
          : "text-zinc-400 hover:text-zinc-950 hover:bg-white/50"
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

function SubmissionCard({ sub, classroomId }: SubmissionCardProps) {
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
    <div className="bg-white rounded-[2.5rem] border border-zinc-100 overflow-hidden shadow-sm group hover:shadow-xl transition-all duration-500">
    <div className="p-6 flex items-center justify-between cursor-pointer hover:bg-zinc-50/50 transition-colors" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-zinc-100 shadow-xl relative group-hover:scale-110 transition-transform">
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
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-base font-bold text-zinc-950 tracking-tight">{sub.studentName}</p>
              <div className="w-1 h-1 rounded-full bg-zinc-200" />
              <p className="text-[10px] font-mono font-bold text-zinc-400 tracking-widest">{sub.problemTitle || 'Technical Task'}</p>
            </div>
            <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.2em]">{new Date(sub.submittedAt).toLocaleTimeString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className={cn(
             "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm",
             sub.status === 'pending' ? "bg-zinc-50 text-zinc-500 border-zinc-100" :
             sub.status === 'correct' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
             "bg-red-50 text-red-600 border-red-100"
          )}>
            {sub.status}
          </div>
          <div className={cn(
            "w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 transition-all duration-500",
            isExpanded ? "rotate-90 bg-zinc-900 text-white" : ""
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
              <div className="relative rounded-[2rem] overflow-hidden border border-zinc-900 shadow-2xl bg-zinc-950">
                <div className="h-10 bg-zinc-900 px-6 flex items-center justify-between border-b border-zinc-800">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-zinc-700" />
                      <div className="w-2 h-2 rounded-full bg-zinc-700" />
                      <div className="w-2 h-2 rounded-full bg-zinc-700" />
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-2">Source Buffer :: READ ONLY</span>
                   </div>
                   <div className="bg-white/5 px-2 py-0.5 rounded text-[8px] font-black text-zinc-500 uppercase">UTF-8</div>
                </div>
                <div className="h-[400px]">
                  <Editor 
                    height="100%"
                    theme="vs-dark"
                    value={sub.code}
                    onMount={(editor) => {
                      editor.updateOptions({
                        fontSize: 14,
                        fontFamily: "'JetBrains Mono', monospace",
                        lineHeight: 1.6,
                        minimap: { enabled: false },
                        scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
                        readOnly: true,
                        padding: { top: 20, bottom: 20 }
                      });
                    }}
                    options={{ readOnly: true, automaticLayout: true }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 ml-1">Reviewer Feedback</label>
                  <textarea 
                    className="w-full h-44 p-6 rounded-[2rem] bg-zinc-50 border border-zinc-100 text-sm font-medium focus:ring-2 focus:ring-zinc-900 focus:outline-hidden transition-all placeholder:text-zinc-300"
                    placeholder="Enter technical feedback or instructions for re-submission..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>
                <div className="flex flex-col justify-end gap-4 pb-2">
                   <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Action Authorization</p>
                      <div className="flex gap-3">
                        <Button 
                          variant="primary" 
                          size="lg" 
                          className="flex-1 h-14 bg-emerald-500 hover:bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/20 text-[10px] font-black uppercase tracking-widest"
                          onClick={() => handleUpdateStatus('correct')}
                          isLoading={updating}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Approve
                        </Button>
                        <Button 
                          variant="danger" 
                          size="lg" 
                          className="flex-1 h-14 bg-red-500 hover:bg-red-600 rounded-2xl shadow-lg shadow-red-500/20 text-[10px] font-black uppercase tracking-widest"
                          onClick={() => handleUpdateStatus('incorrect')}
                          isLoading={updating}
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Reject
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

function UploadResourceModal({ onClose, classroomId }: { onClose: () => void, classroomId: string }) {
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
    <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-3xl z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-[3rem] p-12 shadow-[0_30px_100px_rgba(0,0,0,0.1)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className="text-4xl font-display font-bold text-zinc-950 tracking-tight">Push Data Asset</h2>
              <p className="text-zinc-500 font-medium mt-2">Add reference materials to the classroom vault.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
              <Plus className="w-6 h-6 rotate-45 text-zinc-400" />
            </button>
          </div>

          <form onSubmit={handleUpload} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] ml-1">Asset Designation</label>
              <Input 
                placeholder="e.g. Technical Specifications v1.0"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-16 px-6 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white transition-all text-lg font-bold"
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] ml-1">Payload Upload</label>
              <div className="group relative border-2 border-dashed border-zinc-100 rounded-[2.5rem] p-12 hover:border-zinc-950 transition-all duration-500 bg-zinc-50/30 text-center overflow-hidden">
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-3xl bg-white border border-zinc-100 shadow-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Upload className="w-8 h-8 text-zinc-950" />
                  </div>
                  <h4 className="text-lg font-bold text-zinc-950 mb-1">
                    {file ? file.name : 'Select Data Package'}
                  </h4>
                  <p className="text-sm text-zinc-500 font-medium italic">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Drop files here or click to browse system files'}
                  </p>
                </div>
                <div className="absolute inset-0 bg-zinc-950 opacity-0 group-hover:opacity-[0.02] transition-opacity" />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="ghost" className="flex-1 h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest" onClick={onClose}>Abort</Button>
              <Button type="submit" className="flex-1 h-16 rounded-2xl bg-zinc-950 text-white shadow-2xl shadow-zinc-200 text-[10px] font-black uppercase tracking-widest" isLoading={loading}>
                Execute Push
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function ProblemModal({ onClose, classroomId, problem }: { onClose: () => void, classroomId: string, problem: Problem | null }) {
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
    <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-3xl z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-4xl bg-white rounded-[3rem] p-12 shadow-[0_30px_100px_rgba(0,0,0,0.1)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-96 h-96 bg-zinc-50 rounded-full blur-[120px] -ml-48 -mt-48 opacity-50" />
        
        <div className="relative z-10 flex flex-col max-h-[90vh]">
          <div className="flex justify-between items-start mb-8 shrink-0">
            <div>
              <h2 className="text-3xl font-display font-bold text-zinc-950 tracking-tighter leading-none mb-2">
                {problem ? 'Configure Task' : 'Deploy New Task'}
              </h2>
              <p className="text-zinc-500 text-sm font-medium">Define coding parameters and technical requirements.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
              <Plus className="w-8 h-8 rotate-45 text-zinc-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-6 -mr-6 scrollbar-hide space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] ml-1">Protocol Handle</label>
                  <Input 
                    placeholder="e.g. Algorithmic Prime Detection"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="h-14 px-6 rounded-2xl border-zinc-100 bg-zinc-50/20 text-base font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] ml-1">Priority Tier</label>
                    <select 
                      className="w-full h-14 rounded-2xl border border-zinc-100 bg-zinc-50/20 px-6 text-sm font-bold focus:ring-2 focus:ring-zinc-900 focus:outline-hidden appearance-none cursor-pointer"
                      value={type}
                      onChange={(e) => setType(e.target.value as 'exercise' | 'assignment')}
                    >
                      <option value="exercise">Standard Exercise</option>
                      <option value="assignment">Critical Assignment</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] ml-1">Execution Env</label>
                    <select 
                      className="w-full h-14 rounded-2xl border border-zinc-100 bg-zinc-50/20 px-6 text-sm font-bold focus:ring-2 focus:ring-zinc-900 focus:outline-hidden appearance-none cursor-pointer"
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
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] ml-1">Technical Brief (PDF)</label>
                  <div className="group relative border-2 border-dashed border-zinc-50 rounded-[2.5rem] p-6 hover:border-zinc-950 transition-all duration-500 bg-zinc-50/30 text-center">
                    <input 
                      type="file" 
                      accept="application/pdf"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    />
                    <div className="flex items-center justify-center gap-4">
                       <div className="w-10 h-10 rounded-2xl bg-white border border-zinc-100 shadow-lg flex items-center justify-center group-hover:rotate-6 transition-transform">
                          <FileText className="w-5 h-5 text-zinc-950" />
                       </div>
                       <div className="text-left">
                          <p className="text-xs font-bold text-zinc-950">
                            {pdfFile ? pdfFile.name : problem?.instructionsUrl ? 'Current Brief Active' : 'Upload Briefing PDF'}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-medium">Max Payload: 10MB</p>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Seed Code Protocol</label>
                    <Badge variant="outline" className="text-[8px] font-black tracking-widest">{lang.toUpperCase()}</Badge>
                  </div>
                  <div className="rounded-[2rem] overflow-hidden border border-zinc-100 flex-1 bg-zinc-950">
                    <Editor
                      height="100%"
                      defaultLanguage={lang}
                      language={lang}
                      theme="vs-dark"
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
                  <p className="text-[9px] text-zinc-400 font-medium italic leading-relaxed px-1">This logic will be broadcasted to all terminal nodes as the mission starting point.</p>
                </div>
              </div>

              <div className="space-y-3 flex flex-col h-full">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] ml-1">Requirement Matrix</label>
                <textarea 
                  className="flex-1 w-full min-h-[250px] p-6 rounded-[2.5rem] bg-zinc-50/50 border border-zinc-100 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-zinc-950 transition-all placeholder:text-zinc-300 resize-none"
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
