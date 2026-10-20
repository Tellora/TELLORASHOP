'use client';
import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useToast } from '@/components/Toast';

/** Only allow redirects back into this site (never to another origin). */
function safeRedirect(target: string | null): string | null {
  return target && target.startsWith('/') && !target.startsWith('//') ? target : null;
}

function LoginForm() {
  const { login } = useAuth();
  const { storeName } = useSettings();
  const { showToast } = useToast();
  const router = useRouter();
  const redirect = safeRedirect(useSearchParams().get('redirect'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    if (result.success) {
      showToast('Welcome back!');
      router.push(redirect || '/');
    } else {
      showToast(result.error || 'Login failed', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.5rem', fontFamily: 'var(--font-mono)', fontWeight: 900 }}>LOGIN</div>
        <h1 style={{ textAlign: 'center' }}>WELCOME BACK</h1>
        <p className="subtitle" style={{ textAlign: 'center' }}>Log in to your {storeName} account</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="login-email">Email Address</label>
            <input id="login-email" className="input" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required />
          </div>
          <div className="input-group">
            <label htmlFor="login-password">Password</label>
            <input id="login-password" className="input" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <p style={{ textAlign: 'right', marginBottom: '1rem', fontSize: '0.85rem' }}>
            <Link href="/forgot-password" style={{ fontWeight: 700, textDecoration: 'underline' }}>Forgot your password?</Link>
          </p>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'LOGGING IN...' : 'LOGIN →'}
          </button>
        </form>
        <div className="auth-divider">or</div>
        <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>
          Don&apos;t have an account? <Link href={redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register'} style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>Register here →</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="loading-spinner"><div className="spinner" /></div>}><LoginForm /></Suspense>;
}
