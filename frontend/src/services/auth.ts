import { createElement, useCallback, useEffect, useState, type ReactNode } from 'react';
import { createContext, useContext } from 'react';
import { loadJSON, removeKey, saveJSON } from '@/services/storage';

export type AuthUser = { id: string; name: string; email: string; role?: string };
type StoredUser = AuthUser & { passwordHash: string };
type AuthContextValue = { user: AuthUser | null; loading: boolean; signIn: (email: string, password: string, remember: boolean) => Promise<void>; signUp: (name: string, email: string, password: string) => Promise<void>; signOut: () => Promise<void>; requestPasswordReset: (email: string) => Promise<void> };

const AuthContext = createContext<AuthContextValue | null>(null);
const USER_KEY = 'auth:users';
const SESSION_KEY = 'auth:session';
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');

function users(): StoredUser[] { return loadJSON<StoredUser[]>(USER_KEY, []); }
function publicUser(user: StoredUser): AuthUser { const { passwordHash: _passwordHash, ...safe } = user; return safe; }
async function hashPassword(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...options.headers } });
  const body = (await response.json().catch(() => ({}))) as { detail?: string } & T;
  if (!response.ok) throw new Error(body.detail ?? 'Something went wrong. Please try again.');
  return body;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadJSON<AuthUser | null>(SESSION_KEY, null) ?? JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null') as AuthUser | null);
  const [loading, setLoading] = useState(Boolean(API_URL));

  useEffect(() => {
    if (!API_URL) return;
    api<{ user: AuthUser }>('/auth/me').then(({ user: current }) => setUser(current)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (email: string, password: string, remember: boolean) => {
    if (API_URL) {
      const result = await api<{ user: AuthUser }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, remember }) });
      setUser(result.user);
      return;
    }
    const passwordHash = await hashPassword(password);
    const match = users().find((candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase() && candidate.passwordHash === passwordHash);
    if (!match) throw new Error('Invalid email or password.');
    const current = publicUser(match);
    if (remember) saveJSON(SESSION_KEY, current); else sessionStorage.setItem(SESSION_KEY, JSON.stringify(current));
    setUser(current);
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    if (API_URL) {
      const result = await api<{ user: AuthUser }>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
      setUser(result.user);
      return;
    }
    const existing = users();
    if (existing.some((candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase())) throw new Error('An account with this email already exists.');
    const user: StoredUser = { id: `user-${Date.now()}`, name: name.trim(), email: email.trim().toLowerCase(), role: 'user', passwordHash: await hashPassword(password) };
    saveJSON(USER_KEY, [...existing, user]);
    const current = publicUser(user);
    saveJSON(SESSION_KEY, current);
    setUser(current);
  }, []);

  const signOut = useCallback(async () => {
    if (API_URL) await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    removeKey(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    if (API_URL) { await api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }); return; }
    if (!users().some((candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase())) throw new Error('No account was found with that email.');
  }, []);

  return createElement(AuthContext.Provider, { value: { user, loading, signIn, signUp, signOut, requestPasswordReset } }, children);
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
