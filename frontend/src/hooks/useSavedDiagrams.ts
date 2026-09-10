import { useEffect, useState } from 'react';
import { fetchDiagrams, type DiagramMeta } from '@/lib/editor/api';
import { useAuth } from '@/services/auth';

export function useSavedDiagrams() {
  const { user } = useAuth();
  const [diagrams, setDiagrams] = useState<DiagramMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setDiagrams([]);
    setLoading(true);
    setError('');
    fetchDiagrams(user?.id).then(items => {
      if (active) setDiagrams(items);
    }).catch(() => {
      if (active) setError('Your diagrams could not be loaded. Refresh to try again.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id]);
  return { diagrams, loading, error };
}
