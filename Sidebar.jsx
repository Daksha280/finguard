import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true, icon: 'M3 13h4v7H3zM10 8h4v12h-4zM17 3h4v17h-4z' },
  { to: '/transactions', label: 'Transactions', icon: 'M4 6h16M4 12h16M4 18h10' },
  { to: '/audit-logs', label: 'Audit Logs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8h6m-6 4h6' },
];

export default function Sidebar() {
  const { isAdmin } = useAuth();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-ink-100 bg-surface md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-ink-100 px-5">
        <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
          <path d="M16 2 L28 7 V15 C28 23 22.5 28.5 16 30 C9.5 28.5 4 23 4 15 V7 Z" fill="#2563EB" />
          <path d="M11 16 L14.5 19.5 L21 12" stroke="white" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[15px] font-semibold tracking-tight text-ink-900">FinGuard</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-ink-700 hover:bg-ink-100'
              }`
            }
          >
            <svg className="h-4.5 w-4.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {item.label}
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-100'
              }`
            }
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M17 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M12 11a4 4 0 100-8 4 4 0 000 8zM23 20v-1a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Users
          </NavLink>
        )}
      </nav>

      <div className="border-t border-ink-100 px-4 py-3 text-[11px] text-ink-500">
        FinGuard v1.0 · Internal Tool
      </div>
    </aside>
  );
}
