'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';

/** When maintenance mode is on, shoppers see a "back soon" screen. Admins and the login page stay reachable. */
export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { maintenance, storeName, email } = useSettings();
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (!maintenance || pathname === '/login') return <>{children}</>;
  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (user?.role === 'admin') {
    return (
      <>
        <div style={{ background: 'var(--accent-red)', color: '#FFF', textAlign: 'center', padding: '0.5rem', fontWeight: 900, fontSize: '0.8rem' }}>
          MAINTENANCE MODE IS ON. Only admins can see the store.
        </div>
        {children}
      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--accent-yellow)', textAlign: 'center' }}>
      <div style={{ maxWidth: '560px', background: '#FFF', border: '4px solid #000', boxShadow: '8px 8px 0 #000', borderRadius: '16px', padding: '2.5rem' }}>
        <h1 style={{ fontStyle: 'italic', fontWeight: 900, fontSize: '2.2rem', marginBottom: '1rem' }}>BACK SOON</h1>
        <p style={{ fontWeight: 700, lineHeight: 1.6 }}>{storeName} is getting a quick upgrade. Please check back shortly.</p>
        {email && <p style={{ marginTop: '1rem', fontWeight: 700 }}>Questions? <a href={`mailto:${email}`} style={{ textDecoration: 'underline' }}>{email}</a></p>}
        <p style={{ marginTop: '1.5rem', fontSize: '0.8rem' }}><Link href="/login" style={{ textDecoration: 'underline' }}>Staff login</Link></p>
      </div>
    </div>
  );
}
