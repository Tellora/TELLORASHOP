'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { showToast('Passwords do not match', 'error'); return; }
    if (password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    setLoading(true);
    const result = await register(email, password, name);
    if (result.success) {
      showToast('Account created! Welcome!');
      router.push('/');
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
        <p className="subtitle" style={{ textAlign: 'center' }}>Create your TelloraShop account</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group"><label>Full Name</label><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Cooper" required /></div>
          <div className="input-group"><label>Email Address</label><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required /></div>
          <div className="input-group"><label>Password</label><input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required /></div>
          <div className="input-group"><label>Confirm Password</label><input className="input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required /></div>
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
