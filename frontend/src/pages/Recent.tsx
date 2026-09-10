import { useSavedDiagrams } from '@/hooks/useSavedDiagrams';
import { SavedDiagramList } from '@/components/diagram/SavedDiagramList';

export function Recent() {
  const saved = useSavedDiagrams();
  return <div><div className="mb-6"><h1 className="text-2xl font-bold tracking-tight text-slate-900">Recent</h1><p className="mt-1 text-sm text-slate-500">Your saved diagrams, with the most recent edits first.</p></div><SavedDiagramList {...saved} /></div>;
}
