import { useCallback, useRef, useState } from 'react';

const LIMIT = 60;

export function useHistory<T>(initial: T) {
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const [present, setPresent] = useState<T>(initial);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const commit = useCallback((next: T) => {
    setPresent((current) => {
      past.current = [...past.current.slice(-(LIMIT - 1)), current];
      future.current = [];
      setCanUndo(true);
      setCanRedo(false);
      return next;
    });
  }, []);

  const replace = useCallback((next: T) => {
    setPresent(next);
  }, []);

  const undo = useCallback(() => {
    setPresent((current) => {
      const prev = past.current.pop();
      if (!prev) return current;
      future.current = [...future.current, current];
      setCanUndo(past.current.length > 0);
      setCanRedo(true);
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setPresent((current) => {
      const next = future.current.pop();
      if (!next) return current;
      past.current = [...past.current, current];
      setCanUndo(true);
      setCanRedo(future.current.length > 0);
      return next;
    });
  }, []);

  return { present, commit, replace, undo, redo, canUndo, canRedo };
}
