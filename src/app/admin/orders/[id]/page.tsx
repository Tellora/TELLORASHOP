'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';

interface OrderDetail {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  discount: number;
  total: number;
  shipping_address: string;
  billing_address: string;
  payment_method: string;
  payment_status: string;
  tracking_number: string;
  notes: string;
  coupon_code: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  image: string;
}

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const { showToast } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrder = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        setItems(data.items || []);
        setStatus(data.order.status);
        setPaymentStatus(data.order.payment_status);
        setTrackingNumber(data.order.tracking_number || '');
        setNotes(data.order.notes || '');
      } else {
        showToast('Order not found', 'error');
        router.push('/admin/orders');
      }
    } catch {
      showToast('Error fetching order', 'error');
    }
    setLoading(false);
  }, [id, token, showToast, router]);

  useEffect(() => {
    if (token) fetchOrder();
  }, [token, fetchOrder]);

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          payment_status: paymentStatus,
          tracking_number: trackingNumber,
          notes
        })
      });
      if (res.ok) {
        showToast('Order details updated!');
        fetchOrder();
      } else {
        showToast((await res.json().catch(() => ({}))).error || 'Failed to update order', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
    setUpdating(false);
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!order) return <div className="card text-center p-3">Order not found.</div>;

  const shipAddr = (() => {
    try { return JSON.parse(order.shipping_address); }
    catch { return { firstName: '', lastName: '', street: '', city: '', state: '', zip: '', country: 'US', phone: '' }; }
  })();

  const printInvoice = () => {
    window.print();
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <Link href="/admin/orders" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>
            ← BACK TO ORDERS
          </Link>
          <h1 className="admin-page-title">ORDER {order.order_number}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Placed on {new Date(order.created_at).toLocaleString()}</p>
        </div>
        <button onClick={printInvoice} className="btn btn-blue">
          PRINT INVOICE
        </button>
      </div>

      <div className="checkout-layout">
        {/* Left Side: Order Items and Addresses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Order Items card */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-mono)', marginBottom: '1rem' }}>LINE ITEMS</h3>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>${item.price.toFixed(2)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{item.quantity}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Totals */}
            <div style={{ marginTop: '1.5rem', borderTop: '3px solid var(--border-color)', paddingTop: '1rem' }}>
              <div className="checkout-summary-row">
                <span>Subtotal</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>${order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="checkout-summary-row" style={{ color: 'var(--accent-green)' }}>
                  <span>Discount {order.coupon_code && `(${order.coupon_code})`}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="checkout-summary-row">
                <span>Shipping Cost</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{order.shipping_cost === 0 ? 'FREE' : `$${order.shipping_cost.toFixed(2)}`}</span>
              </div>
              <div className="checkout-summary-row">
                <span>Tax</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>${order.tax.toFixed(2)}</span>
              </div>
              <div className="checkout-summary-row checkout-summary-total">
                <span>Total Amount</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-pink)', fontSize: '1.4rem' }}>
                  ${order.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Shipping & Billing */}
          <div className="grid grid-2">
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-mono)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>SHIPPING ADDRESS</h3>
              <p style={{ fontWeight: 600 }}>{shipAddr.firstName} {shipAddr.lastName}</p>
              <p>{shipAddr.street}</p>
              <p>{shipAddr.city}, {shipAddr.state} {shipAddr.zip}</p>
              <p>{shipAddr.country}</p>
              {shipAddr.phone && <p style={{ marginTop: '0.5rem' }}>Tel: {shipAddr.phone}</p>}
            </div>

            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-mono)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>CUSTOMER DETAILS</h3>
              <p style={{ fontWeight: 600 }}>{order.customer_name || 'Guest checkout'}</p>
              <p style={{ color: 'var(--text-secondary)' }}>{order.customer_email}</p>
              {order.customer_phone && <p>Phone: {order.customer_phone}</p>}
              <p style={{ marginTop: '0.5rem' }}>Payment Method: <span className="badge">{order.payment_method}</span></p>
            </div>
          </div>
        </div>

        {/* Right Side: Order Controls / Fulfillment Updater */}
        <div className="checkout-summary">
          <div className="card card-yellow" style={{ position: 'sticky', top: '90px' }}>
            <h3 style={{ fontFamily: 'var(--font-mono)', marginBottom: '1.25rem' }}>MANAGE ORDER</h3>
            
            <form onSubmit={handleUpdateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label>Fulfillment Status</label>
                <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div className="input-group">
                <label>Payment Status</label>
                <select className="input" value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div className="input-group">
                <label>Tracking Number</label>
                <input
                  className="input"
                  placeholder="Carrier / Tracking Link"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>Internal Notes / Customer Message</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Order notes..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-dark btn-full mt-1" disabled={updating}>
                {updating ? 'SAVING...' : 'UPDATE ORDER STATUS'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
