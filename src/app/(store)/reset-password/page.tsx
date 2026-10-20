'use client';
import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ResetForm() {
  const token = useSearchParams().get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
      const data = await res.json();
      if (res.ok) setDone(true); else setError(data.error || 'Could not reset password');
    } catch { setError('Network error. Please try again.'); }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 style={{ textAlign: 'center' }}>NEW PASSWORD</h1>
        {!token ? (
          <p style={{ textAlign: 'center', fontWeight: 800, padding: '1rem 0' }}>This reset link is missing its token. <Link href="/forgot-password" style={{ textDecoration: 'underline' }}>Request a new one</Link>.</p>
        ) : done ? (
          <p role="status" style={{ textAlign: 'center', fontWeight: 800, padding: '1rem 0' }}>Your password has been updated. <Link href="/login" style={{ textDecoration: 'underline' }}>Log in</Link></p>
        ) : (
          <form onSubmit={submit}>
            <div className="input-group"><label htmlFor="rp-pw">New password</label><input id="rp-pw" className="input" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" /></div>
            <div className="input-group"><label htmlFor="rp-pw2">Confirm new password</label><input id="rp-pw2" className="input" type="password" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} /></div>
            {error && <p role="alert" style={{ color: 'var(--accent-red)', fontWeight: 800, marginBottom: '1rem' }}>{error}</p>}
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>{loading ? 'SAVING…' : 'SET NEW PASSWORD →'}</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div className="loading-spinner"><div className="spinner" /></div>}><ResetForm /></Suspense>;
}
