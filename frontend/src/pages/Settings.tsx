import { useState } from 'react';
import {
  Brain,
  CreditCard,
  Download,
  FileJson,
  Lock,
  Moon,
  Palette,
  Shield,
  Sun,
  User,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';

const TABS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'ai', label: 'AI preferences', icon: Brain },
  { id: 'export', label: 'Export preferences', icon: Download },
  { id: 'account', label: 'Account', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Lock },
];

export function Settings() {
  const [tab, setTab] = useState('profile');
  const toast = useToast();

  const saved = (msg = 'Settings saved') => toast('success', msg);

  return (
    <div className="max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account and workspace preferences.</p>
      </div>

      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        <nav className="flex shrink-0 gap-1 overflow-x-auto md:w-48 md:flex-col">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                tab === t.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>

        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="min-w-0 flex-1 space-y-6"
        >
          {tab === 'profile' && (
            <>
              <Section title="Profile" desc="How you appear across UMLForge.">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-semibold text-indigo-600">
                    AK
                  </div>
                  <div>
                    <Button size="sm" variant="outline">
                      Change avatar
                    </Button>
                    <p className="mt-1 text-xs text-slate-400">PNG or JPG, up to 2 MB.</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name">
                    <Input defaultValue="Alex Kim" />
                  </Field>
                  <Field label="Display name">
                    <Input defaultValue="alexk" />
                  </Field>
                </div>
                <Field label="Bio">
                  <Textarea rows={3} defaultValue="Software architect building systems one diagram at a time." />
                </Field>
              </Section>
              <SaveRow onClick={saved} />
            </>
          )}

          {tab === 'appearance' && (
            <>
              <Section title="Appearance" desc="Interface density and theme.">
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Sun className="h-4.5 w-4.5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Light theme</p>
                      <p className="text-xs text-slate-400">Clean, focused and readable.</p>
                    </div>
                  </div>
                  <Badge className="border-emerald-100 bg-emerald-50 text-emerald-600">Current</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 opacity-60">
                  <div className="flex items-center gap-3">
                    <Moon className="h-4.5 w-4.5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Dark theme</p>
                      <p className="text-xs text-slate-400">Coming soon.</p>
                    </div>
                  </div>
                </div>
                <Field label="Default canvas background">
                  <Select defaultValue="light-dots">
                    <option value="light-dots">Light · dots</option>
                    <option value="light-grid">Light · grid</option>
                    <option value="plain">Plain</option>
                  </Select>
                </Field>
              </Section>
              <SaveRow onClick={saved} />
            </>
          )}

          {tab === 'ai' && (
            <>
              <Section title="AI preferences" desc="How the AI behaves when editing diagrams.">
                <Field label="Default diagram type">
                  <Select defaultValue="use-case">
                    <option value="use-case">Use Case</option>
                    <option value="class">Class</option>
                    <option value="sequence">Sequence</option>
                    <option value="activity">Activity</option>
                    <option value="er">ER Diagram</option>
                  </Select>
                </Field>
                <Field label="Model">
                  <Select defaultValue="umlforge-1">
                    <option value="umlforge-1">UMLForge-1 (balanced)</option>
                    <option value="umlforge-1-fast">UMLForge-1 Fast (cheaper)</option>
                  </Select>
                </Field>
                <Field label="System prompt" hint="Tell the AI how to structure generated diagrams.">
                  <Textarea
                    rows={4}
                    defaultValue={
                      'Use UML best practices. Label relationships with multiplicity where relevant. Keep class names in PascalCase and members in camelCase.'
                    }
                  />
                </Field>
                <ToggleRow label="Confirm before applying AI changes" desc="Review proposed edits before they touch the canvas." />
              </Section>
              <SaveRow onClick={saved} />
            </>
          )}

          {tab === 'export' && (
            <>
              <Section title="Export preferences" desc="Defaults used by the export menu.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="PNG scale">
                    <Select defaultValue="2x">
                      <option value="1x">1× (screen)</option>
                      <option value="2x">2× (retina)</option>
                      <option value="3x">3× (print quality)</option>
                    </Select>
                  </Field>
                  <Field label="SVG output">
                    <Select defaultValue="inline">
                      <option value="inline">Inline styles</option>
                      <option value="embed">Embedded fonts</option>
                    </Select>
                  </Field>
                </div>
                <Field label="PDF page size">
                  <Select defaultValue="landscape">
                    <option value="landscape">Landscape A4</option>
                    <option value="portrait">Portrait A4</option>
                    <option value="fit">Fit to diagram</option>
                  </Select>
                </Field>
                <ToggleRow label="Include grid background in exports" desc="Keep the dot pattern when exporting images." />
              </Section>
              <SaveRow onClick={saved} />
            </>
          )}

          {tab === 'account' && (
            <>
              <Section title="Account" desc="Your plan and billing.">
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3.5">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Pro plan</p>
                    <p className="text-xs text-slate-400">$12 / month · renews Aug 22, 2026</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Manage billing
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { k: 'Diagrams', v: 'Unlimited' },
                    { k: 'AI credits', v: '184 left' },
                    { k: 'Storage', v: '2.4 GB' },
                  ].map((s) => (
                    <div key={s.k} className="rounded-lg border border-slate-200 px-3 py-3">
                      <p className="text-sm font-semibold text-slate-900">{s.v}</p>
                      <p className="text-xs text-slate-400">{s.k}</p>
                    </div>
                  ))}
                </div>
              </Section>
              <Section title="Workspace" desc="Danger zone">
                <div className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-red-700">Delete account</p>
                    <p className="text-xs text-red-400">All projects and diagrams will be permanently removed.</p>
                  </div>
                  <Button size="sm" variant="danger">
                    Delete
                  </Button>
                </div>
              </Section>
            </>
          )}

          {tab === 'security' && (
            <>
              <Section title="Security" desc="Protect your account.">
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Shield className="h-4.5 w-4.5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Two-factor authentication</p>
                      <p className="text-xs text-slate-400">Require a code when signing in from a new device.</p>
                    </div>
                  </div>
                  <ToggleRow label="" desc="" />
                </div>
                <Field label="Change password">
                  <Input type="password" placeholder="Current password" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="New password">
                    <Input type="password" placeholder="••••••••" />
                  </Field>
                  <Field label="Confirm new password">
                    <Input type="password" placeholder="••••••••" />
                  </Field>
                </div>
              </Section>
              <SaveRow onClick={() => toast('success', 'Password updated')} />
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {desc && <p className="mt-0.5 text-sm text-slate-500">{desc}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function SaveRow({ onClick }: { onClick?: () => void }) {
  return (
    <div className="flex justify-end">
      <Button onClick={onClick}>Save changes</Button>
    </div>
  );
}

function ToggleRow({ label, desc }: { label: string; desc?: string }) {
  const [on, setOn] = useState(true);
  return (
    <button type="button" onClick={() => setOn((o) => !o)} className="flex w-full items-center justify-between gap-3 text-left">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {desc && <p className="text-xs text-slate-400">{desc}</p>}
      </div>
      <span className={cn('relative h-5.5 w-10 shrink-0 rounded-full transition-colors', on ? 'bg-indigo-500' : 'bg-slate-200')}>
        <span
          className={cn(
            'absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow transition-transform',
            on ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  );
}