import { Eye, EyeOff } from 'lucide-react';
import { useState, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function PasswordInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  return <div className="relative"><input {...props} type={visible ? 'text' : 'password'} className={cn('h-11 w-full rounded-lg border border-slate-200 bg-white px-3 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10', className)} /><button type="button" onClick={() => setVisible((value) => !value)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>;
}
