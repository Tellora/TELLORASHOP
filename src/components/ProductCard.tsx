'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/Toast';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compare_at_price?: number;
    images?: string;
    category_name?: string;
    category_slug?: string;
    avg_rating?: number;
    review_count?: number;
    is_featured?: number;
    quantity?: number;
  };
}

const fallbackImages: Record<string, string> = {
  'wireless-nc-headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  'minimalist-leather-backpack': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
  'smart-fitness-watch-pro': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  'organic-cotton-hoodie': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
  'scandinavian-desk-lamp': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
  'titanium-water-bottle': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
  'art-minimal-living': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
  'ceramic-pour-over-set': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
  'vintage-denim-jacket': 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
  'mechanical-keyboard-cherry': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
  'yoga-mat-premium': 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80',
  'wireless-charging-pad': 'https://images.unsplash.com/photo-1622445268465-840246e904b6?auto=format&fit=crop&w=800&q=80',
};

const categoryGradients: Record<string, string> = {
  electronics: 'linear-gradient(135deg, #9945FF 0%, #00E5FF 100%)',
  clothing: 'linear-gradient(135deg, #FF4A93 0%, #E5E535 100%)',
  'home-living': 'linear-gradient(135deg, #19C974 0%, #00E5FF 100%)',
  sports: 'linear-gradient(135deg, #FF6D00 0%, #E5E535 100%)',
  books: 'linear-gradient(135deg, #FF1744 0%, #9945FF 100%)',
  accessories: 'linear-gradient(135deg, #00E5FF 0%, #9945FF 100%)',
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [isWished, setIsWished] = useState(false);

  const getProductImage = () => {
    try {
      if (product.images) {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
          return parsed[0];
        }
      }
    } catch {
      /* ignore */
    }
    return fallbackImages[product.slug] || null;
  };

  const imageUrl = getProductImage();
  const catSlug = product.category_slug || '';
  const bgGradient = categoryGradients[catSlug] || 'linear-gradient(135deg, #E5E535, #9945FF)';

  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      compare_at_price: product.compare_at_price,
      quantity: 1,
      slug: product.slug,
    });
    showToast(`Added ${product.name} to cart!`);
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWished(!isWished);
    showToast(isWished ? `Removed from wishlist` : `Added to wishlist!`);
  };

  return (
    <Link href={`/product/${product.slug}`} className="case-card">
      <div className="case-card-image-container" style={{ background: bgGradient }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s ease',
            }}
            className="case-card-img"
          />
        ) : (
          <div
            style={{
              fontSize: '2.5rem',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              color: 'rgba(0,0,0,0.3)',
              letterSpacing: '-0.05em',
            }}
          >
            {product.category_name?.slice(0, 4).toUpperCase() || 'ITEM'}
          </div>
        )}

        {/* Badges */}
        <div className="product-card-badges" style={{ position: 'absolute', top: '0.85rem', left: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', zIndex: 10 }}>
          {product.is_featured ? <span className="badge badge-yellow">Featured</span> : null}
          {discount > 0 && <span className="badge badge-red">-{discount}%</span>}
          {product.quantity !== undefined && product.quantity <= 5 && product.quantity > 0 && (
            <span className="badge badge-orange">Low Stock</span>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          onClick={toggleWishlist}
          style={{
            position: 'absolute',
            top: '0.85rem',
            right: '0.85rem',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: isWished ? 'var(--accent-red)' : '#FFF',
            border: '2px solid #000',
            boxShadow: '2px 2px 0px #000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isWished ? '#FFF' : '#000',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'transform 0.15s ease',
          }}
          title="Wishlist"
        >
          {isWished ? '♥' : '♡'}
        </button>

        {/* Overlay Details */}
        <div className="case-card-overlay">
          {product.category_name && (
            <span className="case-card-tag">{product.category_name}</span>
          )}
          <h3 className="case-card-title" style={{ fontSize: '1.15rem', color: '#FFF' }}>{product.name}</h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem' }}>
            <span className="case-card-price" style={{ fontSize: '1.2rem', color: 'var(--accent-yellow)', textShadow: '1px 1px 0px #000' }}>
              ${product.price.toFixed(2)}
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: '#DDD', marginLeft: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                  ${product.compare_at_price.toFixed(2)}
                </span>
              )}
            </span>
            {product.avg_rating !== undefined && product.avg_rating > 0 && (
              <span style={{ color: 'var(--accent-yellow)', fontSize: '0.85rem', fontWeight: 800, background: '#000', padding: '0.1rem 0.4rem', border: '1.5px solid #fff', borderRadius: '4px' }}>
                ★ {product.avg_rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div style={{ padding: '0.9rem 1.25rem', background: '#FFF', borderTop: '3px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="case-card-action-text" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
          VIEW DETAILS <span style={{ transition: 'transform 0.2s ease', display: 'inline-block' }}>→</span>
        </span>
        <button
          onClick={handleAddToCart}
          className="btn btn-sm btn-primary"
          style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '2px solid #000', boxShadow: '2px 2px 0px #000', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          title="Add to Cart"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          ADD
        </button>
      </div>
    </Link>
  );
}

