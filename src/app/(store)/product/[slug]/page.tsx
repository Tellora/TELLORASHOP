'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import ProductCard from '@/components/ProductCard';

interface Product {
  id: string; name: string; slug: string; description: string; short_description: string;
  price: number; compare_at_price: number; sku: string; quantity: number; category_name: string;
  category_slug: string; avg_rating: number; review_count: number; weight: number; tags: string;
  images: string; is_featured: number;
}

interface Review {
  id: string; user_name: string; rating: number; title: string; comment: string; created_at: string;
}

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { addItem } = useCart();
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then(r => r.json())
      .then(data => {
        setProduct(data.product);
        setReviews(data.reviews || []);
        setRelated(data.related || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({ product_id: product.id, name: product.name, price: product.price, compare_at_price: product.compare_at_price, quantity, slug: product.slug });
    showToast(`Added ${product.name} to cart!`);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !user) return;
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(reviewForm),
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(prev => [data.review, ...prev]);
        setReviewForm({ rating: 5, title: '', comment: '' });
        showToast('Review submitted!');
      }
    } catch { showToast('Error submitting review', 'error'); }
  };

  const renderStars = (r: number) => Array.from({ length: 5 }, (_, i) => i < Math.round(r) ? '★' : '☆').join('');

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!product) return <div className="container section"><div className="empty-state"><div className="empty-state-icon" style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '2rem', color: '#ccc' }}>404</div><h3>Product not found</h3><Link href="/shop" className="btn btn-primary mt-2">Back to Shop</Link></div></div>;

  const discount = product.compare_at_price ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100) : 0;

  const fallbackImages: Record<string, string> = {
    'wireless-nc-headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
    'minimalist-leather-backpack': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80',
    'smart-fitness-watch-pro': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80',
    'organic-cotton-hoodie': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80',
    'scandinavian-desk-lamp': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80',
    'titanium-water-bottle': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1000&q=80',
    'art-minimal-living': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1000&q=80',
    'ceramic-pour-over-set': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80',
    'vintage-denim-jacket': 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1000&q=80',
    'mechanical-keyboard-cherry': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80',
    'yoga-mat-premium': 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=1000&q=80',
    'wireless-charging-pad': 'https://images.unsplash.com/photo-1622445268465-840246e904b6?auto=format&fit=crop&w=1000&q=80',
  };

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

  const mainImage = getProductImage();

  return (
    <div className="container" style={{ padding: '2.5rem 0 5rem' }}>
      <div className="product-detail" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '3rem', marginBottom: '4rem' }}>
        {/* GALLERY */}
        <div className="product-gallery">
          <div className="product-gallery-main" style={{
            background: 'linear-gradient(135deg, #F6F4ED 0%, #FFFDF9 100%)',
            border: '3.5px solid #000',
            borderRadius: '16px',
            boxShadow: '6px 6px 0px #000',
            overflow: 'hidden',
            aspectRatio: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {mainImage ? (
              <img src={mainImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '3rem', color: 'rgba(0,0,0,0.2)' }}>
                {product.category_name?.toUpperCase() || 'PRODUCT'}
              </div>
            )}
            <div style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {product.is_featured ? <span className="badge badge-yellow" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>FEATURED DROP</span> : null}
              {discount > 0 && <span className="badge badge-red" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>SAVE {discount}%</span>}
            </div>
          </div>
        </div>

        {/* INFO */}
        <div className="product-info">
          <div className="product-info-breadcrumb" style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', color: '#666' }}>
            <Link href="/" style={{ textDecoration: 'underline' }}>HOME</Link> / <Link href="/shop" style={{ textDecoration: 'underline' }}>SHOP</Link>
            {product.category_name && <> / <Link href={`/shop?category=${product.category_slug}`} style={{ textDecoration: 'underline' }}>{product.category_name.toUpperCase()}</Link></>}
            <span> / {product.name.toUpperCase()}</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontStyle: 'italic', fontWeight: 900, lineHeight: 1, marginBottom: '1rem' }}>
            {product.name}
          </h1>

          <div className="product-info-rating" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <span style={{ color: 'var(--accent-orange)', fontSize: '1.25rem', letterSpacing: '0.1em' }}>{renderStars(product.avg_rating)}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.85rem', background: '#000', color: '#FFF', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
              {product.avg_rating ? product.avg_rating.toFixed(1) : '5.0'} / 5.0 ({product.review_count} REVIEWS)
            </span>
          </div>

          <div className="product-info-price" style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.5rem', background: 'var(--accent-yellow)', padding: '1rem 1.5rem', border: '3px solid #000', boxShadow: '4px 4px 0px #000', borderRadius: '12px' }}>
            <span className="product-info-price-current" style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
              ${product.price.toFixed(2)}
            </span>
            {product.compare_at_price > 0 && product.compare_at_price > product.price && (
              <>
                <span className="product-info-price-compare" style={{ fontSize: '1.25rem', textDecoration: 'line-through', color: '#666', fontFamily: 'var(--font-mono)' }}>
                  ${product.compare_at_price.toFixed(2)}
                </span>
                <span className="badge badge-red" style={{ transform: 'none' }}>-{discount}% OFF</span>
              </>
            )}
          </div>

          {product.short_description && (
            <p className="product-info-desc" style={{ fontSize: '1.05rem', fontWeight: 600, color: '#333', lineHeight: 1.5, marginBottom: '1.75rem' }}>
              {product.short_description}
            </p>
          )}

          {/* Stock Meter */}
          <div style={{ marginBottom: '1.75rem', background: '#FFF', border: '2.5px solid #000', padding: '1rem', borderRadius: '8px', boxShadow: '3px 3px 0px #000' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.8rem', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              <span>AVAILABILITY:</span>
              <span>
                {product.quantity > 10 ? <strong style={{ color: 'var(--accent-green)' }}>IN STOCK ({product.quantity} UNITS)</strong> :
                 product.quantity > 0 ? <strong style={{ color: 'var(--accent-orange)' }}>LOW STOCK ({product.quantity} LEFT)</strong> :
                 <strong style={{ color: 'var(--accent-red)' }}>OUT OF STOCK</strong>}
              </span>
            </div>
            <div style={{ height: '8px', background: '#EEE', border: '1.5px solid #000', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (product.quantity / 50) * 100)}%`, background: product.quantity > 10 ? 'var(--accent-green)' : 'var(--accent-orange)' }} />
            </div>
          </div>

          <div className="product-info-actions" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div className="product-qty-selector" style={{ display: 'flex', alignItems: 'center', border: '3px solid #000', borderRadius: '8px', background: '#FFF', boxShadow: '3px 3px 0px #000' }}>
              <button className="product-qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ padding: '0.75rem 1.25rem', fontSize: '1.2rem', fontWeight: 900, background: 'none', border: 'none', cursor: 'pointer' }}>−</button>
              <div className="product-qty-value" style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.1rem', minWidth: '40px', textAlign: 'center' }}>{quantity}</div>
              <button className="product-qty-btn" onClick={() => setQuantity(quantity + 1)} style={{ padding: '0.75rem 1.25rem', fontSize: '1.2rem', fontWeight: 900, background: 'none', border: 'none', cursor: 'pointer' }}>+</button>
            </div>
            <button className="btn btn-primary btn-lg" onClick={handleAddToCart} disabled={product.quantity <= 0} style={{ flex: 1, boxShadow: '4px 4px 0px #000' }}>
              {product.quantity <= 0 ? 'OUT OF STOCK' : 'ADD TO CART →'}
            </button>
          </div>

          {product.tags && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
              {product.tags.split(',').filter(Boolean).map(tag => (
                <span key={tag} className="badge badge-purple" style={{ transform: 'none', fontSize: '0.75rem' }}>#{tag.trim()}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TABS */}
      <div style={{ padding: '2rem 0 4rem' }}>
        <div className="tabs">
          <button className={`tab ${activeTab === 'description' ? 'active' : ''}`} onClick={() => setActiveTab('description')}>Description</button>
          <button className={`tab ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>Reviews ({reviews.length})</button>
        </div>

        {activeTab === 'description' && (
          <div className="card" style={{ lineHeight: 1.8 }}>
            <p>{product.description}</p>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            {user && (
              <form onSubmit={handleReviewSubmit} className="card mb-2">
                <h3 style={{ marginBottom: '1rem' }}>Write a Review</h3>
                <div className="input-group">
                  <label>Rating</label>
                  <div style={{ display: 'flex', gap: '0.25rem', fontSize: '1.5rem', cursor: 'pointer' }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <span key={n} onClick={() => setReviewForm(p => ({ ...p, rating: n }))} style={{ color: n <= reviewForm.rating ? 'var(--accent-orange)' : '#ddd' }}>★</span>
                    ))}
                  </div>
                </div>
                <div className="input-group">
                  <label>Title</label>
                  <input className="input" value={reviewForm.title} onChange={e => setReviewForm(p => ({ ...p, title: e.target.value }))} placeholder="Review title..." />
                </div>
                <div className="input-group">
                  <label>Comment</label>
                  <textarea className="input" value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))} placeholder="Write your review..." />
                </div>
                <button type="submit" className="btn btn-primary">SUBMIT REVIEW</button>
              </form>
            )}
            {!user && (
              <div className="card mb-2 text-center" style={{ padding: '2rem' }}>
                <p style={{ marginBottom: '1rem' }}>Please <Link href="/login" style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>login</Link> to leave a review.</p>
              </div>
            )}
            {reviews.length === 0 ? (
              <div className="card text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>No reviews yet. Be the first!</div>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <span className="review-author">{review.user_name}</span>
                    <span className="review-date">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="review-stars">{renderStars(review.rating)}</div>
                  {review.title && <div className="review-title">{review.title}</div>}
                  <div className="review-comment">{review.comment}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* RELATED PRODUCTS */}
      {related.length > 0 && (
        <section className="section" style={{ borderTop: '3px solid var(--border-color)' }}>
          <div className="section-header">
            <h2 className="section-title">YOU MAY ALSO <span className="section-title-accent">LIKE</span></h2>
          </div>
          <div className="grid grid-4">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
