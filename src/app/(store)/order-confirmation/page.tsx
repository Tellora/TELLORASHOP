'use client';
import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') || 'N/A';

  return (
    <div className="container section" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '4rem 1rem' }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 900 }}>ORDER CONFIRMED</div>
      <h1 style={{ fontFamily: 'var(--font-mono)', marginBottom: '1rem' }}>ORDER CONFIRMED!</h1>
      <div className="card card-yellow" style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>ORDER NUMBER</p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700 }}>{orderNumber}</p>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.7 }}>
        Thank you for your order! We&apos;ve received your order and are getting it ready.
        You&apos;ll receive a confirmation email shortly with your order details and tracking information.
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/account/orders" className="btn btn-primary">VIEW MY ORDERS</Link>
        <Link href="/shop" className="btn">CONTINUE SHOPPING →</Link>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return <Suspense fallback={<div className="loading-spinner"><div className="spinner" /></div>}><ConfirmationContent /></Suspense>;
}
