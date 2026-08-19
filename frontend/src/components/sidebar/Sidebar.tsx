import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  LayoutTemplate,
  Sparkles,
  Clock,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';
import { useAuth } from '@/services/auth';

const items = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/projects', label: 'Projects', icon: FolderKanban },
  { to: '/app/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/app/assistant', label: 'AI Assistant', icon: Sparkles },
  { to: '/app/recent', label: 'Recent', icon: Clock },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ collapsed, onToggle, onNavigate }: { collapsed: boolean; onToggle: () => void; onNavigate?: () => void }) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const initials = user?.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() ?? 'U';

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-slate-200 bg-white transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className={cn('flex h-14 items-center border-b border-slate-100', collapsed ? 'justify-center px-0' : 'justify-between px-4')}>
        {!collapsed && <Logo />}
        {collapsed && <Logo markClassName="mx-auto" className="[&>span:last-child]:hidden" />}
        <button
          onClick={onToggle}
          className={cn('rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600', collapsed && 'hidden')}
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2.5">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-2',
                isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )
            }
          >
            <Icon className={cn('h-4.5 w-4.5 shrink-0', !collapsed && 'text-slate-400', 'group-[.bg-slate-900]:text-white')} />
            {!collapsed && <span>{label}</span>}
            {collapsed && (
              <span className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 opacity-0 shadow-soft transition-opacity group-hover:opacity-100">
                {label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-2.5">
        <div className={cn('flex items-center gap-2.5 rounded-lg px-2 py-1.5', collapsed && 'justify-center px-0')}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{user?.name}</p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="mt-1 flex flex-col">
            <button
              onClick={() => {
                onNavigate?.();
                navigate('/app/settings');
              }}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              <Settings className="h-4 w-4" />
              Account settings
            </button>
            <button onClick={() => void signOut()} className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}
        {collapsed && (
          <button
            onClick={onToggle}
            className="mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {collapsed && (
          <motion.button
            onClick={onToggle}
            className="absolute bottom-2 hidden rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </aside>
  );
}
