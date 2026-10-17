export function Spinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-risk-highBg text-risk-high">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="text-sm font-medium text-ink-900">Something went wrong</p>
      <p className="text-sm text-ink-500">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-1">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', message }) {
  return (
    <div className="card flex flex-col items-center gap-2 p-10 text-center">
      <p className="text-sm font-medium text-ink-900">{title}</p>
      {message && <p className="text-sm text-ink-500">{message}</p>}
    </div>
  );
}
