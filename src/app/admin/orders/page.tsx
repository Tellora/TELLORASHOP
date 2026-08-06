'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  item_count: number;
}

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch {
      showToast('Error loading orders', 'error');
    }
    setLoading(false);
  }, [token, statusFilter, showToast]);

  useEffect(() => {
    if (token) fetchOrders();
  }, [token, fetchOrders]);

  const filteredOrders = orders.filter(o => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(s) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(s)) ||
      (o.customer_email && o.customer_email.toLowerCase().includes(s))
    );
  });

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        showToast(`Order status updated to ${newStatus.toUpperCase()}`);
      } else {
        showToast('Failed to update order status', 'error');
      }
    } catch {
      showToast('Error updating order status', 'error');
    }
  };

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div className="brutal-badge-slanted brutal-badge-green" style={{ marginBottom: '0.5rem' }}>
            SALES & FULFILLMENT
          </div>
          <h1 className="admin-page-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontStyle: 'italic', fontWeight: 900, margin: 0 }}>
            CUSTOMER <span style={{ color: 'var(--accent-purple)' }}>ORDERS</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginTop: '0.25rem' }}>
            Track sales transactions, payment status, and update order fulfillment stages.
          </p>
        </div>
      </div>

      {/* Toolbar & Filter Tabs */}
      <div className="shop-toolbar mb-2" style={{ background: '#FFF', border: '3px solid #000', borderRadius: '8px', boxShadow: '3px 3px 0px #000', padding: '0.85rem 1.25rem', marginBottom: '1.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <input
          className="input"
          style={{ maxWidth: '320px', boxShadow: 'none', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
          placeholder="SEARCH ORDER # OR CUSTOMER..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '0.4rem 0.75rem', border: '2px solid #000', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}
            >
              {st || 'ALL ORDERS'}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : filteredOrders.length === 0 ? (
        <div className="card text-center p-3" style={{ background: '#FFF', border: '3px solid #000', borderRadius: '12px' }}>No orders found.</div>
      ) : (
        <div className="admin-table-wrapper" style={{ border: '3.5px solid #000', borderRadius: '12px', boxShadow: '5px 5px 0px #000', background: '#FFF', overflow: 'hidden' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '3px solid #000' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>ORDER #</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>DATE</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>CUSTOMER</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>ITEMS</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>TOTAL</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>PAYMENT</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>FULFILLMENT STATUS</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(o => (
                <tr key={o.id} style={{ borderBottom: '2px solid #EEE' }}>
                  <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.95rem' }}>
                    <Link href={`/admin/orders/${o.id}`} style={{ color: 'var(--accent-purple)', textDecoration: 'underline' }}>
                      {o.order_number}
                    </Link>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{o.customer_name || 'Guest'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{o.customer_email}</div>
                  </td>
                  <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.85rem' }}>{o.item_count} items</td>
                  <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1rem' }}>${o.total.toFixed(2)}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${o.payment_status === 'paid' ? 'badge-green' : 'badge-orange'}`} style={{ transform: 'none' }}>
                      {o.payment_status?.toUpperCase() || 'PAID'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <select
                      className="input"
                      value={o.status}
                      onChange={e => handleStatusChange(o.id, e.target.value)}
                      style={{ padding: '0.35rem 1.75rem 0.35rem 0.65rem', fontSize: '0.8rem', fontWeight: 800, width: 'auto', boxShadow: 'none', border: '2px solid #000', background: o.status === 'delivered' ? '#E8F5E9' : o.status === 'shipped' ? '#E3F2FD' : '#FFFDE7' }}
                    >
                      <option value="pending">PENDING</option>
                      <option value="processing">PROCESSING</option>
                      <option value="shipped">SHIPPED</option>
                      <option value="delivered">DELIVERED</option>
                      <option value="cancelled">CANCELLED</option>
                    </select>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <Link href={`/admin/orders/${o.id}`} className="btn btn-sm btn-dark" style={{ padding: '0.35rem 0.75rem' }}>
                      DETAILS ➔
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

