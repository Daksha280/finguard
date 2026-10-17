import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.');
      return;
    }

    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  }

  function fillDemo(role) {
    if (role === 'admin') {
      setEmail('admin@finguard.com');
      setPassword('Admin@123');
    } else {
      setEmail('analyst@finguard.com');
      setPassword('Analyst@123');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <svg width="44" height="44" viewBox="0 0 32 32" className="mb-3">
            <path d="M16 2 L28 7 V15 C28 23 22.5 28.5 16 30 C9.5 28.5 4 23 4 15 V7 Z" fill="#2563EB" />
            <path d="M11 16 L14.5 19.5 L21 12" stroke="white" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h1 className="text-xl font-semibold text-ink-900">FinGuard</h1>
          <p className="mt-1 text-sm text-ink-500">Transaction Risk Monitoring Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input-field"
                placeholder="you@finguard.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-md bg-risk-highBg px-3 py-2 text-sm text-risk-high">{error}</div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="mt-4 card p-4">
          <p className="mb-2 text-xs font-medium text-ink-500">Demo accounts</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => fillDemo('admin')} className="btn-secondary flex-1 text-xs">
              Use Admin
            </button>
            <button type="button" onClick={() => fillDemo('analyst')} className="btn-secondary flex-1 text-xs">
              Use Analyst
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
