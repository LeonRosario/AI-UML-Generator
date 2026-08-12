import { useEffect, useRef, useState } from 'react';
import { LazyMotion, domAnimation, motion } from 'motion/react';
import { MapPin } from 'lucide-react';
import TextBlockAnimation from '@/components/ui/text-block-animation';
import { cn } from '@/lib/cn';

export interface HowItWorksStep {
  number: string;
  title: string;
  description: string;
  chip?: string;
  numberColor?: string;
  blockColor?: string;
}

const STEP_BLOCK_COLORS = ['#6366f1', '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b'];

const DEFAULT_STEPS: HowItWorksStep[] = [
  {
    number: '01',
    title: 'Describe Your System',
    description: 'Tell UMLForge what you want to build using simple natural language.',
    chip: 'border-indigo-100 bg-indigo-50 text-indigo-600',
    numberColor: 'text-indigo-400',
  },
  {
    number: '02',
    title: 'AI Analyzes Requirements',
    description: 'The AI identifies actors, entities, classes, relationships, workflows, and system interactions.',
    chip: 'border-sky-100 bg-sky-50 text-sky-600',
    numberColor: 'text-sky-400',
  },
  {
    number: '03',
    title: 'Generate UML',
    description: 'UMLForge converts the analyzed requirements into a structured and professional UML diagram.',
    chip: 'border-violet-100 bg-violet-50 text-violet-600',
    numberColor: 'text-violet-400',
  },
  {
    number: '04',
    title: 'Edit & Refine',
    description: 'Drag, move, connect, edit, or delete elements directly inside the interactive diagram editor.',
    chip: 'border-emerald-100 bg-emerald-50 text-emerald-600',
    numberColor: 'text-emerald-400',
  },
  {
    number: '05',
    title: 'Export & Share',
    description: 'Save your diagram, view previous versions, and export it as PNG, SVG, PDF, or JSON.',
    chip: 'border-amber-100 bg-amber-50 text-amber-600',
    numberColor: 'text-amber-400',
  },
];

interface HowItWorksProps {
  steps?: HowItWorksStep[];
  title?: string;
  subtitle?: string;
}

export function HowItWorks({
  steps = DEFAULT_STEPS,
  title = 'How UMLForge Works',
  subtitle = 'From a simple idea to a complete UML model in five simple steps.',
}: HowItWorksProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [pathD, setPathD] = useState('');
  const [nodes, setNodes] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const points = cardRefs.current
        .map((card) => {
          if (!card) return null;
          const r = card.getBoundingClientRect();
          return { x: r.left + r.width / 2 - rect.left, y: r.top - rect.top - 14 };
        })
        .filter((p): p is { x: number; y: number } => p !== null);

      setSize({ width: rect.width, height: rect.height });
      setNodes(points);

      if (points.length < 2) {
        setPathD('');
        return;
      }

      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const p0 = points[i - 1];
        const p1 = points[i];
        const mx = (p0.x + p1.x) / 2;
        d += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
      }
      setPathD(d);
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    document.fonts?.ready.then(measure).catch(() => undefined);
    return () => ro.disconnect();
  }, [steps.length]);

  return (
    <section id="how-it-works" className="relative overflow-hidden border-y border-slate-200 bg-white">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(60%_60%_at_50%_38%,black,transparent)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[720px] -translate-x-1/2 rounded-full bg-indigo-100/40 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <TextBlockAnimation blockColor="#8b5cf6" stagger={0.06}>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
          </TextBlockAnimation>
          <p className="mt-3 text-lg text-slate-500">{subtitle}</p>
        </div>

        <LazyMotion features={domAnimation} strict>
          <div ref={containerRef} className="relative mt-14 flex flex-col gap-10 md:mt-16 md:gap-14 lg:mt-20 lg:gap-20">
            <div aria-hidden className="absolute bottom-8 left-1/2 top-8 w-px -translate-x-1/2 bg-slate-200 lg:hidden" />

            {size.width > 0 && pathD && (
              <svg
                aria-hidden
                className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
                viewBox={`0 0 ${size.width} ${size.height}`}
                preserveAspectRatio="none"
                fill="none"
              >
                <path d={pathD} stroke="#e2e8f0" strokeWidth={2.5} />
                <motion.path
                  d={pathD}
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeDasharray="7 13"
                  animate={{ strokeDashoffset: [0, -20] }}
                  transition={{ duration: 1.4, ease: 'linear', repeat: Infinity }}
                />
                {nodes.map((n, i) => (
                  <circle key={i} cx={n.x} cy={n.y} r={4.5} fill="#ffffff" stroke="#cbd5e1" strokeWidth={1.5} />
                ))}
              </svg>
            )}

            {steps.map((step, i) => {
              const isLeft = i % 2 === 0;
              return (
                <div
                  key={step.number}
                  className={cn(
                    'flex w-full justify-center',
                    isLeft ? 'md:justify-start' : 'md:justify-end',
                  )}
                >
                  <div
                    ref={(el) => {
                      cardRefs.current[i] = el;
                    }}
                    className={cn(
                      'w-full max-w-md md:max-w-[380px] lg:max-w-[420px]',
                      isLeft ? 'md:-rotate-1' : 'md:rotate-1',
                    )}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 28 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-80px' }}
                      transition={{
                        duration: 0.55,
                        ease: [0.16, 1, 0.3, 1] as const,
                        delay: i * 0.08,
                      }}
                      whileHover={{ scale: 1.02 }}
                      className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-soft transition-shadow duration-300 hover:shadow-lift lg:p-7"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className={cn('font-hand text-5xl leading-none lg:text-6xl', step.numberColor)}>
                          {step.number}
                        </span>
                        <motion.span
                          animate={{ y: [0, -3, 0] }}
                          transition={{
                            duration: 3,
                            ease: 'easeInOut',
                            repeat: Infinity,
                            delay: i * 0.4,
                          }}
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm transition-colors',
                            step.chip,
                          )}
                        >
                          <MapPin className="h-4 w-4" />
                        </motion.span>
                      </div>
                      <TextBlockAnimation
                        blockColor={step.blockColor ?? STEP_BLOCK_COLORS[i % STEP_BLOCK_COLORS.length]}
                        stagger={0.05}
                        duration={0.5}
                      >
                        <h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-900">{step.title}</h3>
                      </TextBlockAnimation>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{step.description}</p>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </LazyMotion>
      </div>
    </section>
  );
}
