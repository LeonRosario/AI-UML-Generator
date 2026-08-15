import { useMemo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, Sparkles, User } from 'lucide-react';
import type { ChatMessage } from '@/types';
import { explainDiagram, findIssues, improveDiagram, sendChatMessage } from '@/services/ai';
import { useToast } from '@/components/ui/Toast';
import type { Diagram } from '@/types';

const QUICK_ACTIONS_DATA = [
  { label: 'Add Actor', prompt: 'Add an administrator actor who can manage students.' },
  { label: 'Add Class', prompt: 'Add a Session class with startTime and endTime.' },
  { label: 'Add Relationship', prompt: 'Connect Student to Course with a 1..* association.' },
  { label: 'Explain Diagram', prompt: '__explain__' },
  { label: 'Find Issues', prompt: '__issues__' },
  { label: 'Improve Diagram', prompt: '__improve__' },
];

export function AIChat({ diagram, collapsed }: { diagram: Diagram; collapsed: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'greet',
      role: 'assistant',
      content: 'Hi — I\'m UMLForge AI. Describe what you want to change and I will update your diagram.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [usedCount, setUsedCount] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Memoize quick actions to prevent array recreation on every render
  const quickActions = useMemo(() => QUICK_ACTIONS_DATA, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const push = (role: 'user' | 'assistant', content: string) => {
    setMessages((m) => [...m, { id: `m-${Date.now()}-${Math.random()}`, role, content, timestamp: new Date().toISOString() }]);
  };

  const run = async (prompt: string) => {
    if (loading) return;
    setInput('');
    push('user', prompt);
    setLoading(true);
    try {
      if (prompt === '__explain__') {
        const reply = await explainDiagram(diagram);
        push('assistant', reply);
      } else if (prompt === '__issues__') {
        const reply = await findIssues(diagram);
        push('assistant', reply);
      } else if (prompt === '__improve__') {
        const reply = await improveDiagram(diagram);
        push('assistant', reply);
        setUsedCount((c) => c + 1);
        toast('success', 'Diagram improved by AI');
      } else {
        const reply = await sendChatMessage(prompt, diagram);
        push('assistant', reply.message);
        if (reply.applied?.length) {
          push('assistant', `Applied: ${reply.applied.join(' · ')}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500 text-white">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">UMLForge AI</p>
          <p className="text-[11px] text-slate-400">Describe what you want to change.</p>
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-3">
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                  m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-indigo-50 text-indigo-500'
                }`}
              >
                {m.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </span>
              <div
                className={`max-w-[80%] whitespace-pre-line rounded-lg px-3 py-2 text-[13px] leading-relaxed ${
                  m.role === 'user' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700 shadow-soft'
                }`}
              >
                {m.content}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 pl-8">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400 [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400 [animation-delay:240ms]" />
            </motion.div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 ${collapsed ? 'hidden' : ''}">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">Quick actions</p>
          <div className="flex flex-wrap gap-1.5">
            {quickActions
              .filter((a) => !(collapsed && ['Explain Diagram', 'Find Issues', 'Improve Diagram'].includes(a.label)))
              .map((a) => (
              <button
                key={a.label}
                onClick={() => run(a.prompt)}
                disabled={loading}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
        <form
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (input.trim()) void run(input.trim());
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI to modify your diagram…"
            className="h-9.5 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-[13px] placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            type="text"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white transition-colors hover:bg-indigo-600 disabled:opacity-40"
          >
            {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}