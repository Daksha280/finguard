import { useEffect, useState } from 'react';
import { usersApi, extractErrorMessage } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Spinner, ErrorState } from '../components/Feedback';
import { formatDate } from '../utils/format';

function initials(name = '') {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await usersApi.list();
      setUsers(res.data.users);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRoleChange(id, role) {
    setUpdatingId(id);
    try {
      const res = await usersApi.updateRole(id, role);
      setUsers((prev) => prev.map((u) => (u.id === id ? res.data.user : u)));
      setToast(`Role updated to "${role}".`);
      setTimeout(() => setToast(''), 2000);
    } catch (err) {
      setToast(extractErrorMessage(err));
      setTimeout(() => setToast(''), 2500);
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-4">
      {toast && <div className="rounded-md bg-ink-900 px-4 py-2 text-sm text-white shadow-card">{toast}</div>}

      <div className="card overflow-hidden">
        <div className="border-b border-ink-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-ink-900">Team Members</h2>
          <p className="text-xs text-ink-500">{users.length} users with FinGuard access</p>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/50">
              <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">User</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Email</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Joined</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-ink-100 last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                      {initials(u.name)}
                    </div>
                    <span className="font-medium text-ink-900">{u.name}</span>
                    {u.id === currentUser.id && (
                      <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-medium text-ink-500">You</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 text-ink-700">{u.email}</td>
                <td className="table-num px-5 py-3 text-ink-500">{formatDate(u.created_at)}</td>
                <td className="px-5 py-3">
                  <select
                    className="input-field w-32 py-1.5 text-xs disabled:opacity-50"
                    value={u.role}
                    disabled={updatingId === u.id || u.id === currentUser.id}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  >
                    <option value="analyst">Analyst</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
