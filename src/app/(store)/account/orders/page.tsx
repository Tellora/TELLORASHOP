'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Order {
  id: string; order_number: string; status: string; total: number; created_at: string; item_count: number; payment_status: string;
}

export default function AccountOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setOrders(d.orders || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-mono)', marginBottom: '1.5rem' }}>MY ORDERS</h2>
      {orders.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon" style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '2rem', color: '#ccc' }}>ORDERS</div><h3>No orders yet</h3><p>Start shopping to see your orders here.</p><Link href="/shop" className="btn btn-primary">SHOP NOW</Link></div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead><tr><th>Order #</th><th>Date</th><th>Status</th><th>Items</th><th>Total</th><th></th></tr></thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{order.order_number}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td><span className={`badge status-${order.status}`}>{order.status}</span></td>
                  <td>{order.item_count}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>${order.total.toFixed(2)}</td>
                  <td><Link href={`/account/orders/${order.id}`} className="btn btn-sm">VIEW</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
