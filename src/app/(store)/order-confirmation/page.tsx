'use client';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const orderNumber = searchParams.get('order') || '';
  const sessionId = searchParams.get('session_id');
  // 'checking' only applies to card payments, which are verified with the payment provider
  const [state, setState] = useState<'checking' | 'paid' | 'unpaid' | 'ok'>(sessionId ? 'checking' : 'ok');
  const verified = useRef(false);

  useEffect(() => {
    if (!sessionId || verified.current) return;
    verified.current = true;
    fetch(`/api/orders/verify?session_id=${encodeURIComponent(sessionId)}`)
      .then(r => r.json())
      .then(d => {
        if (d.order?.payment_status === 'paid') { clearCart(); setState('paid'); } else setState('unpaid');
      })
      .catch(() => setState('unpaid'));
  }, [sessionId, clearCart]);

  if (state === 'checking') {
    return <div className="container section" style={{ textAlign: 'center' }}><div className="loading-spinner"><div className="spinner" /></div><p style={{ fontWeight: 800 }}>Confirming your payment…</p></div>;
  }

  return (
    <div className="container section" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', paddingTop: '4rem', paddingBottom: '4rem' }}>
      {state === 'unpaid' ? (
        <>
          <h1 style={{ fontFamily: 'var(--font-mono)', marginBottom: '1rem' }}>PAYMENT PENDING</h1>
          <p style={{ marginBottom: '2rem', lineHeight: 1.7 }}>
            We have not received confirmation of your payment yet. If you were charged, your order will be confirmed shortly and you will get an email.
            Otherwise you can <Link href="/checkout" style={{ textDecoration: 'underline' }}>try again</Link>.
          </p>
        </>
      ) : (
        <>
          <h1 style={{ fontFamily: 'var(--font-mono)', marginBottom: '1rem' }}>ORDER CONFIRMED!</h1>
          {orderNumber && (
            <div className="card card-yellow" style={{ marginBottom: '2rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>ORDER NUMBER</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700 }}>{orderNumber}</p>
            </div>
          )}
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.7 }}>
            Thank you for your order! We&apos;ve received it and are getting it ready. A confirmation email is on its way with your order details.
            Keep your order number handy: you can use it with your email on the <Link href="/track-order" style={{ textDecoration: 'underline' }}>tracking page</Link>.
          </p>
        </>
      )}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/account/orders" className="btn btn-primary">VIEW MY ORDERS</Link>
        <Link href="/track-order" className="btn">TRACK ORDER</Link>
        <Link href="/shop" className="btn">CONTINUE SHOPPING →</Link>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return <Suspense fallback={<div className="loading-spinner"><div className="spinner" /></div>}><ConfirmationContent /></Suspense>;
}
