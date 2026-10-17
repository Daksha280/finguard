import { Outlet, useLocation, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../hooks/useAuth';

const TITLES = {
  '/': 'Dashboard',
  '/transactions': 'Transactions',
  '/audit-logs': 'Audit Logs',
  '/users': 'Users',
  '/profile': 'Profile',
};

function pageTitle(pathname) {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith('/transactions/')) return 'Transaction Details';
  return 'FinGuard';
}

export default function Layout() {
  const location = useLocation();
  const { isAdmin } = useAuth();

  return (
    <div className="flex min-h-screen bg-page">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar title={pageTitle(location.pathname)} />
        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-ink-100 bg-surface md:hidden">
          <NavLink to="/" end className={({ isActive }) => `flex-1 py-2.5 text-center text-xs font-medium ${isActive ? 'text-brand-600' : 'text-ink-500'}`}>
            Dashboard
          </NavLink>
          <NavLink to="/transactions" className={({ isActive }) => `flex-1 py-2.5 text-center text-xs font-medium ${isActive ? 'text-brand-600' : 'text-ink-500'}`}>
            Transactions
          </NavLink>
          <NavLink to="/audit-logs" className={({ isActive }) => `flex-1 py-2.5 text-center text-xs font-medium ${isActive ? 'text-brand-600' : 'text-ink-500'}`}>
            Audit
          </NavLink>
          {isAdmin && (
            <NavLink to="/users" className={({ isActive }) => `flex-1 py-2.5 text-center text-xs font-medium ${isActive ? 'text-brand-600' : 'text-ink-500'}`}>
              Users
            </NavLink>
          )}
        </nav>
      </div>
    </div>
  );
}
