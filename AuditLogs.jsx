import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditApi, extractErrorMessage } from '../services/api';
import { Spinner, ErrorState, EmptyState } from '../components/Feedback';
import { formatDateTime } from '../utils/format';

const ACTION_ICONS = {
  'User login': 'M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3',
  'Transaction created': 'M12 4v16m8-8H4',
  'Transaction updated': 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.4-9.4a2.1 2.1 0 112.97 2.97L12 15l-4 1 1-4 8.6-8.4z',
  'Risk analysis performed': 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z',
  'Transaction status changed': 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  'Transaction deleted': 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16',
  'User role changed': 'M17 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M12 11a4 4 0 100-8 4 4 0 000 8z',
};

const DEFAULT_ICON = 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await auditApi.list({ limit: 100 });
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="card">
      <div className="border-b border-ink-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-ink-900">System Activity</h2>
        <p className="text-xs text-ink-500">{total} recorded actions</p>
      </div>

      {logs.length === 0 ? (
        <EmptyState title="No audit activity yet" message="Actions taken by analysts and admins will appear here." />
      ) : (
        <ul className="divide-y divide-ink-100">
          {logs.map((log) => (
            <li key={log.id} className="flex items-start gap-3 px-5 py-3.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d={ACTION_ICONS[log.action] || DEFAULT_ICON} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="text-sm font-medium text-ink-900">{log.action}</p>
                  <span className="table-num shrink-0 text-xs text-ink-500">{formatDateTime(log.timestamp)}</span>
                </div>
                <p className="mt-0.5 text-sm text-ink-500">{log.details}</p>
                {log.transaction_ref && (
                  <button
                    onClick={() => navigate(`/transactions/${log.transaction_id}`)}
                    className="mt-1 font-mono text-xs font-medium text-brand-600 hover:underline"
                  >
                    {log.transaction_ref}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
