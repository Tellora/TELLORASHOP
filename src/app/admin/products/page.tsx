'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { downloadExport } from '@/lib/admin-client';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  compare_at_price: number;
  cost: number;
  sku: string;
  quantity: number;
  is_active: number;
  category_id: string;
  category_name: string;
  is_featured: number;
  weight: number;
  tags: string;
  images: string;
  track_inventory?: number;
  seo_title?: string;
  seo_description?: string;
}

/** Stored as a JSON array; show it one URL per line in the editor. */
function imagesToText(raw?: string): string {
  try {
    let v: unknown = raw;
    for (let i = 0; i < 3 && typeof v === 'string'; i++) v = JSON.parse(v);
    return Array.isArray(v) ? v.join('\n') : '';
  } catch { return ''; }
}

interface Category {
  id: string;
  name: string;
}

export default function AdminProductsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  
  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    price: '',
    compare_at_price: '',
    cost: '',
    sku: '',
    quantity: '0',
    category_id: '',
    is_active: true,
    is_featured: false,
    weight: '',
    tags: '',
    images: '',
    track_inventory: true,
    seo_title: '',
    seo_description: '',
  });

  const fetchProducts = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('admin', 'true');
      params.set('limit', '100'); // simple pagination bypass for admin control
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      
      const res = await fetch(`/api/products?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch {
      showToast('Error loading products', 'error');
    }
    setLoading(false);
  }, [search, categoryFilter, showToast, token]);

  const fetchCategories = React.useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchProducts();
    fetchCategories();
  }, [token, fetchProducts, fetchCategories]);

  const handleEditClick = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description || '',
      short_description: p.short_description || '',
      price: String(p.price),
      compare_at_price: String(p.compare_at_price || ''),
      cost: String(p.cost || ''),
      sku: p.sku || '',
      quantity: String(p.quantity),
      category_id: p.category_id || '',
      is_active: p.is_active === 1,
      is_featured: p.is_featured === 1,
      weight: String(p.weight || ''),
      tags: p.tags || '',
      images: imagesToText(p.images),
      track_inventory: p.track_inventory !== 0,
      seo_title: p.seo_title || '',
      seo_description: p.seo_description || '',
    });
    setIsModalOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingId(null);
    setForm({
      name: '',
      slug: '',
      description: '',
      short_description: '',
      price: '',
      compare_at_price: '',
      cost: '',
      sku: '',
      quantity: '0',
      category_id: categories[0]?.id || '',
      is_active: true,
      is_featured: false,
      weight: '',
      tags: '',
      images: '',
      track_inventory: true,
      seo_title: '',
      seo_description: '',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      showToast('Name and price are required', 'error');
      return;
    }

    const payload = {
      ...form,
      price: parseFloat(form.price),
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      cost: form.cost ? parseFloat(form.cost) : null,
      quantity: parseInt(form.quantity),
      weight: form.weight ? parseFloat(form.weight) : null,
      images: form.images.split(/\n+/).map(s => s.trim()).filter(Boolean),
    };

    try {
      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(editingId ? 'Product updated successfully!' : 'Product created successfully!');
        setIsModalOpen(false);
        fetchProducts();
      } else {
        const errorData = await res.json();
        showToast(errorData.error || 'Operation failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  const handleDeleteClick = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Product deleted');
        fetchProducts();
      } else {
        showToast('Error deleting product', 'error');
      }
    } catch {
      showToast('Error deleting product', 'error');
    }
  };

  const filteredProducts = products.filter(p => {
    if (activeFilter === 'active' && p.is_active !== 1) return false;
    if (activeFilter === 'inactive' && p.is_active !== 0) return false;
    if (activeFilter === 'out' && !(p.track_inventory !== 0 && p.quantity <= 0)) return false;
    if (activeFilter === 'low' && !(p.track_inventory !== 0 && p.quantity > 0 && p.quantity <= 5)) return false;
    return true;
  });

  const getFirstImage = (imagesStr?: string, slug?: string) => {
    try {
      if (imagesStr) {
        const arr = JSON.parse(imagesStr);
        if (Array.isArray(arr) && arr[0]) return arr[0];
      }
    } catch { /* ignore */ }
    const fallbacks: Record<string, string> = {
      'wireless-nc-headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=200&q=80',
      'minimalist-leather-backpack': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=200&q=80',
      'smart-fitness-watch-pro': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80',
      'organic-cotton-hoodie': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=200&q=80',
      'scandinavian-desk-lamp': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=200&q=80',
      'titanium-water-bottle': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=200&q=80',
    };
    return slug ? fallbacks[slug] || null : null;
  };

  const handleStockAdjust = async (id: string, currentQty: number, delta: number) => {
    const newQty = Math.max(0, currentQty + delta);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, quantity: newQty } : p));
        showToast(`Stock updated to ${newQty}`);
      }
    } catch {
      showToast('Error updating stock', 'error');
    }
  };

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div className="brutal-badge-slanted brutal-badge-yellow" style={{ marginBottom: '0.5rem' }}>
            CATALOG MANAGEMENT
          </div>
          <h1 className="admin-page-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontStyle: 'italic', fontWeight: 900, margin: 0 }}>
            PRODUCT <span style={{ color: 'var(--accent-purple)' }}>INVENTORY</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginTop: '0.25rem' }}>
            Manage pricing, cost margins, inventory stock meters, and product listings.
          </p>
        </div>
        <button onClick={async () => { if (!(await downloadExport('products', token))) showToast('Export failed', 'error'); }} className="btn btn-lg" style={{ boxShadow: '4px 4px 0px #000', marginRight: '0.75rem' }}>
          EXPORT CSV
        </button>
        <button onClick={handleAddNewClick} className="btn btn-primary btn-lg" style={{ boxShadow: '4px 4px 0px #000' }}>
          + ADD NEW PRODUCT
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="shop-toolbar mb-2" style={{ background: '#FFF', border: '3px solid #000', borderRadius: '8px', boxShadow: '3px 3px 0px #000', padding: '0.75rem 1.25rem', marginBottom: '1.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="input"
          style={{ maxWidth: '280px', boxShadow: 'none', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
          placeholder="SEARCH SKU OR NAME..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchProducts()}
        />
        <button onClick={fetchProducts} className="btn btn-sm btn-dark">SEARCH</button>

        <select
          className="input"
          style={{ maxWidth: '180px', boxShadow: 'none', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="">ALL CATEGORIES</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.name}>{cat.name.toUpperCase()}</option>
          ))}
        </select>

        <select
          className="input"
          style={{ maxWidth: '160px', boxShadow: 'none', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
          value={activeFilter}
          onChange={e => setActiveFilter(e.target.value)}
        >
          <option value="">ALL STATUSES</option>
          <option value="active">ACTIVE ONLY</option>
          <option value="inactive">DRAFT ONLY</option>
          <option value="low">LOW STOCK (≤5)</option>
          <option value="out">OUT OF STOCK</option>
        </select>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : filteredProducts.length === 0 ? (
        <div className="card text-center p-3" style={{ background: '#FFF', border: '3px solid #000', borderRadius: '12px' }}>No products found matching filters.</div>
      ) : (
        <div className="admin-table-wrapper" style={{ border: '3.5px solid #000', borderRadius: '12px', boxShadow: '5px 5px 0px #000', background: '#FFF', overflow: 'hidden' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '3px solid #000' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>PRODUCT</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>SKU</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>CATEGORY</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>RETAIL PRICE</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>MARGIN</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>STOCK LEVEL</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>STATUS</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => {
                const img = getFirstImage(p.images, p.slug);
                const margin = p.cost && p.price > 0 ? Math.round(((p.price - p.cost) / p.price) * 100) : null;
                return (
                  <tr key={p.id} style={{ borderBottom: '2px solid #EEE' }}>
                    <td style={{ padding: '1rem', fontWeight: 800 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        {img ? (
                          <img src={img} alt={p.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #000', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '48px', height: '48px', background: 'var(--accent-yellow)', border: '2px solid #000', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.65rem' }}>
                            PRD
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: '0.9rem', color: '#000' }}>{p.name}</div>
                          {p.is_featured === 1 && <span className="badge badge-yellow" style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem', transform: 'none' }}>FEATURED</span>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.85rem' }}>{p.sku || '—'}</td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>{p.category_name || 'Uncategorized'}</td>
                    <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.95rem' }}>${p.price.toFixed(2)}</td>
                    <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {margin !== null ? (
                        <span className={`badge ${margin > 40 ? 'badge-green' : 'badge-orange'}`} style={{ transform: 'none', padding: '0.15rem 0.4rem' }}>
                          {margin}% profit
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button onClick={() => handleStockAdjust(p.id, p.quantity, -1)} style={{ width: '22px', height: '22px', border: '1.5px solid #000', borderRadius: '4px', cursor: 'pointer', fontWeight: 900, background: '#FFF' }}>−</button>
                        <span className={`badge ${p.quantity <= 5 ? 'badge-red' : 'badge-green'}`} style={{ transform: 'none', minWidth: '40px', textAlign: 'center' }}>
                          {p.quantity} units
                        </span>
                        <button onClick={() => handleStockAdjust(p.id, p.quantity, 1)} style={{ width: '22px', height: '22px', border: '1.5px solid #000', borderRadius: '4px', cursor: 'pointer', fontWeight: 900, background: '#FFF' }}>+</button>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${p.is_active === 1 ? 'badge-blue' : 'badge-red'}`} style={{ transform: 'none' }}>
                        {p.is_active === 1 ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div className="admin-table-actions" style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                        <button onClick={() => handleEditClick(p)} className="btn btn-sm btn-primary" style={{ padding: '0.35rem 0.65rem' }}>EDIT</button>
                        <button onClick={() => handleDeleteClick(p.id, p.name)} className="btn btn-sm btn-danger" style={{ padding: '0.35rem 0.65rem' }}>DEL</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="modal card" style={{ maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', background: '#FFF', border: '4px solid #000', boxShadow: '8px 8px 0px #000', borderRadius: '16px', padding: '2rem' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #000', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontStyle: 'italic', fontSize: '1.5rem', margin: 0 }}>{editingId ? 'EDIT PRODUCT CATALOG ENTRY' : 'ADD NEW PRODUCT'}</h3>
              <button className="btn btn-sm" onClick={() => setIsModalOpen(false)} style={{ border: '2.5px solid #000', borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}>✕</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="input-group">
                    <label>Product Title *</label>
                    <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div className="input-group">
                    <label>URL Slug (Auto-generated if blank)</label>
                    <input className="input" value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="e.g. wireless-nc-headphones" />
                  </div>
                  <div className="input-group">
                    <label>SKU / Stock Identifier</label>
                    <input className="input" value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} placeholder="ELEC-HP-001" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="input-group">
                      <label>Retail Price ($) *</label>
                      <input className="input" type="number" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required />
                    </div>
                    <div className="input-group">
                      <label>Compare Price ($)</label>
                      <input className="input" type="number" step="0.01" value={form.compare_at_price} onChange={e => setForm(p => ({ ...p, compare_at_price: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="input-group">
                      <label>Item Cost ($)</label>
                      <input className="input" type="number" step="0.01" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))} />
                    </div>
                    <div className="input-group">
                      <label>Stock Quantity</label>
                      <input className="input" type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Product Category</label>
                    <select className="input" value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}>
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="input-group">
                    <label>Image URLs (one per line, first is the main image)</label>
                    <textarea className="input" rows={3} placeholder={'https://cdn.example.com/photo-1.jpg\nhttps://cdn.example.com/photo-2.jpg'} value={form.images} onChange={e => setForm(p => ({ ...p, images: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" checked={form.track_inventory} onChange={e => setForm(p => ({ ...p, track_inventory: e.target.checked }))} /> Track inventory (untick for unlimited stock)
                    </label>
                  </div>
                  <div className="input-group">
                    <label>SEO title (optional)</label>
                    <input className="input" value={form.seo_title} onChange={e => setForm(p => ({ ...p, seo_title: e.target.value }))} placeholder="Shown in Google results" />
                  </div>
                  <div className="input-group">
                    <label>SEO description (optional)</label>
                    <textarea className="input" rows={2} value={form.seo_description} onChange={e => setForm(p => ({ ...p, seo_description: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label>Short Summary</label>
                    <input className="input" value={form.short_description} onChange={e => setForm(p => ({ ...p, short_description: e.target.value }))} placeholder="Brief summary for product card" />
                  </div>
                  <div className="input-group">
                    <label>Full Specification & Description</label>
                    <textarea className="input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ minHeight: '100px' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="input-group">
                      <label>Weight (kg)</label>
                      <input className="input" type="number" step="0.1" value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} />
                    </div>
                    <div className="input-group">
                      <label>Tags (Comma separated)</label>
                      <input className="input" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="headphones, wireless" />
                    </div>
                  </div>
                  <div className="input-group" style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', background: 'var(--bg-secondary)', padding: '0.75rem', border: '2px solid #000', borderRadius: '8px' }}>
                    <label className="filter-option" style={{ fontWeight: 800, cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} /> Active (Published)
                    </label>
                    <label className="filter-option" style={{ fontWeight: 800, cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.is_featured} onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))} /> Featured Product
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '3px solid #000', paddingTop: '1.25rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)} style={{ border: '2.5px solid #000' }}>CANCEL</button>
                <button type="submit" className="btn btn-primary btn-lg" style={{ boxShadow: '4px 4px 0px #000' }}>{editingId ? 'SAVE CHANGES' : 'CREATE PRODUCT'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
