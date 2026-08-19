import { ArrowRight, Boxes, Check, GitBranch, MousePointer2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(99,102,241,0.2),transparent_34%),radial-gradient(circle_at_80%_75%,rgba(45,212,191,0.12),transparent_30%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1fr_0.9fr]">
        <section className="hidden flex-col justify-between px-10 py-10 lg:flex xl:px-16">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}><Logo className="[&>span:last-child]:text-white" markClassName="bg-white text-slate-950" /></motion.div>
          <div className="relative max-w-xl pb-12">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <p className="mb-5 text-sm font-medium uppercase tracking-[0.2em] text-indigo-300">Design. Generate. Collaborate.</p>
              <h1 className="max-w-lg text-5xl font-semibold leading-[1.05] tracking-tight xl:text-6xl">Your ideas deserve a clearer shape.</h1>
              <p className="mt-6 max-w-md text-base leading-7 text-slate-300">Turn complex systems into diagrams your whole team can understand, refine, and ship.</p>
            </motion.div>
            <DiagramArt />
          </div>
          <p className="text-xs text-slate-500">The workspace for thoughtful systems thinking.</p>
        </section>
        <section className="flex items-center justify-center px-4 py-8 sm:px-8 lg:bg-white/[0.03] lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden"><Logo className="[&>span:last-child]:text-white" markClassName="bg-white text-slate-950" /></div>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

function DiagramArt() {
  return <div className="pointer-events-none absolute -bottom-20 left-0 h-72 w-full opacity-70">
    <svg viewBox="0 0 560 280" className="h-full w-full overflow-visible" fill="none" aria-hidden="true">
      <path d="M70 70L240 40L420 100L300 220L70 190L70 70Z" stroke="rgba(129,140,248,.45)" strokeDasharray="5 8" />
      <path d="M70 70L70 190M240 40L300 220M420 100L300 220" stroke="rgba(148,163,184,.32)" />
      {[['70','70'], ['240','40'], ['420','100'], ['300','220'], ['70','190']].map(([x, y], index) => <g key={x + y}><rect x={Number(x) - 32} y={Number(y) - 19} width="64" height="38" rx="5" fill="rgba(15,23,42,.85)" stroke={index === 1 ? 'rgba(129,140,248,.9)' : 'rgba(148,163,184,.45)'} /><path d={`M${Number(x) - 32} ${Number(y) - 5}h64`} stroke="rgba(148,163,184,.35)" /><circle cx={Number(x) - 20} cy={Number(y) + 7} r="2" fill="rgba(45,212,191,.8)" /></g>)}
      <motion.circle cx="240" cy="40" r="5" fill="#818cf8" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2.4, repeat: Infinity }} />
    </svg>
  </div>;
}

export function AuthMark() { return <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"><Boxes className="h-5 w-5" /></span>; }
export const authIconSet = { ArrowRight, Check, GitBranch, MousePointer2 };
