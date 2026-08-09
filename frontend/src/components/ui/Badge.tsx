import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Badge({ className, variant = 'default', ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'outline' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        variant === 'default' && 'border-slate-200 bg-white text-slate-600',
        variant === 'outline' && 'border-slate-300 text-slate-500',
        className,
      )}
      {...props}
    />
  );
}

export function BadgeDot({ className }: { className?: string }) {
  return <span className={cn('inline-block h-1.5 w-1.5 rounded-full bg-current', className)} />;
}
