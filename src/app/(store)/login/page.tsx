'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    if (result.success) {
      showToast('Welcome back!');
      router.push('/');
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
        <p className="subtitle" style={{ textAlign: 'center' }}>Log in to your TelloraShop account</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email Address</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'LOGGING IN...' : 'LOGIN →'}
          </button>
        </form>
        <div className="auth-divider">or</div>
        <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>
          Don&apos;t have an account? <Link href="/register" style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>Register here →</Link>
        </p>
        <div className="card mt-2" style={{ background: 'var(--bg-secondary)', padding: '1rem', fontSize: '0.8rem' }}>
          <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Demo Credentials:</p>
          <p><strong>Admin:</strong> admin@tellorashop.com / admin123</p>
          <p><strong>Customer:</strong> customer@demo.com / customer123</p>
        </div>
      </div>
    </div>
  );
}
