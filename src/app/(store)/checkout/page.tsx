'use client';
import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useSettings, useMoney } from '@/context/SettingsContext';

interface SavedAddress {
  id: string; label: string; first_name: string; last_name: string; street: string; city: string; state: string; zip: string; country: string; phone: string; is_default: number;
}

const card: React.CSSProperties = { border: '3.5px solid #000', boxShadow: '6px 6px 0px #000', borderRadius: '16px', padding: '2rem', background: '#FFF' };
const stepStyle = (active: boolean): React.CSSProperties => ({ flex: 1, padding: '0.85rem 1.25rem', border: '3px solid #000', borderRadius: '8px', background: active ? 'var(--accent-yellow)' : '#FFF', fontWeight: 800, textAlign: 'center' });
const choice = (selected: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1rem', border: '3px solid #000', borderRadius: '10px', background: selected ? 'var(--accent-yellow)' : '#FFF', cursor: 'pointer', fontWeight: 800, boxShadow: selected ? '3px 3px 0 #000' : 'none' });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function CheckoutContent() {
  const { items, subtotal, clearCart } = useCart();
  const { user, token } = useAuth();
  const settings = useSettings();
  const money = useMoney();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);

  const [shipping, setShipping] = useState({
    firstName: '', lastName: '', street: '', city: '', state: '', zip: '', country: 'US', phone: '', email: '',
  });
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const defaultMethod = settings.codEnabled ? 'cod' : settings.cardEnabled ? 'card' : 'cod';
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>(defaultMethod);

  const applyAddress = (a: SavedAddress) =>
    setShipping(s => ({ ...s, firstName: a.first_name || s.firstName, lastName: a.last_name || s.lastName, street: a.street, city: a.city, state: a.state, zip: a.zip, country: a.country || 'US', phone: a.phone || s.phone }));

  // Back from a cancelled card payment: free the stock held for that unpaid order
  const cancelledOrder = searchParams.get('cancelled');
  useEffect(() => {
    if (cancelledOrder) {
      fetch('/api/orders/abandon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_number: cancelledOrder }) }).catch(() => {});
    }
  }, [cancelledOrder]);

  // Prefill from the signed-in account and saved addresses
  useEffect(() => {
    if (!user) return;
    const [first, ...rest] = (user.name || '').split(' ');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShipping(s => ({ ...s, email: s.email || user.email, firstName: s.firstName || first || '', lastName: s.lastName || rest.join(' ') }));
  }, [user]);

  useEffect(() => {
    if (!token) return;
    fetch('/api/addresses', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : { addresses: [] }))
      .then(d => {
        const list: SavedAddress[] = d.addresses || [];
        setAddresses(list);
        const def = list.find(a => a.is_default) || list[0];
        if (def) applyAddress(def);
      })
      .catch(() => {});
  }, [token]);

  const freeShipping = settings.freeShippingThreshold > 0 && subtotal - discount >= settings.freeShippingThreshold;
  const shippingCost = shippingMethod === 'express' ? settings.shippingExpress : freeShipping ? 0 : settings.shippingFlat;
  const afterDiscount = Math.max(0, subtotal - discount);
  const tax = afterDiscount * (settings.taxRate / 100);
  const total = afterDiscount + shippingCost + tax;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim().toUpperCase(), subtotal }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setDiscount(data.discount);
        setAppliedCoupon(couponCode.trim().toUpperCase());
        setCouponMsg(`Coupon applied! -${money(data.discount)}`);
      } else {
        setCouponMsg(data.error || 'Invalid coupon');
        setDiscount(0);
        setAppliedCoupon('');
      }
    } catch { setCouponMsg('Error validating coupon'); }
  };

  const validateShipping = (): string => {
    const { firstName, lastName, street, city, state, zip, email } = shipping;
    if (![firstName, lastName, street, city, state, zip].every(v => v.trim())) return 'Please fill in all required fields';
    if (!EMAIL_RE.test(email.trim())) return 'Please enter a valid email address';
    return '';
  };

  const placeOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
          shipping_address: { ...shipping, email: shipping.email.trim() },
          shipping_method: shippingMethod,
          payment_method: paymentMethod,
          coupon_code: appliedCoupon || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error placing order'); setLoading(false); return; }
      // Card orders keep the cart until payment succeeds (the confirmation page clears it)
      if (data.checkoutUrl) { window.location.href = data.checkoutUrl; return; }
      clearCart();
      router.push(`/order-confirmation?order=${data.orderNumber}`);
    } catch {
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container section">
        <div className="empty-state" style={{ textAlign: 'center' }}>
          <div className="empty-state-icon" style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '2rem', color: '#ccc' }}>EMPTY</div>
          <h3>Your cart is empty</h3>
          <Link href="/shop" className="btn btn-primary mt-2">CONTINUE SHOPPING</Link>
        </div>
      </div>
    );
  }

  const set = (key: keyof typeof shipping) => (e: React.ChangeEvent<HTMLInputElement>) => setShipping(s => ({ ...s, [key]: e.target.value }));
  const nothingAvailable = !settings.codEnabled && !settings.cardEnabled;

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      <div className="brutal-badge-slanted brutal-badge-green" style={{ marginBottom: '1rem' }}>SECURE CHECKOUT</div>
      <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontStyle: 'italic', fontWeight: 900, marginBottom: '2rem' }}>
        FINAL <span style={{ color: 'var(--accent-yellow)' }}>CHECKOUT</span>
      </h1>

      {searchParams.get('cancelled') && (
        <div role="status" style={{ background: 'var(--accent-yellow)', border: '3px solid #000', padding: '0.85rem 1.25rem', marginBottom: '1.5rem', fontWeight: 800 }}>
          Your card payment was cancelled and the order was not completed. Your cart is still here if you want to try again.
        </div>
      )}

      <div className="checkout-steps" style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        <div style={stepStyle(step >= 1)}>1. Shipping</div>
        <div style={stepStyle(step >= 2)}>2. Payment</div>
        <div style={stepStyle(step >= 3)}>3. Review</div>
      </div>

      <div className="checkout-layout" style={{ padding: 0 }}>
        <div>
          {step === 1 && (
            <div className="card" style={card}>
              <h3 style={{ marginBottom: '1.5rem', fontStyle: 'italic', fontSize: '1.5rem' }}>SHIPPING DETAILS</h3>

              {!user && (
                <p style={{ marginBottom: '1.25rem', fontWeight: 700 }}>
                  Have an account? <Link href="/login?redirect=/checkout" style={{ textDecoration: 'underline' }}>Log in</Link> for faster checkout, or continue as a guest.
                </p>
              )}

              {addresses.length > 0 && (
                <div className="input-group">
                  <label>Use a saved address</label>
                  <select className="input" defaultValue={(addresses.find(a => a.is_default) || addresses[0]).id} onChange={e => { const a = addresses.find(x => x.id === e.target.value); if (a) applyAddress(a); }}>
                    {addresses.map(a => <option key={a.id} value={a.id}>{a.label}: {a.street}, {a.city}</option>)}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                <div className="input-group"><label htmlFor="co-first">First name *</label><input id="co-first" className="input" autoComplete="given-name" value={shipping.firstName} onChange={set('firstName')} /></div>
                <div className="input-group"><label htmlFor="co-last">Last name *</label><input id="co-last" className="input" autoComplete="family-name" value={shipping.lastName} onChange={set('lastName')} /></div>
              </div>
              <div className="input-group"><label htmlFor="co-email">Email address *</label><input id="co-email" className="input" type="email" autoComplete="email" value={shipping.email} onChange={set('email')} placeholder="Order updates are sent here" /></div>
              <div className="input-group"><label htmlFor="co-phone">Phone number</label><input id="co-phone" className="input" type="tel" autoComplete="tel" value={shipping.phone} onChange={set('phone')} /></div>
              <div className="input-group"><label htmlFor="co-street">Street address *</label><input id="co-street" className="input" autoComplete="street-address" value={shipping.street} onChange={set('street')} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0 1rem' }}>
                <div className="input-group"><label htmlFor="co-city">City *</label><input id="co-city" className="input" autoComplete="address-level2" value={shipping.city} onChange={set('city')} /></div>
                <div className="input-group"><label htmlFor="co-state">State *</label><input id="co-state" className="input" autoComplete="address-level1" value={shipping.state} onChange={set('state')} /></div>
                <div className="input-group"><label htmlFor="co-zip">ZIP code *</label><input id="co-zip" className="input" autoComplete="postal-code" value={shipping.zip} onChange={set('zip')} /></div>
              </div>

              <h4 style={{ margin: '1.25rem 0 0.75rem', fontStyle: 'italic' }}>DELIVERY METHOD</h4>
              <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '1.5rem' }}>
                <label style={choice(shippingMethod === 'standard')}>
                  <input type="radio" name="ship" checked={shippingMethod === 'standard'} onChange={() => setShippingMethod('standard')} />
                  <span style={{ flex: 1 }}>Standard <small style={{ fontWeight: 600 }}>({settings.deliveryDays} business days)</small></span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{freeShipping ? 'FREE' : money(settings.shippingFlat)}</span>
                </label>
                {settings.shippingExpress > 0 && (
                  <label style={choice(shippingMethod === 'express')}>
                    <input type="radio" name="ship" checked={shippingMethod === 'express'} onChange={() => setShippingMethod('express')} />
                    <span style={{ flex: 1 }}>Express <small style={{ fontWeight: 600 }}>(1-2 business days)</small></span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{money(settings.shippingExpress)}</span>
                  </label>
                )}
              </div>

              {error && <p role="alert" style={{ color: 'var(--accent-red)', fontWeight: 800, marginBottom: '1rem' }}>{error}</p>}
              <button className="btn btn-primary btn-lg btn-full" onClick={() => {
                const problem = validateShipping();
                if (problem) { setError(problem); return; }
                setError(''); setStep(2);
              }} style={{ boxShadow: '4px 4px 0px #000' }}>CONTINUE TO PAYMENT →</button>
            </div>
          )}

          {step === 2 && (
            <div className="card" style={card}>
              <h3 style={{ marginBottom: '1.5rem', fontStyle: 'italic', fontSize: '1.5rem' }}>PAYMENT METHOD</h3>
              {nothingAvailable ? (
                <p style={{ fontWeight: 800, color: 'var(--accent-red)' }}>No payment methods are available right now. Please contact us to place your order.</p>
              ) : (
                <div style={{ display: 'grid', gap: '0.6rem' }}>
                  {settings.cardEnabled && (
                    <label style={choice(paymentMethod === 'card')}>
                      <input type="radio" name="pay" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                      <span style={{ flex: 1 }}>Credit / debit card <small style={{ fontWeight: 600 }}>(secure payment page)</small></span>
                    </label>
                  )}
                  {settings.codEnabled && (
                    <label style={choice(paymentMethod === 'cod')}>
                      <input type="radio" name="pay" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                      <span style={{ flex: 1 }}>Cash on delivery <small style={{ fontWeight: 600 }}>(pay when it arrives)</small></span>
                    </label>
                  )}
                </div>
              )}
              {paymentMethod === 'card' && settings.cardEnabled && (
                <p style={{ marginTop: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>You will be redirected to our payment provider to enter your card details securely. We never see or store your card number.</p>
              )}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button className="btn" onClick={() => setStep(1)} style={{ border: '2.5px solid #000' }}>← BACK</button>
                <button className="btn btn-primary btn-lg" disabled={nothingAvailable} onClick={() => setStep(3)} style={{ flex: 1, boxShadow: '4px 4px 0px #000' }}>REVIEW ORDER →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="card" style={card}>
              <h3 style={{ marginBottom: '1.5rem', fontStyle: 'italic', fontSize: '1.5rem' }}>FINAL ORDER REVIEW</h3>
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', border: '2px solid #000', borderRadius: '8px', marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 900 }}>Ship to</h4>
                <p style={{ fontWeight: 800 }}>{shipping.firstName} {shipping.lastName}</p>
                <p>{shipping.street}, {shipping.city}, {shipping.state} {shipping.zip}</p>
                <p>{shipping.email}{shipping.phone ? ` · ${shipping.phone}` : ''}</p>
                <p style={{ marginTop: '0.4rem' }}><strong>{shippingMethod === 'express' ? 'Express' : 'Standard'}</strong> delivery</p>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', border: '2px solid #000', borderRadius: '8px', marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 900 }}>Payment</h4>
                <p style={{ fontWeight: 800 }}>{paymentMethod === 'card' ? 'Credit / debit card (secure payment page)' : 'Cash on delivery'}</p>
              </div>
              <div className="input-group">
                <label htmlFor="co-notes">Order notes (optional)</label>
                <textarea id="co-notes" className="input" rows={2} maxLength={500} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Delivery instructions, gift message…" />
              </div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem' }}>
                By placing your order you agree to our <Link href="/page/terms-of-service" style={{ textDecoration: 'underline' }}>Terms of Service</Link> and <Link href="/page/privacy-policy" style={{ textDecoration: 'underline' }}>Privacy Policy</Link>.
              </p>
              {error && <p role="alert" style={{ color: 'var(--accent-red)', fontWeight: 800, marginBottom: '1rem' }}>{error}</p>}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn" onClick={() => setStep(2)} style={{ border: '2.5px solid #000' }}>← BACK</button>
                <button className="btn btn-primary btn-lg" onClick={placeOrder} disabled={loading} style={{ flex: 1, boxShadow: '4px 4px 0px #000' }}>
                  {loading ? 'PROCESSING...' : paymentMethod === 'card' ? `PAY ${money(total)} →` : `PLACE ORDER — ${money(total)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ORDER SUMMARY */}
        <div className="checkout-summary">
          <div className="card card-yellow" style={{ border: '3.5px solid #000', boxShadow: '6px 6px 0px #000', borderRadius: '16px', padding: '2rem' }}>
            <h3 style={{ fontStyle: 'italic', marginBottom: '1.25rem', fontSize: '1.4rem' }}>ORDER ITEMS ({items.length})</h3>
            <div style={{ maxHeight: '220px', overflowY: 'auto', marginBottom: '1.25rem', paddingRight: '0.25rem' }}>
              {items.map(item => (
                <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.65rem', paddingBottom: '0.65rem', borderBottom: '1px dashed #000' }}>
                  <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 800 }}>{item.name} <span style={{ color: '#444', fontFamily: 'var(--font-mono)' }}>× {item.quantity}</span></span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.85rem' }}>{money(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '2.5px solid #000', paddingTop: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input className="input" aria-label="Coupon code" placeholder="COUPON CODE" value={couponCode} onChange={e => setCouponCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyCoupon()} style={{ textTransform: 'uppercase', fontSize: '0.8rem', padding: '0.5rem', background: '#FFF' }} />
                <button className="btn btn-sm btn-dark" onClick={applyCoupon} style={{ padding: '0.5rem 0.85rem' }}>APPLY</button>
              </div>
              {couponMsg && <div style={{ fontSize: '0.75rem', fontWeight: 800, color: discount > 0 ? 'green' : 'var(--accent-red)', marginTop: '0.4rem', fontFamily: 'var(--font-mono)' }}>{couponMsg}</div>}
            </div>

            <div style={{ borderTop: '2.5px solid #000', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 700 }}><span>Subtotal</span><span style={{ fontFamily: 'var(--font-mono)' }}>{money(subtotal)}</span></div>
              {discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 700, color: 'green' }}><span>Discount</span><span style={{ fontFamily: 'var(--font-mono)' }}>-{money(discount)}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 700 }}><span>Shipping</span><span style={{ fontFamily: 'var(--font-mono)' }}>{shippingCost === 0 ? 'FREE' : money(shippingCost)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 700 }}><span>Tax ({settings.taxRate}%)</span><span style={{ fontFamily: 'var(--font-mono)' }}>{money(tax)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '3px solid #000', paddingTop: '1rem', fontWeight: 900, fontSize: '1.2rem' }}>
                <span>TOTAL</span><span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', color: '#000' }}>{money(total)}</span>
              </div>
              <p style={{ fontSize: '0.7rem', fontWeight: 600, marginTop: '0.75rem', color: '#444' }}>Final amounts are confirmed when the order is placed.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="loading-spinner"><div className="spinner" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
