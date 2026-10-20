import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { IconSparkle } from '../components/icons';

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
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="panel w-full max-w-sm p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal text-on-teal">
            <IconSparkle size={15} />
          </span>
          <span className="text-[17.5px] font-semibold text-ink">RLD BVP Event</span>
        </div>
        <p className="page-sub">Sign in with the same phone number / email and password you use for other Sampark apps.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div>
            <span className="input-label">Phone number or email</span>
            <input
              type="text"
              required
              autoComplete="username"
              placeholder="e.g. 9876543210"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <span className="input-label">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </div>
          {error && <p className="text-[14.5px] text-out">{error}</p>}
          <button type="submit" disabled={loading} className="btn w-full justify-center">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-[13.5px] text-muted">Don't have an account yet? Ask a Sampark admin to add you.</p>
      </div>
    </div>
  );
}
