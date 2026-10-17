import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/format';

function initials(name = '') {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="max-w-lg space-y-4">
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-xl font-semibold text-white">
            {initials(user?.name)}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{user?.name}</h2>
            <span className="mt-1 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium capitalize text-brand-700">
              {user?.role}
            </span>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-ink-100 pt-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Email</dt>
            <dd className="mt-0.5 text-sm text-ink-900">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Member Since</dt>
            <dd className="mt-0.5 text-sm text-ink-900">{formatDate(user?.created_at)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">User ID</dt>
            <dd className="mt-0.5 font-mono text-sm text-ink-900">#{user?.id}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Access Level</dt>
            <dd className="mt-0.5 text-sm text-ink-900">
              {user?.role === 'admin' ? 'Full system access' : 'Transaction monitoring & analysis'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="card p-5">
        <h3 className="mb-2 text-sm font-semibold text-ink-900">Permissions</h3>
        <ul className="space-y-1.5 text-sm text-ink-700">
          <li className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            View & search transactions
          </li>
          <li className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Run risk analysis & update status
          </li>
          <li className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            View audit logs
          </li>
          <li className={`flex items-center gap-2 ${user?.role !== 'admin' ? 'text-ink-400' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={user?.role === 'admin' ? '#16A34A' : '#D0D5DD'} strokeWidth="2.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Manage users & roles
          </li>
        </ul>
      </div>
    </div>
  );
}
