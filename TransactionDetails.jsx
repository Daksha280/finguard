import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { transactionsApi, extractErrorMessage } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';
import { Spinner, ErrorState } from '../components/Feedback';
import { formatINR, formatDateTime, RISK_STYLES } from '../utils/format';

const STATUS_OPTIONS = ['Normal', 'Under Review', 'Flagged', 'Blocked'];

function RiskGauge({ score, level }) {
  const style = RISK_STYLES[level] || RISK_STYLES.LOW;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const strokeColor = level === 'HIGH' ? '#DC2626' : level === 'MEDIUM' ? '#D97706' : '#16A34A';

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#F2F4F7" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={strokeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-bold text-ink-900">{score}</span>
          <span className="text-xs text-ink-500">/ 100</span>
        </div>
      </div>
      <div className="mt-3">
        <RiskBadge level={level} />
      </div>
    </div>
  );
}

export default function TransactionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [txn, setTxn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [toast, setToast] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await transactionsApi.getById(id);
      setTxn(res.data.transaction);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const res = await transactionsApi.analyze(id);
      setTxn(res.data.transaction);
      showToast('Risk analysis complete.');
    } catch (err) {
      showToast(extractErrorMessage(err));
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleStatusChange(status) {
    if (status === txn.status) return;
    setUpdatingStatus(true);
    try {
      const res = await transactionsApi.updateStatus(id, status);
      setTxn(res.data.transaction);
      showToast(`Status updated to "${status}".`);
    } catch (err) {
      showToast(extractErrorMessage(err));
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!txn) return null;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/transactions')} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to transactions
      </button>

      {toast && (
        <div className="rounded-md bg-ink-900 px-4 py-2 text-sm text-white shadow-card">{toast}</div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Transaction Information */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-mono text-lg font-semibold text-ink-900">{txn.txnRef}</h2>
              <p className="text-sm text-ink-500">{formatDateTime(txn.timestamp)}</p>
            </div>
            <StatusBadge status={txn.status} />
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Customer</dt>
              <dd className="mt-0.5 text-ink-900">{txn.customerName}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Customer ID</dt>
              <dd className="mt-0.5 font-mono text-ink-900">{txn.customerId}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Amount</dt>
              <dd className="mt-0.5 font-mono text-base font-semibold text-ink-900">{formatINR(txn.amount)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Merchant</dt>
              <dd className="mt-0.5 text-ink-900">{txn.merchant}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Location</dt>
              <dd className="mt-0.5 text-ink-900">{txn.location}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Device</dt>
              <dd className="mt-0.5 text-ink-900">{txn.device}</dd>
            </div>
          </dl>

          <div className="mt-5 border-t border-ink-100 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-500">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange(status)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                    txn.status === status
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-ink-300 bg-white text-ink-700 hover:bg-ink-100'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Analysis */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-900">Risk Analysis</h2>
            <button onClick={handleAnalyze} disabled={analyzing} className="btn-secondary px-3 py-1.5 text-xs">
              {analyzing ? 'Analyzing…' : 'Re-run Analysis'}
            </button>
          </div>

          <RiskGauge score={txn.riskScore} level={txn.riskLevel} />

          <div className="mt-5 space-y-2 border-t border-ink-100 pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Contributing Factors</p>
            {txn.reasons.length === 0 ? (
              <p className="text-sm text-ink-500">No risk factors detected for this transaction.</p>
            ) : (
              txn.reasons.map((reason, i) => (
                <div key={i} className="flex items-start justify-between gap-3 rounded-md bg-ink-50/60 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{reason.factor}</p>
                    <p className="text-xs text-ink-500">{reason.explanation}</p>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-semibold text-risk-medium">+{reason.points}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
