import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, Sparkles, User } from 'lucide-react';
import { sendChatMessage } from '@/services/ai';
import { CLASS_SMS } from '@/data/diagrams';
import type { ChatMessage } from '@/types';
import { Button } from '@/components/ui/Button';

const SUGGESTIONS = [
  'Generate a sequence diagram for user login',
  'Explain what my Student Management diagram models',
  'Convert my class diagram to an ER diagram',
  'Find issues in my current diagram',
];

export function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'g',
      role: 'assistant',
      content:
        'I\'m UMLForge AI. I can generate new diagrams, explain existing ones, and apply edits across your projects. What would you like to do?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async (prompt: string) => {
    if (loading) return;
    setInput('');
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: 'user', content: prompt, timestamp: new Date().toISOString() }]);
    setLoading(true);
    try {
      const reply = await sendChatMessage(prompt, CLASS_SMS);
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: 'assistant', content: reply.message, timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">AI Assistant</h1>
        <p className="mt-1 text-sm text-slate-500">Generate, explain and improve diagrams with natural language.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="h-[440px] space-y-4 overflow-y-auto p-5">
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-indigo-50 text-indigo-500'
                }`}
              >
                {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </span>
              <div
                className={`max-w-[75%] whitespace-pre-line rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                {m.content}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 pl-10">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400 [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400 [animation-delay:240ms]" />
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => run(s)}
                disabled={loading}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) void run(input.trim());
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your diagrams…"
              className="h-10 flex-1 rounded-lg border border-slate-300 bg-white px-3.5 text-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <Button type="submit" disabled={loading || !input.trim()} size="icon" className="h-10 w-10" variant="accent" aria-label="Send">
              {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}