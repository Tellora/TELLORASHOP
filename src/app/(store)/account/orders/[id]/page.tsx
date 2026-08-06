'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface OrderDetail { id: string; order_number: string; status: string; total: number; subtotal: number; tax: number; shipping_cost: number; discount: number; created_at: string; payment_status: string; payment_method: string; tracking_number: string; shipping_address: string; }
interface OrderItem { id: string; name: string; price: number; quantity: number; total: number; product_id: string; }

export default function OrderDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setOrder(d.order); setItems(d.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id, token]);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!order) return <div className="empty-state"><h3>Order not found</h3></div>;

  const address = (() => { try { return JSON.parse(order.shipping_address); } catch { return null; } })();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-mono)' }}>ORDER {order.order_number}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(order.created_at).toLocaleString()}</p>
        </div>
        <span className={`badge status-${order.status}`} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>{order.status.toUpperCase()}</span>
      </div>

      <div className="card mb-2">
        <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>ORDER ITEMS</h3>
        {items.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #eee' }}>
            <div><Link href={`/product/${item.product_id}`} style={{ fontWeight: 700 }}>{item.name}</Link><span style={{ color: 'var(--text-muted)' }}> × {item.quantity}</span></div>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>${item.total.toFixed(2)}</span>
          </div>
        ))}
        <div style={{ marginTop: '1rem', borderTop: '3px solid var(--border-color)', paddingTop: '1rem' }}>
          <div className="checkout-summary-row"><span>Subtotal</span><span style={{ fontFamily: 'var(--font-mono)' }}>${order.subtotal.toFixed(2)}</span></div>
          {order.discount > 0 && <div className="checkout-summary-row"><span>Discount</span><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>-${order.discount.toFixed(2)}</span></div>}
          <div className="checkout-summary-row"><span>Shipping</span><span style={{ fontFamily: 'var(--font-mono)' }}>{order.shipping_cost === 0 ? 'FREE' : `$${order.shipping_cost.toFixed(2)}`}</span></div>
          <div className="checkout-summary-row"><span>Tax</span><span style={{ fontFamily: 'var(--font-mono)' }}>${order.tax.toFixed(2)}</span></div>
          <div className="checkout-summary-row checkout-summary-total"><span>Total</span><span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: 'var(--accent-pink)' }}>${order.total.toFixed(2)}</span></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {address && (
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>SHIPPING ADDRESS</h3>
            <p>{address.firstName} {address.lastName}</p>
            <p>{address.street}</p>
            <p>{address.city}, {address.state} {address.zip}</p>
          </div>
        )}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>PAYMENT</h3>
          <p>Method: {order.payment_method}</p>
          <p>Status: <span className={`badge ${order.payment_status === 'paid' ? 'badge-green' : 'badge-orange'}`}>{order.payment_status}</span></p>
          {order.tracking_number && <p style={{ marginTop: '0.5rem' }}>Tracking: <strong>{order.tracking_number}</strong></p>}
        </div>
      </div>

      <Link href="/account/orders" className="btn mt-2">← BACK TO ORDERS</Link>
    </div>
  );
}
