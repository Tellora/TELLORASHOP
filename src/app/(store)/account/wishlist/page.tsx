'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/Toast';

interface WishlistItem {
  product_id: string; name: string; slug: string; price: number; compare_at_price: number; images: string;
}

export default function WishlistPage() {
  const { token } = useAuth();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch('/api/wishlist', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setItems(d.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const removeFromWishlist = async (productId: string) => {
    try {
      await fetch('/api/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ product_id: productId }) });
      setItems(prev => prev.filter(i => i.product_id !== productId));
      showToast('Removed from wishlist');
    } catch { /* ignore */ }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-mono)', marginBottom: '1.5rem' }}>MY WISHLIST</h2>
      {items.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon" style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '2rem', color: '#ccc' }}>WISHLIST</div><h3>Wishlist is empty</h3><p>Save items you love for later!</p><Link href="/shop" className="btn btn-primary">BROWSE SHOP</Link></div>
      ) : (
        <div className="grid grid-3">
          {items.map(item => (
            <div key={item.product_id} className="card card-hover">
              <Link href={`/product/${item.slug}`}>
                <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>{item.name}</h3>
              </Link>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, marginBottom: '1rem' }}>
                ${item.price.toFixed(2)}
                {item.compare_at_price > 0 && item.compare_at_price > item.price && <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.85rem' }}>${item.compare_at_price.toFixed(2)}</span>}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={() => { addItem({ product_id: item.product_id, name: item.name, price: item.price, quantity: 1, slug: item.slug }); showToast('Added to cart!'); }} style={{ flex: 1 }}>ADD TO CART</button>
                <button className="btn btn-sm btn-danger" onClick={() => removeFromWishlist(item.product_id)}>X</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
