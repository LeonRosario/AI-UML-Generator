import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/services/auth';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Loading your workspace...</div>;
  return user ? <Outlet /> : <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
}
