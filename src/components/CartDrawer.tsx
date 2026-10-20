'use client';
import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';

const fallbackImages: Record<string, string> = {
  'wireless-nc-headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
  'minimalist-leather-backpack': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80',
  'smart-fitness-watch-pro': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
  'organic-cotton-hoodie': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80',
  'scandinavian-desk-lamp': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80',
  'titanium-water-bottle': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=400&q=80',
  'art-minimal-living': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
  'ceramic-pour-over-set': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
  'vintage-denim-jacket': 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=400&q=80',
  'mechanical-keyboard-cherry': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80',
  'yoga-mat-premium': 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=400&q=80',
  'wireless-charging-pad': 'https://images.unsplash.com/photo-1622445268465-840246e904b6?auto=format&fit=crop&w=400&q=80',
};

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, subtotal, totalItems, isOpen, closeCart } = useCart();

  const { freeShippingThreshold, symbol } = useSettings();
  const progressPercent = Math.min(100, Math.round((subtotal / (freeShippingThreshold || 1)) * 100));
  const remainingForFreeShipping = freeShippingThreshold - subtotal;

  return (
    <>
      <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={closeCart} />
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="cart-header" style={{ borderBottom: '3px solid #000', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
          <h3 style={{ fontStyle: 'italic', fontSize: '1.4rem' }}>CART ({totalItems})</h3>
          <button className="btn btn-sm" onClick={closeCart} style={{ border: '2.5px solid #000', borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}>✕</button>
        </div>

        {/* Free Shipping Progress Meter (hidden when the store has no free-shipping threshold) */}
        {freeShippingThreshold > 0 && <div style={{ background: '#FFFDF9', borderBottom: '2.5px solid #000', padding: '0.85rem 1.5rem' }}>
          {subtotal >= freeShippingThreshold ? (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 800, color: '#000', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="badge badge-green" style={{ transform: 'none', padding: '0.15rem 0.4rem' }}>UNLOCKED</span>
              <span>YOU QUALIFY FOR FREE SHIPPING!</span>
            </div>
          ) : (
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: '#333' }}>
                Add <strong style={{ color: 'var(--accent-purple)' }}>{symbol}{remainingForFreeShipping.toFixed(2)}</strong> more for <strong>FREE SHIPPING</strong>
              </div>
              <div style={{ height: '10px', background: '#EEE', border: '2px solid #000', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--accent-yellow)', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          )}
        </div>}

        <div className="cart-body" style={{ padding: '1.25rem' }}>
          {items.length === 0 ? (
            <div className="cart-empty" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div className="cart-empty-icon" style={{ fontSize: '3rem', fontFamily: 'var(--font-mono)', fontWeight: 900, color: '#DDD', marginBottom: '1rem' }}>EMPTY</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>YOUR CART IS EMPTY</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Add some products to get started!</p>
              <Link href="/shop" className="btn btn-primary btn-full" onClick={closeCart}>BROWSE SHOP NOW →</Link>
            </div>
          ) : (
            items.map(item => {
              const imgUrl = fallbackImages[item.slug];
              return (
                <div key={item.product_id} className="cart-item" style={{ display: 'flex', gap: '1rem', borderBottom: '2px dashed #DDD', paddingBottom: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                  {imgUrl ? (
                    <img src={imgUrl} alt={item.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '2.5px solid #000', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '60px', height: '60px', background: 'var(--accent-yellow)', border: '2.5px solid #000', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.7rem' }}>
                      ITEM
                    </div>
                  )}
                  <div className="cart-item-info" style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/product/${item.slug}`} className="cart-item-name" onClick={closeCart} style={{ fontWeight: 800, fontSize: '0.85rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </Link>
                    <div className="cart-item-price" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      ${item.price.toFixed(2)}
                    </div>
                    <div className="cart-item-qty" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem' }}>
                      <button className="cart-qty-btn" onClick={() => updateQuantity(item.product_id, item.quantity - 1)} style={{ width: '24px', height: '24px', border: '2px solid #000', background: '#FFF', borderRadius: '4px', cursor: 'pointer', fontWeight: 800 }}>−</button>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.8rem', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button className="cart-qty-btn" onClick={() => updateQuantity(item.product_id, item.quantity + 1)} style={{ width: '24px', height: '24px', border: '2px solid #000', background: '#FFF', borderRadius: '4px', cursor: 'pointer', fontWeight: 800 }}>+</button>
                      <button onClick={() => removeItem(item.product_id)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--accent-red)', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}>REMOVE</button>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.95rem', color: '#000', whiteSpace: 'nowrap' }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer" style={{ borderTop: '3px solid #000', padding: '1.25rem 1.5rem', background: '#FFF' }}>
            <div className="cart-total" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subtotal</span>
              <span className="cart-total-amount" style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-purple)' }}>
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <Link href="/checkout" className="btn btn-primary btn-full btn-lg" onClick={closeCart} style={{ boxShadow: '4px 4px 0px #000' }}>
              PROCEED TO CHECKOUT →
            </Link>
            <Link href="/cart" className="btn btn-full mt-1" onClick={closeCart} style={{ background: 'transparent', border: '2px solid #000', fontSize: '0.8rem' }}>
              VIEW FULL CART
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

