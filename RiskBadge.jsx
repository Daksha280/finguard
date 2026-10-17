import { RISK_STYLES } from '../utils/format';

export default function RiskBadge({ level, score }) {
  const style = RISK_STYLES[level] || RISK_STYLES.LOW;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {level}
      {score !== undefined && <span className="font-mono font-normal opacity-70">· {score}</span>}
    </span>
  );
}
