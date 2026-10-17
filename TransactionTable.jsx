import { useNavigate } from 'react-router-dom';
import RiskBadge from './RiskBadge';
import StatusBadge from './StatusBadge';
import { formatINR, formatDateTime } from '../utils/format';

export default function TransactionTable({ transactions, compact = false, sortBy, sortDir, onSort }) {
  const navigate = useNavigate();

  function handleSort(column) {
    if (!onSort) return;
    const nextDir = sortBy === column && sortDir === 'desc' ? 'asc' : 'desc';
    onSort(column, nextDir);
  }

  function SortHeader({ column, children }) {
    const active = sortBy === column;
    return (
      <th
        className={`cursor-pointer select-none whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500 ${onSort ? 'hover:text-ink-900' : ''}`}
        onClick={() => handleSort(column)}
      >
        <span className="inline-flex items-center gap-1">
          {children}
          {onSort && active && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className={sortDir === 'asc' ? 'rotate-180' : ''}>
              <path d="M12 16l-6-6h12z" />
            </svg>
          )}
        </span>
      </th>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-ink-100 bg-ink-50/50">
            <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Txn ID</th>
            <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Customer</th>
            {onSort ? <SortHeader column="amount">Amount</SortHeader> : <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Amount</th>}
            <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Merchant</th>
            <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Location</th>
            {!compact && <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Device</th>}
            {onSort ? <SortHeader column="date">Timestamp</SortHeader> : <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Timestamp</th>}
            {onSort ? <SortHeader column="riskScore">Risk</SortHeader> : <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Risk</th>}
            <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => (
            <tr
              key={txn.id}
              onClick={() => navigate(`/transactions/${txn.id}`)}
              className="cursor-pointer border-b border-ink-100 last:border-0 hover:bg-brand-50/40"
            >
              <td className="table-num whitespace-nowrap px-4 py-2.5 font-medium text-brand-700">{txn.txnRef}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-ink-900">{txn.customerName}</td>
              <td className="table-num whitespace-nowrap px-4 py-2.5 text-ink-900">{formatINR(txn.amount)}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-ink-700">{txn.merchant}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-ink-700">{txn.location}</td>
              {!compact && <td className="whitespace-nowrap px-4 py-2.5 text-ink-700">{txn.device}</td>}
              <td className="table-num whitespace-nowrap px-4 py-2.5 text-ink-500">{formatDateTime(txn.timestamp)}</td>
              <td className="whitespace-nowrap px-4 py-2.5">
                <RiskBadge level={txn.riskLevel} score={txn.riskScore} />
              </td>
              <td className="whitespace-nowrap px-4 py-2.5">
                <StatusBadge status={txn.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
