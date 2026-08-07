import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Select, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { DIAGRAM_TYPE_LABELS } from '@/data/diagrams';
import { generateDiagram, GENERATION_STAGES, type GenerationStage } from '@/services/ai';
import type { Diagram, DiagramType } from '@/types';

export function GenerateModal({
  open,
  onClose,
  onGenerated,
}: {
  open: boolean;
  onClose: () => void;
  onGenerated: (diagram: Diagram) => void;
}) {
  const [type, setType] = useState<DiagramType>('use-case');
  const [requirements, setRequirements] = useState('');
  const [stage, setStage] = useState<GenerationStage | null>(null);

  useEffect(() => {
    if (open) {
      setRequirements('');
      setStage(null);
    }
  }, [open]);

  const run = async () => {
    setStage(GENERATION_STAGES[0]);
    const diagram = await generateDiagram(requirements, type, setStage);
    onGenerated(diagram);
  };

  const generating = stage !== null;

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!generating) onClose();
      }}
      title="Generate a UML Diagram"
      description="Describe your system and let AI build the diagram."
      className="max-w-xl"
    >
      {generating ? (
        <div className="flex flex-col items-center py-8">
          <div className="relative mb-6 flex h-16 w-16 items-center justify-center">
            <span className="absolute inset-0 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
            <Sparkles className="h-6 w-6 text-indigo-500" />
          </div>
          <ul className="w-full max-w-xs space-y-3">
            {GENERATION_STAGES.map((s) => {
              const done = (GENERATION_STAGES.indexOf(s) < GENERATION_STAGES.indexOf(stage));
              const current = s.label === stage.label;
              return (
                <li key={s.label} className="flex items-center gap-3">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold ${
                      done
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                        : current
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                          : 'border-slate-200 bg-slate-50 text-slate-300'
                    }`}
                  >
                    {done ? '✓' : GENERATION_STAGES.indexOf(s) + 1}
                  </span>
                  <span
                    className={`text-sm ${done ? 'text-slate-500' : current ? 'font-medium text-slate-900' : 'text-slate-300'}`}
                  >
                    {s.label}
                  </span>
                  {current && <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <Field label="Diagram type">
              <Select value={type} onChange={(e) => setType(e.target.value as DiagramType)}>
                {(Object.keys(DIAGRAM_TYPE_LABELS) as DiagramType[]).map((t) => (
                  <option key={t} value={t}>
                    {DIAGRAM_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Requirements">
              <Textarea
                rows={6}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder={
                  'Students can register for courses,\nview their enrolled courses and submit\nassignments. Teachers can create courses\nand grade assignments.'
                }
                className="resize-none"
              />
            </Field>
          </div>
          <div className="mt-5 flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="accent" disabled={requirements.trim().length < 10} onClick={() => void run()}>
              <Sparkles className="h-4 w-4" /> Generate Diagram
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}