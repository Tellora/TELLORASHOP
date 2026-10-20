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

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCart();
  const { freeShippingThreshold, shippingFlat, taxRate, symbol } = useSettings();
  const shipping = freeShippingThreshold > 0 && subtotal >= freeShippingThreshold ? 0 : shippingFlat;
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="container section" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <div className="empty-state card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '3.5rem 2rem', border: '3.5px solid #000', boxShadow: '6px 6px 0px #000', borderRadius: '16px' }}>
          <div className="empty-state-icon" style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '3rem', color: '#CCC', marginBottom: '1rem' }}>EMPTY CART</div>
          <h3 style={{ fontSize: '1.75rem', fontStyle: 'italic', marginBottom: '0.75rem' }}>YOUR CART IS CURRENTLY EMPTY</h3>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '2rem' }}>Explore our raw curated collection and find something bold.</p>
          <Link href="/shop" className="btn btn-primary btn-lg" style={{ boxShadow: '4px 4px 0px #000' }}>START SHOPPING NOW →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      <div className="brutal-badge-slanted brutal-badge-yellow" style={{ marginBottom: '1rem' }}>
        SHOPPING BAG
      </div>
      <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontStyle: 'italic', fontWeight: 900, marginBottom: '2.5rem' }}>
        YOUR <span style={{ color: 'var(--accent-purple)' }}>CART</span>
      </h1>

      <div className="checkout-layout" style={{ padding: 0 }}>
        <div>
          <div className="admin-table-wrapper" style={{ border: '3.5px solid #000', borderRadius: '12px', boxShadow: '5px 5px 0px #000', background: '#FFF', overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '3px solid #000' }}>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>PRODUCT</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>PRICE</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>QUANTITY</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>SUBTOTAL</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const imgUrl = fallbackImages[item.slug];
                  return (
                    <tr key={item.product_id} style={{ borderBottom: '2px solid #EEE' }}>
                      <td style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          {imgUrl ? (
                            <img src={imgUrl} alt={item.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '2.5px solid #000', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: '60px', height: '60px', background: 'var(--accent-yellow)', border: '2.5px solid #000', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.7rem' }}>
                              ITEM
                            </div>
                          )}
                          <Link href={`/product/${item.slug}`} style={{ fontWeight: 800, fontSize: '0.95rem', color: '#000' }}>{item.name}</Link>
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem' }}>${item.price.toFixed(2)}</td>
                      <td style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: '2px solid #000', width: 'fit-content', borderRadius: '6px', padding: '0.2rem', background: '#FFF' }}>
                          <button className="cart-qty-btn" onClick={() => updateQuantity(item.product_id, item.quantity - 1)} style={{ width: '28px', height: '28px', border: 'none', background: 'var(--bg-secondary)', fontWeight: 900, cursor: 'pointer', borderRadius: '4px' }}>−</button>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, minWidth: '28px', textAlign: 'center' }}>{item.quantity}</span>
                          <button className="cart-qty-btn" onClick={() => updateQuantity(item.product_id, item.quantity + 1)} style={{ width: '28px', height: '28px', border: 'none', background: 'var(--bg-secondary)', fontWeight: 900, cursor: 'pointer', borderRadius: '4px' }}>+</button>
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem', fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.05rem', color: 'var(--accent-purple)' }}>${(item.price * item.quantity).toFixed(2)}</td>
                      <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                        <button className="btn btn-sm btn-danger" onClick={() => removeItem(item.product_id)} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: '2px solid #000' }}>✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="checkout-summary">
          <div className="card card-yellow" style={{ border: '3.5px solid #000', boxShadow: '6px 6px 0px #000', borderRadius: '16px', padding: '2rem' }}>
            <h3 style={{ fontStyle: 'italic', marginBottom: '1.5rem', fontSize: '1.5rem' }}>ORDER SUMMARY</h3>
            <div className="checkout-summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.85rem', fontWeight: 700 }}>
              <span>Subtotal</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>${subtotal.toFixed(2)}</span>
            </div>
            <div className="checkout-summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.85rem', fontWeight: 700 }}>
              <span>Shipping</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="checkout-summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', fontWeight: 700 }}>
              <span>Est. Tax ({taxRate}%)</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>${tax.toFixed(2)}</span>
            </div>
            <div className="checkout-summary-row checkout-summary-total" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '3px solid #000', paddingTop: '1.25rem', marginBottom: '1.5rem', fontWeight: 900, fontSize: '1.2rem' }}>
              <span>ESTIMATED TOTAL</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', color: '#000' }}>${total.toFixed(2)}</span>
            </div>
            {freeShippingThreshold <= 0 ? null : subtotal < freeShippingThreshold ? (
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#444', marginBottom: '1.5rem', fontFamily: 'var(--font-mono)', background: '#FFF', padding: '0.65rem', border: '2px solid #000', borderRadius: '6px' }}>
                Add <strong>{symbol}{(freeShippingThreshold - subtotal).toFixed(2)}</strong> more to qualify for FREE shipping!
              </p>
            ) : (
              <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'green', marginBottom: '1.5rem', fontFamily: 'var(--font-mono)', background: '#FFF', padding: '0.65rem', border: '2px solid #000', borderRadius: '6px' }}>
                ✓ FREE SHIPPING UNLOCKED
              </p>
            )}
            <Link href="/checkout" className="btn btn-dark btn-full btn-lg mt-2" style={{ boxShadow: '4px 4px 0px #000' }}>
              PROCEED TO CHECKOUT →
            </Link>
            <Link href="/shop" className="btn btn-full mt-1" style={{ background: '#FFF', border: '2.5px solid #000', fontWeight: 800, fontSize: '0.85rem' }}>
              ← CONTINUE SHOPPING
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

