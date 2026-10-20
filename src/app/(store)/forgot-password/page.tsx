'use client';
import React, { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (res.ok) setMessage(data.message); else setError(data.error || 'Something went wrong');
    } catch { setError('Network error. Please try again.'); }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 style={{ textAlign: 'center' }}>FORGOT PASSWORD</h1>
        <p className="subtitle" style={{ textAlign: 'center' }}>Enter your email and we will send you a link to reset it.</p>
        {message ? (
          <p role="status" style={{ fontWeight: 800, textAlign: 'center', padding: '1rem 0' }}>{message}</p>
        ) : (
          <form onSubmit={submit}>
            <div className="input-group">
              <label htmlFor="fp-email">Email Address</label>
              <input id="fp-email" className="input" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" />
            </div>
            {error && <p role="alert" style={{ color: 'var(--accent-red)', fontWeight: 800, marginBottom: '1rem' }}>{error}</p>}
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>{loading ? 'SENDING…' : 'SEND RESET LINK →'}</button>
          </form>
        )}
        <p style={{ textAlign: 'center', fontSize: '0.9rem', marginTop: '1.5rem' }}>
          <Link href="/login" style={{ fontWeight: 700, textDecoration: 'underline' }}>← Back to login</Link>
        </p>
      </div>
    </div>
  );
}
