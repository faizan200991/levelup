import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Search, Calendar as CalendarIcon, List, ChevronLeft, ChevronRight,
  FileText, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Problem } from '../types';
import { Input } from '../components/Input';
import Loader from '../components/Loader';
import CountdownBadge from '../components/CountdownBadge';
import DashboardLayout from '../components/DashboardLayout';
import { cn, getLanguageIcon, getDueUrgency } from '../lib/utils';

type ProblemWithClass = Problem & {
  classroomId: string;
  className: string;
  /** Student view: has the current user submitted this? */
  submitted?: boolean;
  /** Teacher view: X of Y enrolled students have submitted. */
  completion?: { submitted: number; total: number };
};

export default function Assignments() {
  const { user, profile } = useAuth();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [problems, setProblems] = useState<ProblemWithClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'exercise' | 'assignment'>('all');
  const [langFilter, setLangFilter] = useState<string>('all');
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  React.useEffect(() => {
    if (!user || !profile) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        // One query, not one-per-classroom: get the classroom ids this
        // user cares about first (owned if teacher, enrolled if student),
        // then pull every problem in those classrooms in a single call.
        let classroomIds: string[] = [];

        if (profile.role === 'teacher') {
          const { data } = await supabase.from('classrooms').select('id').eq('teacher_id', user.id);
          classroomIds = (data || []).map((c: { id: string }) => c.id);
        } else {
          const { data } = await supabase.from('enrollments').select('classroom_id').eq('student_id', user.id);
          classroomIds = (data || []).map((e: { classroom_id: string }) => e.classroom_id);
        }

        if (classroomIds.length === 0) {
          if (!cancelled) { setProblems([]); setLoading(false); }
          return;
        }

        const { data, error } = await supabase
          .from('problems')
          .select('*, classrooms(class_name)')
          .in('classroom_id', classroomIds)
          .order('due_date', { ascending: true, nullsFirst: false });

        if (error) throw error;

        type RawProblemRow = {
          id: string; title: string; description: string; type: 'exercise' | 'assignment';
          language: string; instructions_url?: string; starter_code?: string;
          sample_input?: string; expected_output?: string; due_date?: string | null;
          created_at: string; classroom_id: string; classrooms?: { class_name: string } | null;
        };
        const mapped: ProblemWithClass[] = ((data || []) as RawProblemRow[]).map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description,
          type: row.type,
          language: row.language,
          instructionsUrl: row.instructions_url,
          starterCode: row.starter_code,
          sampleInput: row.sample_input,
          expectedOutput: row.expected_output,
          dueDate: row.due_date,
          createdAt: row.created_at,
          classroomId: row.classroom_id,
          className: row.classrooms?.class_name || 'Unknown Class',
        }));

        const problemIds = mapped.map((p) => p.id);

        // Layer in submission status: students see "did I submit this?",
        // teachers see "X of Y students have submitted" per assignment —
        // both drive the calendar dot color and list badges below.
        if (problemIds.length > 0) {
          if (profile.role === 'teacher') {
            const [{ data: subs }, { data: enrolls }] = await Promise.all([
              supabase.from('submissions').select('problem_id, student_id').in('problem_id', problemIds),
              supabase.from('enrollments').select('classroom_id').in('classroom_id', classroomIds),
            ]);

            const totalByClassroom = new Map<string, number>();
            for (const e of (enrolls || []) as { classroom_id: string }[]) {
              totalByClassroom.set(e.classroom_id, (totalByClassroom.get(e.classroom_id) || 0) + 1);
            }
            const submittersByProblem = new Map<string, Set<string>>();
            for (const s of (subs || []) as { problem_id: string; student_id: string }[]) {
              if (!submittersByProblem.has(s.problem_id)) submittersByProblem.set(s.problem_id, new Set());
              submittersByProblem.get(s.problem_id)!.add(s.student_id);
            }
            for (const p of mapped) {
              p.completion = {
                submitted: submittersByProblem.get(p.id)?.size || 0,
                total: totalByClassroom.get(p.classroomId) || 0,
              };
            }
          } else {
            const { data: subs } = await supabase
              .from('submissions')
              .select('problem_id')
              .eq('student_id', user.id)
              .in('problem_id', problemIds);
            const submittedSet = new Set((subs || []).map((s: { problem_id: string }) => s.problem_id));
            for (const p of mapped) p.submitted = submittedSet.has(p.id);
          }
        }

        if (!cancelled) setProblems(mapped);
      } catch (err) {
        console.error('Error fetching assignments:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, profile]);

  const languages = useMemo(
    () => Array.from(new Set(problems.map((p) => p.language))).sort(),
    [problems]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return problems.filter((p) => {
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      if (langFilter !== 'all' && p.language !== langFilter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.className.toLowerCase().includes(q) ||
        p.language.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    });
  }, [problems, search, typeFilter, langFilter]);

  // Group by local calendar day (YYYY-MM-DD) for the month grid.
  const byDay = useMemo(() => {
    const map = new Map<string, ProblemWithClass[]>();
    for (const p of problems) {
      if (!p.dueDate) continue;
      const d = new Date(p.dueDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [problems]);

  const monthLabel = monthCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const calendarCells = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: { key: string | null; day: number | null }[] = [];
    for (let i = 0; i < startOffset; i++) cells.push({ key: null, day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ key, day: d });
    }
    return cells;
  }, [monthCursor]);

  const todayKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const selectedDayProblems = selectedDay ? (byDay.get(selectedDay) || []) : [];

  if (loading) return <Loader fullScreen />;

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
      >
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-black tracking-tighter leading-none">
            All <span className="text-blue-600 uppercase">Assignments.</span>
          </h1>
          <p className="text-zinc-600 mt-2 text-sm font-medium tracking-tight">
            Every exercise and assignment across all your classrooms, in one place.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-2xl">
          <button
            onClick={() => setView('list')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              view === 'list' ? "bg-white text-zinc-950 shadow-md" : "text-zinc-500 hover:text-zinc-800"
            )}
          >
            <List className="w-4 h-4" /> List
          </button>
          <button
            onClick={() => setView('calendar')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              view === 'calendar' ? "bg-white text-zinc-950 shadow-md" : "text-zinc-500 hover:text-zinc-800"
            )}
          >
            <CalendarIcon className="w-4 h-4" /> Calendar
          </button>
        </div>
      </motion.div>

      {view === 'list' ? (
        <>
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <Input
              placeholder="Search by title, classroom, or language..."
              icon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 rounded-2xl"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | 'exercise' | 'assignment')}
              className="h-12 px-5 rounded-2xl border border-zinc-200 bg-white text-sm font-bold text-zinc-700 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/5"
            >
              <option value="all">All Types</option>
              <option value="exercise">Exercises</option>
              <option value="assignment">Assignments</option>
            </select>
            <select
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
              className="h-12 px-5 rounded-2xl border border-zinc-200 bg-white text-sm font-bold text-zinc-700 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/5"
            >
              <option value="all">All Languages</option>
              {languages.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-zinc-400 font-bold">No assignments match your search.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filtered.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                >
                  <Link
                    to={`/classroom/${p.classroomId}`}
                    className="flex items-center gap-6 p-6 rounded-[2rem] border border-zinc-100 bg-white hover:border-zinc-200 hover:shadow-xl transition-all group"
                  >
                    <div className="w-14 h-14 rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-center shrink-0 p-3 group-hover:scale-105 transition-transform">
                      <img src={getLanguageIcon(p.language)} alt={p.language} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-zinc-950 truncate">{p.title}</h3>
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0",
                          p.type === 'assignment' ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                        )}>
                          {p.type || 'exercise'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-zinc-400 truncate">{p.className} • {p.language}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {profile?.role === 'teacher' && p.completion && (
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border whitespace-nowrap",
                          p.completion.total > 0 && p.completion.submitted >= p.completion.total
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-zinc-100 text-zinc-500 border-zinc-200"
                        )}>
                          {p.completion.submitted}/{p.completion.total}
                        </span>
                      )}
                      {profile?.role !== 'teacher' && p.submitted && (
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border bg-emerald-50 text-emerald-600 border-emerald-100 whitespace-nowrap">
                          Submitted
                        </span>
                      )}
                      <CountdownBadge dueDate={p.dueDate} theme="light" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-zinc-950 tracking-tight">{monthLabel}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                  className="w-9 h-9 rounded-xl border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                  className="w-9 h-9 rounded-xl border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 py-2">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarCells.map((cell, i) => {
                if (!cell.key) return <div key={`empty-${i}`} />;
                const dayProblems = byDay.get(cell.key) || [];
                const isToday = cell.key === todayKey;
                const isSelected = cell.key === selectedDay;
                const hasOverdue = dayProblems.some((p) => getDueUrgency(p.dueDate) === 'overdue');
                const hasUrgent = dayProblems.some((p) => getDueUrgency(p.dueDate) === 'urgent' || getDueUrgency(p.dueDate) === 'soon');
                // Student: green once everything that day is submitted. Teacher: green once
                // every assignment that day has 100% completion. Otherwise fall back to urgency.
                const allDone = dayProblems.length > 0 && dayProblems.every((p) =>
                  profile?.role === 'teacher' ? (p.completion && p.completion.total > 0 && p.completion.submitted >= p.completion.total) : p.submitted
                );

                return (
                  <button
                    key={cell.key}
                    onClick={() => setSelectedDay(dayProblems.length > 0 ? cell.key : null)}
                    className={cn(
                      "aspect-square rounded-2xl border p-2 flex flex-col items-start justify-between transition-all text-left",
                      isSelected ? "border-zinc-950 bg-zinc-950" : isToday ? "border-blue-200 bg-blue-50" : "border-zinc-100 hover:border-zinc-300",
                      dayProblems.length === 0 && "cursor-default"
                    )}
                  >
                    <span className={cn(
                      "text-xs font-bold",
                      isSelected ? "text-white" : isToday ? "text-blue-600" : "text-zinc-700"
                    )}>{cell.day}</span>
                    {dayProblems.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          allDone ? "bg-emerald-500" : (hasOverdue || hasUrgent) ? "bg-red-500" : "bg-blue-500"
                        )} />
                        {dayProblems.length > 1 && (
                          <span className={cn("text-[9px] font-black", isSelected ? "text-zinc-400" : "text-zinc-400")}>{dayProblems.length}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm">
            {selectedDay ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-lg font-bold text-zinc-950 tracking-tight">
                    {new Date(selectedDay + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                  </h3>
                  <button onClick={() => setSelectedDay(null)} className="text-zinc-400 hover:text-zinc-900">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {selectedDayProblems.map((p) => (
                    <Link
                      key={p.id}
                      to={`/classroom/${p.classroomId}`}
                      className="block p-4 rounded-2xl border border-zinc-100 hover:border-zinc-300 hover:shadow-md transition-all"
                    >
                      <p className="font-bold text-sm text-zinc-950 mb-1">{p.title}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">{p.className}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <CountdownBadge dueDate={p.dueDate} theme="light" />
                        {profile?.role === 'teacher' && p.completion && (
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border",
                            p.completion.total > 0 && p.completion.submitted >= p.completion.total
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : "bg-zinc-100 text-zinc-500 border-zinc-200"
                          )}>
                            {p.completion.submitted}/{p.completion.total} submitted
                          </span>
                        )}
                        {profile?.role !== 'teacher' && p.submitted && (
                          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border bg-emerald-50 text-emerald-600 border-emerald-100">
                            Submitted
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <FileText className="w-8 h-8 text-zinc-200 mb-4" />
                <p className="text-sm font-bold text-zinc-400">Click a highlighted date<br />to see what's due.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
