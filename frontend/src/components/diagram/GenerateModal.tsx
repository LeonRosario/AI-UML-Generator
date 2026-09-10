import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Select, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { DIAGRAM_TYPE_LABELS } from '@/data/diagrams';
import { aiGenerateDiagram } from '@/lib/editor/api';
import type { Diagram, DiagramType } from '@/types';

export type GenerationStage = { label: string; progress: number };
const GENERATION_STAGES: GenerationStage[] = [
  { label: 'Contacting AI provider…', progress: 15 },
  { label: 'Validating response…', progress: 60 },
  { label: 'Laying out elements…', progress: 90 },
];

export function GenerateModal({
  open,
  onClose,
  onGenerated,
  initialType,
  onTemplates,
}: {
  open: boolean;
  initialType?: DiagramType;
  onTemplates?: () => void;
  onClose: () => void;
  onGenerated: (diagram: Diagram) => void;
}) {
  const [type, setType] = useState<DiagramType>('use-case');
  const [requirements, setRequirements] = useState('');
  const [stage, setStage] = useState<GenerationStage | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (initialType) setType(initialType);
      setRequirements('');
      setStage(null);
      setError('');
    }
  }, [open, initialType]);

  const run = async () => {
    setStage({ label: 'Contacting AI provider…', progress: 15 });
    setError('');
    try {
      const result = await aiGenerateDiagram(requirements, type, (label, progress) => setStage({ label, progress }));
      onGenerated(result.diagram);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Unable to generate the diagram.';
      setError(/not configured|API_KEY/i.test(message) ? 'AI generation is unavailable in this workspace. You can still build your assignment using templates or shapes. Ask the workspace owner to enable AI generation.' : message);
      setStage(null);
    }
  };

  const generating = stage !== null;

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!generating) onClose();
      }}
      title="Generate a Diagram"
      description="Describe the people, steps and relationships your assignment needs."
      className="max-w-xl"
    >
      <div className="mb-4 flex items-center gap-2 rounded-lg bg-indigo-50/80 px-3 py-2 border border-indigo-100">
        <Sparkles className="h-4 w-4 text-indigo-600" />
        <span className="text-xs font-semibold text-indigo-700">Be specific: include names, relationships and any important rules.</span>
      </div>
      {generating ? (
        <div className="flex flex-col items-center py-8">
          <div className="relative mb-6 flex h-16 w-16 items-center justify-center">
            <span className="absolute inset-0 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
            <Sparkles className="h-6 w-6 text-indigo-500" />
          </div>
          <ul className="w-full max-w-xs space-y-3">
            {GENERATION_STAGES.map((s, index) => {
              const done = s.progress < stage.progress;
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
                    {done ? '✓' : index + 1}
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
            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
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
            {error && onTemplates && <Button variant="outline" onClick={onTemplates}>Use a template instead</Button>}
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
