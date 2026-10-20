'use client';
import React, { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';

export default function ContactPage() {
  const { storeName, email: storeEmail, phone, address } = useSettings();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', website: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const value = (key: 'name' | 'email') => form[key] || (key === 'name' ? user?.name : user?.email) || '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, name: value('name'), email: value('email') }) });
      const data = await res.json();
      if (res.ok) setSent(true); else setError(data.error || 'Could not send your message');
    } catch { setError('Network error. Please try again.'); }
    setLoading(false);
  };

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem', maxWidth: '1000px' }}>
      <div className="brutal-badge-slanted brutal-badge-green" style={{ marginBottom: '1rem' }}>GET IN TOUCH</div>
      <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontStyle: 'italic', fontWeight: 900, marginBottom: '2rem' }}>
        CONTACT <span style={{ color: 'var(--accent-purple)' }}>US</span>
      </h1>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card" style={{ border: '3.5px solid #000', boxShadow: '5px 5px 0 #000', padding: '1.5rem', background: '#FFF' }}>
          {sent ? (
            <div role="status" style={{ textAlign: 'center', padding: '2rem 0' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>MESSAGE SENT</h3>
              <p style={{ fontWeight: 600 }}>Thanks for reaching out. We will reply to your email as soon as we can.</p>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="input-group"><label htmlFor="ct-name">Your name *</label><input id="ct-name" className="input" required autoComplete="name" value={value('name')} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="input-group"><label htmlFor="ct-email">Email *</label><input id="ct-email" className="input" type="email" required autoComplete="email" value={value('email')} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="input-group"><label htmlFor="ct-subject">Subject</label><input id="ct-subject" className="input" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Order question, product help…" /></div>
              <div className="input-group"><label htmlFor="ct-message">Message *</label><textarea id="ct-message" className="input" rows={6} required minLength={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} /></div>
              {/* Honeypot: hidden from people, bots tend to fill it in */}
              <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }} />
              {error && <p role="alert" style={{ color: 'var(--accent-red)', fontWeight: 800, marginBottom: '1rem' }}>{error}</p>}
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>{loading ? 'SENDING…' : 'SEND MESSAGE →'}</button>
            </form>
          )}
        </div>

        <div className="card" style={{ border: '3.5px solid #000', boxShadow: '5px 5px 0 #000', padding: '1.5rem', background: 'var(--accent-yellow)' }}>
          <h3 style={{ fontStyle: 'italic', marginBottom: '1rem' }}>{storeName.toUpperCase()}</h3>
          <div style={{ display: 'grid', gap: '0.9rem', fontWeight: 700 }}>
            {storeEmail && <div><small>EMAIL</small><div><a href={`mailto:${storeEmail}`} style={{ textDecoration: 'underline' }}>{storeEmail}</a></div></div>}
            {phone && <div><small>PHONE</small><div><a href={`tel:${phone.replace(/[^+\d]/g, '')}`} style={{ textDecoration: 'underline' }}>{phone}</a></div></div>}
            {address && <div><small>ADDRESS</small><div style={{ whiteSpace: 'pre-line' }}>{address}</div></div>}
            <div><small>ORDER HELP</small><div>Use the <a href="/track-order" style={{ textDecoration: 'underline' }}>order tracking page</a> or check the <a href="/faq" style={{ textDecoration: 'underline' }}>FAQ</a>.</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
