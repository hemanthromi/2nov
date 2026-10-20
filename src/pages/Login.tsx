import { useState } from 'react';
import { supabase } from '../lib/supabase';

const STAFF_EMAIL_DOMAIN = 'sampark-staff.in';

function resolveEmail(identifier: string): string {
  const trimmed = identifier.trim();
  const digitsOnly = trimmed.replace(/\D/g, '');
  // Staff sign in with just their 10-digit phone number, same as the
  // other Sampark apps (mapped to phone@sampark-staff.in under the hood).
  if (/^\d{10}$/.test(digitsOnly)) {
    return `${digitsOnly}@${STAFF_EMAIL_DOMAIN}`;
  }
  return trimmed;
}

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: resolveEmail(identifier),
      password,
    });
    setLoading(false);
    if (error) setError(error.message === 'Invalid login credentials' ? 'Incorrect phone/email or password.' : error.message);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">RLD BVP Event Tasks</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign in with the same phone number / email and password you use for other Sampark apps.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="text"
            required
            autoComplete="username"
            placeholder="Phone number or email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="input"
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-400">
          Don't have an account yet? Ask a Sampark admin to add you.
        </p>
      </div>
    </div>
  );
}
