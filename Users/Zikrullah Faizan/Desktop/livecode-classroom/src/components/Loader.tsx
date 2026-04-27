import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface LoaderProps {
  fullScreen?: boolean;
  className?: string;
}

export default function Loader({ fullScreen, className }: LoaderProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <Loader2 className="w-10 h-10 animate-spin text-zinc-900" />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-center p-4', className)}>
      <Loader2 className="w-6 h-6 animate-spin text-zinc-900" />
    </div>
  );
}
