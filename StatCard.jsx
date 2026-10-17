export default function StatCard({ label, value, tone = 'default', icon, subtext }) {
  const toneStyles = {
    default: 'text-ink-900',
    high: 'text-risk-high',
    medium: 'text-risk-medium',
    brand: 'text-brand-600',
  };

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        {icon && <div className="text-ink-300">{icon}</div>}
      </div>
      <p className={`mt-2 font-mono text-3xl font-semibold tabular-nums ${toneStyles[tone]}`}>{value}</p>
      {subtext && <p className="mt-1 text-xs text-ink-500">{subtext}</p>}
    </div>
  );
}
