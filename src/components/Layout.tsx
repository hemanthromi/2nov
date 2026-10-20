import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import { useTheme } from '../lib/useTheme';
import ChecklistSwitcher from './ChecklistSwitcher';
import { IconGrid, IconCheckCircle, IconUsers, IconDownload, IconFlag, IconSignOut, IconSun, IconMoon, IconSparkle } from './icons';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', Icon: IconGrid },
  { to: '/tasks', label: 'Tasks', Icon: IconCheckCircle },
  { to: '/people', label: 'People', Icon: IconUsers },
  { to: '/import', label: 'Import', Icon: IconDownload, requires: 'coordinator' as const },
  { to: '/access', label: 'Access', Icon: IconFlag, requires: 'admin' as const },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}

export default function Layout() {
  const { profile, signOut, isCoordinator, isBvpAdmin } = useAuth();
  const { toggle, effective } = useTheme();
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.requires === 'admin') return isBvpAdmin;
    if (item.requires === 'coordinator') return isCoordinator;
    return true;
  });
  const roleLabel = isBvpAdmin ? 'BVP admin' : isCoordinator ? 'BVP coordinator' : 'Viewer';
  const displayName = profile?.full_name || profile?.email || '';

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg text-ink md:flex-row">
      <aside className="hidden w-[204px] shrink-0 flex-col overflow-y-auto border-r border-line bg-paper p-4 md:flex">
        <div className="mb-1 flex items-center gap-2 px-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal text-on-teal">
            <IconSparkle size={15} />
          </span>
          <span className="text-[19.5px] font-semibold text-ink">RLD BVP</span>
        </div>
        <p className="mb-3 px-1 text-[11.5px] font-semibold uppercase tracking-wide text-muted">Event tracker</p>

        <div className="mb-4">
          <ChecklistSwitcher />
        </div>

        <nav className="flex-1 space-y-0.5">
          {visibleItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14.5px] font-medium transition-colors ${
                  isActive ? 'bg-pale text-teal' : 'text-muted hover:bg-hover'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pale text-[13.5px] font-semibold text-teal">
              {initials(displayName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium text-ink">{displayName}</p>
              <p className="truncate text-[12.5px] text-muted">{roleLabel}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button onClick={toggle} className="icon-btn" aria-label="Toggle theme">
              {effective === 'dark' ? <IconMoon size={15} /> : <IconSun size={15} />}
            </button>
            <button onClick={signOut} className="icon-btn" aria-label="Sign out">
              <IconSignOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex shrink-0 flex-col border-b border-line bg-paper md:hidden">
        <div className="flex h-[50px] items-center justify-between px-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal text-on-teal">
              <IconSparkle size={15} />
            </span>
            <span className="text-[16.5px] font-semibold text-ink">RLD BVP</span>
          </div>
          <button onClick={signOut} className="icon-btn" aria-label="Sign out">
            <IconSignOut size={15} />
          </button>
        </div>
        <div className="border-t border-line px-3.5 py-2">
          <ChecklistSwitcher compact />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-[64px] md:pb-0">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] md:hidden">
        {visibleItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[12px] font-medium ${
                isActive ? 'text-teal' : 'text-muted'
              }`
            }
          >
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
