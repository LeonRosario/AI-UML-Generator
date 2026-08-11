import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  FileType2,
  GitBranch,
  History,
  MousePointerClick,
  Sparkles,
  Workflow,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/navbar/Navbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { UMLDemo } from '@/components/marketing/UMLDemo';
import { HowItWorks } from '@/components/ui/HowItWorks';
import { USE_CASE, DIAGRAMS_BY_TYPE, DIAGRAM_TYPE_LABELS } from '@/data/diagrams';
import type { DiagramType } from '@/types';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
};

const features = [
  { icon: Brain, title: 'AI Diagram Generation', desc: 'Convert natural-language requirements into structured UML diagrams.' },
  { icon: Workflow, title: 'Multiple Diagram Types', desc: 'Generate Use Case, Class, Sequence, Activity and ER diagrams.' },
  { icon: MousePointerClick, title: 'Interactive Editor', desc: 'Drag, move, connect, edit, and delete diagram elements on a canvas.' },
  { icon: Zap, title: 'AI Editing', desc: 'Modify diagrams with natural-language commands. "Add an administrator actor."' },
  { icon: History, title: 'Version History', desc: 'Save and restore previous diagram versions with one click.' },
  { icon: FileType2, title: 'Export', desc: 'Export diagrams as PNG, SVG, and PDF for docs and presentations.' },
];

const diagramTabs: DiagramType[] = ['use-case', 'class', 'sequence', 'activity', 'er'];

export function Landing() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-100/40 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-16 lg:grid-cols-[1fr_1.15fr] lg:gap-10 lg:pb-24 lg:pt-20">
          <div className="flex flex-col items-start justify-center">
            <motion.div {...fadeUp}>
              <Badge className="mb-5 border-indigo-100 bg-indigo-50 text-indigo-600">
                <Sparkles className="h-3 w-3" /> Powered by AI
              </Badge>
            </motion.div>
            <motion.h1
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.05 }}
              className="text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem]"
            >
              Turn Requirements Into{' '}
              <span className="text-indigo-500">UML Diagrams</span> With AI
            </motion.h1>
            <motion.p
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.1 }}
              className="mt-5 max-w-lg text-lg leading-relaxed text-slate-500"
            >
              Describe your software system in plain English and let UMLForge automatically generate structured, editable
              UML diagrams.
            </motion.p>
            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="mt-8 flex flex-wrap gap-3">
              <Link to="/app/projects">
                <Button size="lg">
                  Generate Diagram <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline">
                  Explore Features
                </Button>
              </a>
            </motion.div>
            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="mt-8 flex items-center gap-5 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckMini /> No setup required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckMini /> Free starter plan
              </span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-2xl bg-gradient-to-b from-indigo-100/60 to-transparent blur-xl" />
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-lift">
              <div className="flex items-center gap-1.5 border-b border-slate-200 bg-white px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                <span className="ml-3 rounded-md bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] text-slate-500">
                  student-portal—usecase
                </span>
              </div>
              <div className="grid-bg h-[380px] sm:h-[440px]">
                <UMLDemo diagram={USE_CASE} animate className="[&_.react-flow]:h-full" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Everything you need to model systems</h2>
          <p className="mt-3 text-lg text-slate-500">
            A complete diagramming workspace — from AI generation to polished exports.
          </p>
        </motion.div>
        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.04 }}
              className="group bg-white p-7 transition-shadow hover:shadow-lift"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition-colors group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-[15px] font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------- How It Works ---------- */}
      <HowItWorks />

      {/* ---------- Diagram Types ---------- */}
      <DiagramTypes />

      {/* ---------- Pricing ---------- */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Simple pricing</h2>
          <p className="mt-3 text-lg text-slate-500">Start free. Upgrade when your team needs more.</p>
        </motion.div>
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
          {[
            {
              name: 'Starter',
              price: '$0',
              desc: 'For personal experiments.',
              points: ['5 diagrams / month', 'Class & use case', 'PNG export', 'AI chat (10 messages)'],
            },
            {
              name: 'Pro',
              price: '$12',
              desc: 'For individual developers',
              points: ['Unlimited diagrams', 'All 5 diagram types', 'PNG, SVG, PDF export', 'Unlimited AI chat', 'Version history'],
              featured: true,
            },
            {
              name: 'Team',
              price: '$29',
              desc: 'For teams and studios',
              points: ['Everything in Pro', 'Shared workspaces', 'SSO & audit log', 'Priority support'],
            },
          ].map((p, i) => (
            <motion.div
              key={p.name}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.06 }}
              className={cn(
                'flex flex-col rounded-xl border p-6',
                p.featured ? 'border-slate-900 bg-slate-900 text-white shadow-lift' : 'border-slate-200 bg-white',
              )}
            >
              <h3 className={cn('text-sm font-semibold', p.featured ? 'text-white' : 'text-slate-900')}>{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold">${p.price}</span>
                <span className={cn('text-sm', p.featured ? 'text-slate-300' : 'text-slate-400')}>/ month</span>
              </div>
              <p className={cn('mt-1 text-sm', p.featured ? 'text-slate-300' : 'text-slate-500')}>{p.desc}</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.points.map((pt) => (
                  <li key={pt} className={cn('flex items-center gap-2 text-sm', p.featured ? 'text-slate-200' : 'text-slate-600')}>
                    <CheckMini className="h-4 w-4 shrink-0 text-emerald-500" /> {pt}
                  </li>
                ))}
              </ul>
              <Link to="/app" className="mt-6">
                <Button className="w-full" variant={p.featured ? 'accent' : 'outline'}>
                  {p.featured ? 'Start Pro trial' : 'Get started'}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="border-t border-slate-200 bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Start forging diagrams today</h2>
            <p className="mt-1 text-slate-400">Free to start. No credit card required.</p>
          </div>
          <Link to="/app">
            <Button variant="accent" size="lg">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function DiagramTypes() {
  const [active, setActive] = useState<DiagramType>('use-case');
  const diagram = DIAGRAMS_BY_TYPE[active];

  return (
    <section id="diagram-types" className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Every UML diagram you need</h2>
          <p className="mt-3 text-lg text-slate-500">Pick a type to preview a realistic generated example.</p>
        </motion.div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {diagramTabs.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={cn(
                'rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                active === t
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
              )}
            >
              {DIAGRAM_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-10 overflow-hidden rounded-xl border border-slate-200 shadow-soft"
        >
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-slate-400" />
              <span className="font-mono text-xs text-slate-500">{diagram.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-medium text-slate-500">AI generated</span>
            </div>
          </div>
          <div className="grid-bg h-[420px] px-2 pb-2">
            <UMLDemo diagram={diagram} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CheckMini({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="8" r="7" fill="#d1fae5" />
      <path d="M5 8.2 7.2 10.5l4-4.8" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-10 sm:px-6 md:flex-row">
        <Logo />
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
          <a href="#features" className="hover:text-slate-900">Product</a>
          <a href="#diagram-types" className="hover:text-slate-900">Templates</a>
          <a href="#pricing" className="hover:text-slate-900">Pricing</a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-900">GitHub</a>
        </div>
        <p className="text-sm text-slate-400">© 2026 UMLForge. All rights reserved.</p>
      </div>
    </footer>
  );
}