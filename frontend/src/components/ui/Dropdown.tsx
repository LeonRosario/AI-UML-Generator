import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type DropdownProps = {
  trigger: (open: boolean) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'left' | 'right';
  className?: string;
};

export function Dropdown({ trigger, children, align = 'left', className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger(open)}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            className={cn(
              'absolute z-40 mt-1.5 min-w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lift',
              align === 'right' ? 'right-0' : 'left-0',
              className,
            )}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MenuItem({
  icon,
  label,
  onClick,
  danger,
  hint,
}: {
  icon?: ReactNode;
  label: string;
  onClick?: () => void;
  danger?: boolean;
  hint?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors',
        danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50',
      )}
    >
      {icon && <span className="text-slate-400">{icon}</span>}
      <span className="flex-1">{label}</span>
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </button>
  );
}

export function MenuDivider() {
  return <div className="my-1 border-t border-slate-100" />;
}
