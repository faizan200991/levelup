import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn, formatTimeRemaining, getDueUrgency } from '../lib/utils';

interface CountdownBadgeProps {
  dueDate?: string | null;
  theme?: 'light' | 'vs-dark';
  className?: string;
}

/**
 * Self-updating "due in Xh / Xd" badge. Ticks every 60s — a due-date
 * countdown never needs per-second precision, so this avoids re-rendering
 * every problem card on every tick across a long assignment list.
 */
export default function CountdownBadge({ dueDate, theme = 'light', className }: CountdownBadgeProps) {
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!dueDate) return;
    const id = setInterval(() => forceTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, [dueDate]);

  if (!dueDate) return null;

  const urgency = getDueUrgency(dueDate);
  const label = formatTimeRemaining(dueDate);

  const styles: Record<string, string> = {
    overdue: theme === 'light' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-red-500/10 text-red-500 border-red-500/20',
    urgent: theme === 'light' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-red-500/10 text-red-500 border-red-500/20',
    soon: theme === 'light' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    normal: theme === 'light' ? 'bg-zinc-100 text-zinc-500 border-zinc-200' : 'bg-zinc-900 text-zinc-400 border-zinc-800',
    none: '',
  };

  return (
    <div className={cn(
      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest shrink-0',
      styles[urgency],
      className
    )}>
      <Clock className="w-3 h-3" />
      {label}
    </div>
  );
}
