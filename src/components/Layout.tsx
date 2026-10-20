import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '▤' },
  { to: '/tasks', label: 'Tasks', icon: '✓' },
  { to: '/people', label: 'People', icon: '●' },
  { to: '/import', label: 'Import', icon: '⬇', requires: 'coordinator' as const },
  { to: '/access', label: 'Access', icon: '⚑', requires: 'admin' as const },
];

function navClass(isActive: boolean) {
  return [
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100',
  ].join(' ');
}

function mobileNavClass(isActive: boolean) {
  return [
    'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium',
    isActive ? 'text-brand-700' : 'text-slate-500',
  ].join(' ');
}

export default function Layout() {
  const { profile, signOut, isCoordinator, isBvpAdmin } = useAuth();
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.requires === 'admin') return isBvpAdmin;
    if (item.requires === 'coordinator') return isCoordinator;
    return true;
  });
  const roleLabel = isBvpAdmin ? 'BVP admin' : isCoordinator ? 'BVP coordinator' : 'Viewer';

  return (
    <div className="flex h-screen flex-col overflow-hidden md:flex-row">
      <aside className="hidden w-60 flex-col overflow-y-auto border-r border-slate-200 bg-white p-4 md:flex">
        <div className="mb-6 px-2">
          <p className="text-sm font-semibold text-slate-900">RLD BVP Event</p>
          <p className="text-xs text-slate-500">Task tracker</p>
        </div>
        <nav className="flex-1 space-y-1">
          {visibleItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => navClass(isActive)}>
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-500">
          <p className="truncate font-medium text-slate-700">{profile?.full_name || profile?.email}</p>
          <p>{roleLabel}</p>
          <button onClick={signOut} className="mt-2 text-brand-700 hover:underline">
            Sign out
          </button>
        </div>
      </aside>

      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <div>
          <p className="text-sm font-semibold text-slate-900">RLD BVP Event</p>
          <p className="text-xs text-slate-500">Task tracker</p>
        </div>
        <button onClick={signOut} className="text-xs font-medium text-brand-700">
          Sign out
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white md:hidden">
        {visibleItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => mobileNavClass(isActive)}>
            <span aria-hidden className="text-base">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
