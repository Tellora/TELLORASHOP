'use client';
import React, { useState } from 'react';
import Link from 'next/link';

interface TrackedOrder {
  order_number: string; status: string; subtotal: number; tax: number; shipping_cost: number; discount: number;
  total: number; tracking_number: string | null; created_at: string;
}
interface TrackedItem { name: string; price: number; quantity: number; total: number }

const STEPS = ['confirmed', 'processing', 'shipped', 'delivered'];

const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between' };

export default function TrackOrderPage() {
  const [number, setNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ order: TrackedOrder; items: TrackedItem[] } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch(`/api/orders/track?number=${encodeURIComponent(number)}&email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (res.ok) setResult(data); else setError(data.error || 'Order not found');
    } catch { setError('Something went wrong. Please try again.'); }
    setLoading(false);
  };

  const stepIndex = result ? STEPS.indexOf(result.order.status) : -1;
  const cancelled = result && ['cancelled', 'refunded'].includes(result.order.status);

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem', maxWidth: '800px' }}>
      <div className="brutal-badge-slanted brutal-badge-green" style={{ marginBottom: '1rem' }}>ORDER STATUS</div>
      <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontStyle: 'italic', fontWeight: 900, marginBottom: '2rem' }}>
        TRACK YOUR <span style={{ color: 'var(--accent-purple)' }}>ORDER</span>
      </h1>

      <form onSubmit={submit} className="card" style={{ border: '3.5px solid #000', boxShadow: '5px 5px 0px #000', padding: '1.5rem', marginBottom: '2rem' }}>
        <div className="input-group">
          <label>Order number</label>
          <input className="input" required value={number} onChange={e => setNumber(e.target.value)} placeholder="TS-XXXXXXXX" />
        </div>
        <div className="input-group">
          <label>Email used at checkout</label>
          <input className="input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <button className="btn btn-primary btn-full" type="submit" disabled={loading}>{loading ? 'SEARCHING…' : 'TRACK ORDER →'}</button>
        {error && <p style={{ color: 'var(--accent-red)', fontWeight: 800, marginTop: '1rem' }}>{error}</p>}
      </form>

      {result && (
        <div className="card" style={{ border: '3.5px solid #000', boxShadow: '5px 5px 0px #000', padding: '1.5rem' }}>
          <div style={{ ...row, flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.3rem' }}>{result.order.order_number}</div>
              <div style={{ color: '#666', fontSize: '0.85rem' }}>Placed {new Date(result.order.created_at.replace(' ', 'T') + 'Z').toLocaleDateString()}</div>
            </div>
            <span className={`badge ${cancelled ? 'badge-red' : 'badge-green'}`} style={{ alignSelf: 'flex-start', textTransform: 'uppercase' }}>{result.order.status}</span>
          </div>

          {!cancelled && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {STEPS.map((s, i) => (
                <div key={s} style={{ textAlign: 'center' }}>
                  <div style={{ height: '10px', border: '2px solid #000', background: i <= stepIndex ? 'var(--accent-green)' : '#EEE', marginBottom: '0.4rem' }} />
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: i <= stepIndex ? '#000' : '#999' }}>{s}</span>
                </div>
              ))}
            </div>
          )}

          {result.order.tracking_number && (
            <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, marginBottom: '1.25rem' }}>Tracking number: {result.order.tracking_number}</p>
          )}

          <div style={{ borderTop: '2px solid #000' }}>
            {result.items.map((it, i) => (
              <div key={i} style={{ ...row, padding: '0.7rem 0', borderBottom: '1px dashed #999', fontWeight: 700 }}>
                <span>{it.name} × {it.quantity}</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>${it.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gap: '0.3rem', marginTop: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            <div style={row}><span>Subtotal</span><span>${result.order.subtotal.toFixed(2)}</span></div>
            {result.order.discount > 0 && <div style={row}><span>Discount</span><span>-${result.order.discount.toFixed(2)}</span></div>}
            <div style={row}><span>Shipping</span><span>{result.order.shipping_cost === 0 ? 'FREE' : `$${result.order.shipping_cost.toFixed(2)}`}</span></div>
            <div style={row}><span>Tax</span><span>${result.order.tax.toFixed(2)}</span></div>
            <div style={{ ...row, fontSize: '1.2rem', fontWeight: 900, borderTop: '2px solid #000', paddingTop: '0.5rem' }}><span>Total</span><span>${result.order.total.toFixed(2)}</span></div>
          </div>
        </div>
      )}

      <p style={{ marginTop: '2rem', fontWeight: 700 }}>
        Have an account? <Link href="/account/orders" style={{ textDecoration: 'underline' }}>View all your orders</Link>.
      </p>
    </div>
  );
}
