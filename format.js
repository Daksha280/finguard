export function formatINR(amount) {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export const RISK_STYLES = {
  HIGH: { text: 'text-risk-high', bg: 'bg-risk-highBg', dot: 'bg-risk-high', border: 'border-red-200' },
  MEDIUM: { text: 'text-risk-medium', bg: 'bg-risk-mediumBg', dot: 'bg-risk-medium', border: 'border-amber-200' },
  LOW: { text: 'text-risk-low', bg: 'bg-risk-lowBg', dot: 'bg-risk-low', border: 'border-green-200' },
};

export const STATUS_STYLES = {
  Normal: 'bg-ink-100 text-ink-700',
  'Under Review': 'bg-amber-50 text-amber-700',
  Flagged: 'bg-orange-50 text-orange-700',
  Blocked: 'bg-red-50 text-red-700',
};
