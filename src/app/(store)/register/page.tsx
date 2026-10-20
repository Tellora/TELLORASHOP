'use client';
import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useToast } from '@/components/Toast';

function RegisterForm() {
  const { register } = useAuth();
  const { storeName } = useSettings();
  const { showToast } = useToast();
  const router = useRouter();
  const target = useSearchParams().get('redirect');
  const redirect = target && target.startsWith('/') && !target.startsWith('//') ? target : '/';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { showToast('Passwords do not match', 'error'); return; }
    if (password.length < 8) { showToast('Password must be at least 8 characters', 'error'); return; }
    setLoading(true);
    const result = await register(email, password, name);
    if (result.success) {
      showToast('Account created! Welcome!');
      router.push(redirect);
    } else {
      showToast(result.error || 'Registration failed', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.5rem', fontFamily: 'var(--font-mono)', fontWeight: 900 }}>REGISTER</div>
        <h1 style={{ textAlign: 'center' }}>JOIN THE CREW</h1>
        <p className="subtitle" style={{ textAlign: 'center' }}>Create your {storeName} account</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group"><label htmlFor="reg-name">Full Name</label><input id="reg-name" className="input" autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Cooper" required /></div>
          <div className="input-group"><label htmlFor="reg-email">Email Address</label><input id="reg-email" className="input" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required /></div>
          <div className="input-group"><label htmlFor="reg-pw">Password</label><input id="reg-pw" className="input" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} /></div>
          <div className="input-group"><label htmlFor="reg-pw2">Confirm Password</label><input id="reg-pw2" className="input" type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat your password" required /></div>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem' }}>
            By creating an account you agree to our <Link href="/page/terms-of-service" style={{ textDecoration: 'underline' }}>Terms</Link> and <Link href="/page/privacy-policy" style={{ textDecoration: 'underline' }}>Privacy Policy</Link>.
          </p>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT →'}
          </button>
        </form>
        <div className="auth-divider">or</div>
        <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>Login here →</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense fallback={<div className="loading-spinner"><div className="spinner" /></div>}><RegisterForm /></Suspense>;
}
