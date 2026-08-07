import { Boxes } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm',
          markClassName,
        )}
      >
        <Boxes className="h-4 w-4" />
      </span>
      <span className="text-[15px] font-bold tracking-tight text-slate-900">
        UML<span className="text-indigo-500">Forge</span>
      </span>
    </span>
  );
}
