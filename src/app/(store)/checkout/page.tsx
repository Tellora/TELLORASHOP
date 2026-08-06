'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');

  const [shipping, setShipping] = useState({
    firstName: '', lastName: '', street: '', city: '', state: '', zip: '', country: 'US', phone: '', email: user?.email || '',
  });

  const [payment, setPayment] = useState({ method: 'card', cardNumber: '', expiry: '', cvv: '', nameOnCard: '' });

  const shippingCost = subtotal >= 75 ? 0 : 9.99;
  const afterDiscount = subtotal - discount;
  const tax = afterDiscount * 0.085;
  const total = afterDiscount + shippingCost + tax;

  const applyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.toUpperCase(), subtotal }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setDiscount(data.discount);
        setCouponMsg(`Coupon applied! -$${data.discount.toFixed(2)}`);
      } else {
        setCouponMsg(data.error || 'Invalid coupon');
        setDiscount(0);
      }
    } catch { setCouponMsg('Error validating coupon'); }
  };

  const placeOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
          shipping_address: shipping,
          payment_method: payment.method,
          coupon_code: couponCode || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        clearCart();
        showToast('Order placed successfully!');
        router.push(`/order-confirmation?order=${data.orderNumber}`);
      } else {
        showToast(data.error || 'Error placing order', 'error');
      }
    } catch { showToast('Error placing order', 'error'); }
    setLoading(false);
  };

  if (items.length === 0) {
    return <div className="container section"><div className="empty-state"><div className="empty-state-icon" style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '2rem', color: '#ccc' }}>EMPTY</div><h3>Your cart is empty</h3><Link href="/shop" className="btn btn-primary mt-2">SHOP NOW</Link></div></div>;
  }

  return (
    <div className="container" style={{ padding: '3rem 0 5rem' }}>
      <div className="brutal-badge-slanted brutal-badge-green" style={{ marginBottom: '1rem' }}>
        SECURE CHECKOUT
      </div>
      <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontStyle: 'italic', fontWeight: 900, marginBottom: '2rem' }}>
        FINAL <span style={{ color: 'var(--accent-yellow)' }}>CHECKOUT</span>
      </h1>

      {/* Step Indicators */}
      <div className="checkout-steps" style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        <div className={`checkout-step ${step >= 1 ? 'active' : ''}`} style={{ flex: 1, padding: '0.85rem 1.25rem', border: '3px solid #000', borderRadius: '8px', background: step >= 1 ? 'var(--accent-yellow)' : '#FFF', boxShadow: step >= 1 ? '3px 3px 0px #000' : 'none', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', textAlign: 'center' }}>
          1. Shipping Address
        </div>
        <div className={`checkout-step ${step >= 2 ? 'active' : ''}`} style={{ flex: 1, padding: '0.85rem 1.25rem', border: '3px solid #000', borderRadius: '8px', background: step >= 2 ? 'var(--accent-yellow)' : '#FFF', boxShadow: step >= 2 ? '3px 3px 0px #000' : 'none', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', textAlign: 'center' }}>
          2. Payment Details
        </div>
        <div className={`checkout-step ${step >= 3 ? 'active' : ''}`} style={{ flex: 1, padding: '0.85rem 1.25rem', border: '3px solid #000', borderRadius: '8px', background: step >= 3 ? 'var(--accent-yellow)' : '#FFF', boxShadow: step >= 3 ? '3px 3px 0px #000' : 'none', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', textAlign: 'center' }}>
          3. Final Review
        </div>
      </div>

      <div className="checkout-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2.5rem' }}>
        <div>
          {step === 1 && (
            <div className="card" style={{ border: '3.5px solid #000', boxShadow: '6px 6px 0px #000', borderRadius: '16px', padding: '2rem', background: '#FFF' }}>
              <h3 style={{ marginBottom: '1.5rem', fontStyle: 'italic', fontSize: '1.5rem' }}>SHIPPING ADDRESS</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                <div className="input-group"><label>First Name *</label><input className="input" value={shipping.firstName} onChange={e => setShipping(p => ({ ...p, firstName: e.target.value }))} required /></div>
                <div className="input-group"><label>Last Name *</label><input className="input" value={shipping.lastName} onChange={e => setShipping(p => ({ ...p, lastName: e.target.value }))} required /></div>
              </div>
              <div className="input-group"><label>Email Address *</label><input className="input" type="email" value={shipping.email} onChange={e => setShipping(p => ({ ...p, email: e.target.value }))} required /></div>
              <div className="input-group"><label>Phone Number</label><input className="input" value={shipping.phone} onChange={e => setShipping(p => ({ ...p, phone: e.target.value }))} /></div>
              <div className="input-group"><label>Street Address *</label><input className="input" value={shipping.street} onChange={e => setShipping(p => ({ ...p, street: e.target.value }))} required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0 1rem' }}>
                <div className="input-group"><label>City *</label><input className="input" value={shipping.city} onChange={e => setShipping(p => ({ ...p, city: e.target.value }))} required /></div>
                <div className="input-group"><label>State *</label><input className="input" value={shipping.state} onChange={e => setShipping(p => ({ ...p, state: e.target.value }))} required /></div>
                <div className="input-group"><label>ZIP Code *</label><input className="input" value={shipping.zip} onChange={e => setShipping(p => ({ ...p, zip: e.target.value }))} required /></div>
              </div>
              <button className="btn btn-primary btn-lg btn-full" onClick={() => {
                if (shipping.firstName && shipping.lastName && shipping.street && shipping.city && shipping.state && shipping.zip) setStep(2);
                else showToast('Please fill all required fields', 'error');
              }} style={{ boxShadow: '4px 4px 0px #000' }}>CONTINUE TO PAYMENT →</button>
            </div>
          )}

          {step === 2 && (
            <div className="card" style={{ border: '3.5px solid #000', boxShadow: '6px 6px 0px #000', borderRadius: '16px', padding: '2rem', background: '#FFF' }}>
              <h3 style={{ marginBottom: '1.5rem', fontStyle: 'italic', fontSize: '1.5rem' }}>SELECT PAYMENT METHOD</h3>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem' }}>
                {[
                  { key: 'card', title: 'Credit Card' },
                  { key: 'paypal', title: 'PayPal' },
                  { key: 'cod', title: 'Cash On Delivery' },
                ].map(m => (
                  <button key={m.key} className={`btn ${payment.method === m.key ? 'btn-primary' : ''}`} onClick={() => setPayment(p => ({ ...p, method: m.key }))} style={{ flex: 1, border: '2.5px solid #000', padding: '0.75rem', fontWeight: 800 }}>
                    {m.title}
                  </button>
                ))}
              </div>
              {payment.method === 'card' && (
                <>
                  <div className="input-group"><label>Card Number</label><input className="input" placeholder="4242 •••• •••• 4242" value={payment.cardNumber} onChange={e => setPayment(p => ({ ...p, cardNumber: e.target.value }))} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 1rem' }}>
                    <div className="input-group"><label>Expiry</label><input className="input" placeholder="MM/YY" value={payment.expiry} onChange={e => setPayment(p => ({ ...p, expiry: e.target.value }))} /></div>
                    <div className="input-group"><label>CVV</label><input className="input" placeholder="123" value={payment.cvv} onChange={e => setPayment(p => ({ ...p, cvv: e.target.value }))} /></div>
                    <div className="input-group"><label>Cardholder Name</label><input className="input" placeholder="JANE COOPER" value={payment.nameOnCard} onChange={e => setPayment(p => ({ ...p, nameOnCard: e.target.value }))} /></div>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button className="btn" onClick={() => setStep(1)} style={{ border: '2.5px solid #000' }}>← BACK</button>
                <button className="btn btn-primary btn-lg" onClick={() => setStep(3)} style={{ flex: 1, boxShadow: '4px 4px 0px #000' }}>REVIEW ORDER →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="card" style={{ border: '3.5px solid #000', boxShadow: '6px 6px 0px #000', borderRadius: '16px', padding: '2rem', background: '#FFF' }}>
              <h3 style={{ marginBottom: '1.5rem', fontStyle: 'italic', fontSize: '1.5rem' }}>FINAL ORDER REVIEW</h3>
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', border: '2px solid #000', borderRadius: '8px', marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 900 }}>Shipping Address</h4>
                <p style={{ fontWeight: 800 }}>{shipping.firstName} {shipping.lastName}</p>
                <p>{shipping.street}, {shipping.city}, {shipping.state} {shipping.zip}</p>
                {shipping.phone && <p>Tel: {shipping.phone}</p>}
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', border: '2px solid #000', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 900 }}>Payment Method</h4>
                <p style={{ fontWeight: 800 }}>{payment.method === 'card' ? `Credit Card (ending in ${payment.cardNumber.slice(-4) || '4242'})` : payment.method === 'paypal' ? 'PayPal Checkout' : 'Cash on Delivery'}</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn" onClick={() => setStep(2)} style={{ border: '2.5px solid #000' }}>← BACK</button>
                <button className="btn btn-primary btn-lg" onClick={placeOrder} disabled={loading} style={{ flex: 1, boxShadow: '4px 4px 0px #000' }}>
                  {loading ? 'PROCESSING...' : `PLACE ORDER — $${total.toFixed(2)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ORDER SUMMARY */}
        <div className="checkout-summary">
          <div className="card card-yellow" style={{ border: '3.5px solid #000', boxShadow: '6px 6px 0px #000', borderRadius: '16px', padding: '2rem' }}>
            <h3 style={{ fontStyle: 'italic', marginBottom: '1.25rem', fontSize: '1.4rem' }}>ORDER ITEMS ({items.length})</h3>
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1.25rem', paddingRight: '0.25rem' }}>
              {items.map(item => (
                <div key={item.product_id} className="checkout-summary-item" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem', paddingBottom: '0.65rem', borderBottom: '1px dashed #000' }}>
                  <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 800 }}>{item.name} <span style={{ color: '#444', fontFamily: 'var(--font-mono)' }}>× {item.quantity}</span></span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.85rem' }}>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Coupon Application Box */}
            <div style={{ borderTop: '2.5px solid #000', paddingTop: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  className="input"
                  placeholder="COUPON CODE"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  style={{ textTransform: 'uppercase', fontSize: '0.8rem', padding: '0.5rem', background: '#FFF' }}
                />
                <button className="btn btn-sm btn-dark" onClick={applyCoupon} style={{ padding: '0.5rem 0.85rem' }}>APPLY</button>
              </div>
              {couponMsg && (
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: discount > 0 ? 'green' : 'var(--accent-red)', marginTop: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                  {couponMsg}
                </div>
              )}
            </div>

            <div style={{ borderTop: '2.5px solid #000', paddingTop: '1rem' }}>
              <div className="checkout-summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 700 }}>
                <span>Subtotal</span><span style={{ fontFamily: 'var(--font-mono)' }}>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="checkout-summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 700, color: 'green' }}>
                  <span>Discount</span><span style={{ fontFamily: 'var(--font-mono)' }}>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="checkout-summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 700 }}>
                <span>Shipping</span><span style={{ fontFamily: 'var(--font-mono)' }}>{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
              </div>
              <div className="checkout-summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 700 }}>
                <span>Tax (8.5%)</span><span style={{ fontFamily: 'var(--font-mono)' }}>${tax.toFixed(2)}</span>
              </div>
              <div className="checkout-summary-row checkout-summary-total" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '3px solid #000', paddingTop: '1rem', fontWeight: 900, fontSize: '1.25rem' }}>
                <span>TOTAL</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', color: '#000' }}>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
