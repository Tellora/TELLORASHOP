'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const accountLinks = [
  { href: '/account', label: 'Profile', icon: 'USR' },
  { href: '/account/orders', label: 'My Orders', icon: 'ORD' },
  { href: '/account/wishlist', label: 'Wishlist', icon: 'FAV' },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/login'); }
      else { setReady(true); }
    }
  }, [user, loading, router]);

  if (!ready) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="container">
      <div style={{ padding: '2rem 0 1rem' }}>
        <h1 style={{ fontFamily: 'var(--font-mono)' }}>MY ACCOUNT</h1>
        <p style={{ color: 'var(--text-muted)' }}>Welcome back, {user?.name}!</p>
      </div>
      <div className="account-layout">
        <nav className="account-nav">
          {accountLinks.map(link => (
            <Link key={link.href} href={link.href} className={`account-nav-link ${pathname === link.href ? 'active' : ''}`}>
              <span>{link.icon}</span> {link.label}
            </Link>
          ))}
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
