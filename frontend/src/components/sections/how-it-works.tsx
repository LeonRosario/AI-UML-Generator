import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Upload, ScanSearch, Sparkles, BriefcaseBusiness } from 'lucide-react';
import TextBlockAnimation from '@/components/ui/text-block-animation';
import { cn } from '@/lib/cn';

interface Step {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  borderColor: string;
  bgColor: string;
  iconBgColor: string;
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Upload Your Resume',
    description: 'Upload your existing resume and let CareerAI analyze your experience, skills, and career profile.',
    icon: <Upload className="h-5 w-5" />,
    accentColor: '#6366f1',
    borderColor: 'border-indigo-200',
    bgColor: 'bg-indigo-50',
    iconBgColor: 'bg-indigo-100',
  },
  {
    number: '02',
    title: 'Analyze Your Resume',
    description:
      'Get an instant ATS score, identify formatting issues, discover missing keywords, and understand where your resume can improve.',
    icon: <ScanSearch className="h-5 w-5" />,
    accentColor: '#0ea5e9',
    borderColor: 'border-sky-200',
    bgColor: 'bg-sky-50',
    iconBgColor: 'bg-sky-100',
  },
  {
    number: '03',
    title: 'Improve Your Career Profile',
    description: 'Use AI-powered recommendations to close skill gaps, improve your resume, discover relevant jobs, and prepare for interviews.',
    icon: <Sparkles className="h-5 w-5" />,
    accentColor: '#8b5cf6',
    borderColor: 'border-violet-200',
    bgColor: 'bg-violet-50',
    iconBgColor: 'bg-violet-100',
  },
  {
    number: '04',
    title: 'Apply With Confidence',
    description: 'Build a stronger resume, match with suitable opportunities, and practice interviews with personalized AI guidance.',
    icon: <BriefcaseBusiness className="h-5 w-5" />,
    accentColor: '#10b981',
    borderColor: 'border-emerald-200',
    bgColor: 'bg-emerald-50',
    iconBgColor: 'bg-emerald-100',
  },
];

export function HowItWorksCareerAI() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[720px] -translate-x-1/2 rounded-full bg-indigo-100/30 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.45,
              ease: [0.16, 1, 0.3, 1] as const,
            }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">How CareerAI Works</h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.45,
              ease: [0.16, 1, 0.3, 1] as const,
              delay: prefersReducedMotion ? 0 : 0.12,
            }}
            className="mt-3 text-lg text-slate-500"
          >
            From your first resume upload to your next interview, CareerAI guides you through every step.
          </motion.p>
        </div>

        {/* Steps Container */}
        <div
          ref={containerRef}
          className="relative mt-16 grid gap-6 md:mt-20 md:grid-cols-2 lg:grid-cols-4 lg:gap-4"
        >
          {/* Horizontal connector line (desktop only) */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-1/4 hidden h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent lg:block"
          />

          {/* Steps */}
          {STEPS.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.45,
                ease: [0.16, 1, 0.3, 1] as const,
                delay: prefersReducedMotion ? 0 : index * 0.12,
              }}
              className="group relative"
            >
              {/* Card */}
              <motion.div
                whileHover={{ y: prefersReducedMotion ? 0 : -4 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'relative overflow-hidden rounded-lg border bg-white p-6 transition-all duration-300',
                  'hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)]',
                  step.borderColor
                )}
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div
                    className="absolute inset-0 blur-xl opacity-20"
                    style={{
                      background: `radial-gradient(400px at 50% 50%, ${step.accentColor}20, transparent)`,
                    }}
                  />
                </div>

                <div className="relative z-10">
                  {/* Step Number */}
                  <div className="mb-4 flex items-start justify-between">
                    <span
                      className="text-5xl font-bold leading-none"
                      style={{ color: step.accentColor }}
                    >
                      {step.number}
                    </span>

                    {/* Icon */}
                    <motion.div
                      whileHover={{ scale: prefersReducedMotion ? 1 : 1.1 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 transition-all duration-300',
                        step.iconBgColor
                      )}
                      style={{
                        color: step.accentColor,
                      }}
                      aria-hidden
                    >
                      {step.icon}
                    </motion.div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>

                  {/* Description */}
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Mobile vertical connector line */}
        <div
          aria-hidden
          className="absolute left-1/2 top-0 hidden w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent md:block lg:hidden"
          style={{ height: 'calc(100% - 4rem)', transform: 'translateX(-50%)' }}
        />
      </div>
    </section>
  );
}
