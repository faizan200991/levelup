import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ClassRoom, Problem } from '../types';
import { cn, getLanguageIcon } from '../lib/utils';
import { Sparkles, Users, Clock3, MessageCircleQuestion } from 'lucide-react';
import Loader from './Loader';

interface AssignmentAnalyticsProps {
  classroom: ClassRoom;
  problems: Problem[];
  theme: 'light' | 'vs-dark';
}

interface ProblemStats {
  problemId: string;
  notStarted: number;
  inProgress: number;
  submitted: number;
  avgTimeToSubmitMs: number | null;
  hintCount: number;
}

function formatDuration(ms: number): string {
  const hours = ms / 3600000;
  if (hours < 1) return `${Math.round(ms / 60000)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

export default function AssignmentAnalytics({ classroom, problems, theme }: AssignmentAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [statsByProblem, setStatsByProblem] = useState<Map<string, ProblemStats>>(new Map());

  useEffect(() => {
    let cancelled = false;
    const problemIds = problems.map((p) => p.id);

    (async () => {
      setLoading(true);
      try {
        const [{ count: enrollCount }, subsRes, sessionsRes, hintsRes] = await Promise.all([
          supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('classroom_id', classroom.id),
          problemIds.length
            ? supabase.from('submissions').select('problem_id, student_id, submitted_at').in('problem_id', problemIds)
            : Promise.resolve({ data: [] as { problem_id: string; student_id: string; submitted_at: string }[] }),
          problemIds.length
            ? supabase.from('live_sessions').select('problem_id, student_id').eq('classroom_id', classroom.id).not('problem_id', 'is', null)
            : Promise.resolve({ data: [] as { problem_id: string; student_id: string }[] }),
          problemIds.length
            ? supabase.from('hint_requests').select('problem_id').eq('classroom_id', classroom.id)
            : Promise.resolve({ data: [] as { problem_id: string }[] }),
        ]);

        const total = enrollCount || 0;

        type SubRow = { problem_id: string; student_id: string; submitted_at: string };
        type SessionRow = { problem_id: string; student_id: string };
        type HintRow = { problem_id: string };

        const submittersByProblem = new Map<string, Set<string>>();
        const submitTimesByProblem = new Map<string, number[]>();
        for (const s of (subsRes.data || []) as SubRow[]) {
          if (!submittersByProblem.has(s.problem_id)) submittersByProblem.set(s.problem_id, new Set());
          submittersByProblem.get(s.problem_id)!.add(s.student_id);

          const problem = problems.find((p) => p.id === s.problem_id);
          if (problem?.createdAt) {
            const delta = new Date(s.submitted_at).getTime() - new Date(problem.createdAt).getTime();
            if (delta >= 0) {
              if (!submitTimesByProblem.has(s.problem_id)) submitTimesByProblem.set(s.problem_id, []);
              submitTimesByProblem.get(s.problem_id)!.push(delta);
            }
          }
        }

        const startedByProblem = new Map<string, Set<string>>();
        for (const s of (sessionsRes.data || []) as SessionRow[]) {
          if (!startedByProblem.has(s.problem_id)) startedByProblem.set(s.problem_id, new Set());
          startedByProblem.get(s.problem_id)!.add(s.student_id);
        }

        const hintCountByProblem = new Map<string, number>();
        for (const h of (hintsRes.data || []) as HintRow[]) {
          hintCountByProblem.set(h.problem_id, (hintCountByProblem.get(h.problem_id) || 0) + 1);
        }

        const stats = new Map<string, ProblemStats>();
        for (const p of problems) {
          const submittedSet = submittersByProblem.get(p.id) || new Set();
          const startedSet = startedByProblem.get(p.id) || new Set();
          // "In progress" = has a live session but hasn't submitted yet
          const inProgress = [...startedSet].filter((id) => !submittedSet.has(id)).length;
          const submitted = submittedSet.size;
          const notStarted = Math.max(0, total - submitted - inProgress);

          const times = submitTimesByProblem.get(p.id) || [];
          const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : null;

          stats.set(p.id, {
            problemId: p.id,
            notStarted,
            inProgress,
            submitted,
            avgTimeToSubmitMs: avg,
            hintCount: hintCountByProblem.get(p.id) || 0,
          });
        }

        if (!cancelled) {
          setTotalStudents(total);
          setStatsByProblem(stats);
        }
      } catch (err) {
        console.error('Failed to load assignment analytics:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [classroom.id, problems]);

  const mostHintedProblem = useMemo(() => {
    let best: { title: string; count: number } | null = null;
    for (const p of problems) {
      const c = statsByProblem.get(p.id)?.hintCount || 0;
      if (c > 0 && (!best || c > best.count)) best = { title: p.title, count: c };
    }
    return best;
  }, [problems, statsByProblem]);

  if (loading) return <div className="py-20"><Loader /></div>;

  if (problems.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-zinc-400 font-bold">No assignments yet — analytics will populate once you create one.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {mostHintedProblem && (
        <div className={cn(
          "flex items-center gap-4 p-6 rounded-[2rem] border",
          theme === 'light' ? "bg-violet-50/50 border-violet-100" : "bg-violet-500/5 border-violet-500/20"
        )}>
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center shrink-0">
            <MessageCircleQuestion className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", theme === 'light' ? "text-violet-600" : "text-violet-400")}>Most Requested Hint</p>
            <p className={cn("font-bold", theme === 'light' ? "text-zinc-950" : "text-white")}>
              "{mostHintedProblem.title}" — {mostHintedProblem.count} hint request{mostHintedProblem.count !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {problems.map((p) => {
          const s = statsByProblem.get(p.id);
          if (!s) return null;
          const total = totalStudents || 1;
          const pctSubmitted = (s.submitted / total) * 100;
          const pctInProgress = (s.inProgress / total) * 100;
          const pctNotStarted = (s.notStarted / total) * 100;

          return (
            <div
              key={p.id}
              className={cn(
                "p-6 rounded-[2rem] border",
                theme === 'light' ? "bg-white border-zinc-100 shadow-sm" : "bg-white/5 border-zinc-800"
              )}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl border border-zinc-100 shadow-sm flex items-center justify-center shrink-0 p-2 bg-white">
                  <img src={getLanguageIcon(p.language)} alt={p.language} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("font-bold truncate", theme === 'light' ? "text-zinc-950" : "text-white")}>{p.title}</p>
                  <p className={cn("text-[10px] font-black uppercase tracking-widest", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>{p.type || 'exercise'} • {p.language}</p>
                </div>
              </div>

              {/* Progress bar: not started / in progress / submitted */}
              <div className="w-full h-2.5 rounded-full bg-zinc-100 overflow-hidden flex mb-3">
                {pctSubmitted > 0 && <div className="h-full bg-emerald-500" style={{ width: `${pctSubmitted}%` }} />}
                {pctInProgress > 0 && <div className="h-full bg-amber-400" style={{ width: `${pctInProgress}%` }} />}
                {pctNotStarted > 0 && <div className="h-full bg-zinc-200" style={{ width: `${pctNotStarted}%` }} />}
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {s.submitted} submitted</span>
                <span className="flex items-center gap-1.5 text-amber-600"><span className="w-2 h-2 rounded-full bg-amber-400" /> {s.inProgress} in progress</span>
                <span className={cn("flex items-center gap-1.5", theme === 'light' ? "text-zinc-500" : "text-zinc-400")}><span className="w-2 h-2 rounded-full bg-zinc-300" /> {s.notStarted} not started</span>

                {s.avgTimeToSubmitMs !== null && (
                  <span className={cn("flex items-center gap-1.5 ml-auto", theme === 'light' ? "text-zinc-500" : "text-zinc-400")}>
                    <Clock3 className="w-3.5 h-3.5" /> avg {formatDuration(s.avgTimeToSubmitMs)} to submit
                  </span>
                )}
                {s.hintCount > 0 && (
                  <span className={cn("flex items-center gap-1.5", theme === 'light' ? "text-zinc-500" : "text-zinc-400")}>
                    <Sparkles className="w-3.5 h-3.5" /> {s.hintCount} hint{s.hintCount !== 1 ? 's' : ''} requested
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalStudents === 0 && (
        <div className={cn("flex items-center gap-2 text-xs font-bold px-4", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>
          <Users className="w-4 h-4" /> No students enrolled yet — percentages will populate once students join.
        </div>
      )}
    </div>
  );
}
