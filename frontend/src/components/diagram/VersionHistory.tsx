import { AnimatePresence, motion } from 'framer-motion';
import { History, RotateCcw, X } from 'lucide-react';
import type { VersionEntry } from '@/types';
import { DiagramPreview } from '@/components/diagram/DiagramPreview';
import { useToast } from '@/components/ui/Toast';

export function VersionHistory({
  open,
  onClose,
  versions,
  onRestore,
}: {
  open: boolean;
  onClose: () => void;
  versions: VersionEntry[];
  onRestore: (version: VersionEntry) => void;
}) {
  const toast = useToast();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 hidden md:block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
          <motion.div
            className="absolute inset-y-0 right-0 flex w-[360px] flex-col border-l border-slate-200 bg-white shadow-lift"
            initial={{ x: 380 }}
            animate={{ x: 0 }}
            exit={{ x: 380 }}
            transition={{ type: 'tween', duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <History className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Version History</p>
                <p className="text-[11px] text-slate-400">{versions.length} versions saved</p>
              </div>
              <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close version history">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {versions.map((v, i) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-lg border border-slate-200 bg-white p-3 shadow-soft"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                        {v.version}
                      </span>
                      <span className="text-xs font-medium text-slate-700">{v.label}</span>
                    </div>
                    {i === 0 && <span className="text-[10px] font-medium text-indigo-500">Current</span>}
                  </div>
                  <div className="mb-2 h-20 overflow-hidden rounded-md border border-slate-100 bg-slate-50">
                    <DiagramPreview diagram={v.diagram} className="!h-full !w-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">{v.timestamp}</span>
                    <button
                      onClick={() => {
                        if (i === 0) return;
                        onRestore(v);
                        toast('success', `Restored ${v.version} — ${v.label.toLowerCase()}`);
                      }}
                      disabled={i === 0}
                      className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restore
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}