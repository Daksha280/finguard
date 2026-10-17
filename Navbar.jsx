import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function initials(name = '') {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function Navbar({ title }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-ink-100 bg-surface px-4 md:px-6">
      <h1 className="text-[17px] font-semibold text-ink-900">{title}</h1>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2.5 rounded-md py-1.5 pl-1.5 pr-2.5 hover:bg-ink-100"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
            {initials(user?.name)}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-tight text-ink-900">{user?.name}</p>
            <p className="text-xs capitalize leading-tight text-ink-500">{user?.role}</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-500">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 mt-1 w-48 rounded-md border border-ink-100 bg-surface py-1 shadow-card">
            <button
              onClick={() => {
                setOpen(false);
                navigate('/profile');
              }}
              className="block w-full px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-100"
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
