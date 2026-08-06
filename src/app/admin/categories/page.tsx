'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  parent_id: string;
  sort_order: number;
  is_active: number;
  product_count: number;
}

export default function AdminCategoriesPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    parent_id: '',
    sort_order: '0',
    is_active: true,
  });

  const fetchCategories = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch {
      showToast('Error loading categories', 'error');
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    if (!token) return;
    fetchCategories();
  }, [token, fetchCategories]);

  const handleEditClick = (c: Category) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      image: c.image || '',
      parent_id: c.parent_id || '',
      sort_order: String(c.sort_order || 0),
      is_active: c.is_active === 1,
    });
    setIsModalOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingId(null);
    setForm({
      name: '',
      slug: '',
      description: '',
      image: '',
      parent_id: '',
      sort_order: '0',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      showToast('Name is required', 'error');
      return;
    }

    const payload = {
      ...form,
      sort_order: parseInt(form.sort_order || '0'),
    };

    try {
      const url = editingId ? `/api/categories/${editingId}` : '/api/categories';
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
        showToast(editingId ? 'Category updated!' : 'Category created!');
        setIsModalOpen(false);
        fetchCategories();
      } else {
        const errorData = await res.json();
        showToast(errorData.error || 'Operation failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  const handleDeleteClick = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? Linked products will become uncategorized.`)) return;
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Category deleted');
        fetchCategories();
      } else {
        showToast('Error deleting category', 'error');
      }
    } catch {
      showToast('Error deleting category', 'error');
    }
  };

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div className="brutal-badge-slanted brutal-badge-yellow" style={{ marginBottom: '0.5rem' }}>
            TAXONOMY MANAGEMENT
          </div>
          <h1 className="admin-page-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontStyle: 'italic', fontWeight: 900, margin: 0 }}>
            STORE <span style={{ color: 'var(--accent-purple)' }}>CATEGORIES</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginTop: '0.25rem' }}>
            Organize products into high-level collections, assign sort priorities, and manage navigation.
          </p>
        </div>
        <button onClick={handleAddNewClick} className="btn btn-primary btn-lg" style={{ boxShadow: '4px 4px 0px #000' }}>
          + ADD NEW CATEGORY
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : categories.length === 0 ? (
        <div className="card text-center p-3" style={{ background: '#FFF', border: '3px solid #000', borderRadius: '12px' }}>No categories found.</div>
      ) : (
        <div className="admin-table-wrapper" style={{ border: '3.5px solid #000', borderRadius: '12px', boxShadow: '5px 5px 0px #000', background: '#FFF', overflow: 'hidden' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '3px solid #000' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>CATEGORY NAME</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>SLUG</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>DESCRIPTION</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>LINKED PRODUCTS</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>SORT ORDER</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>STATUS</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id} style={{ borderBottom: '2px solid #EEE' }}>
                  <td style={{ padding: '1rem', fontWeight: 800 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.75rem', background: 'var(--accent-yellow)', border: '2px solid #000', padding: '0.2rem 0.45rem', borderRadius: '4px' }}>
                        CAT
                      </span>
                      <span style={{ fontSize: '0.95rem' }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{c.slug}</td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{c.description || <span style={{ color: 'var(--text-muted)' }}>No description</span>}</td>
                  <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)' }}>
                    <span className="badge badge-purple" style={{ transform: 'none', padding: '0.2rem 0.5rem' }}>
                      {c.product_count || 0} products
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>#{c.sort_order}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${c.is_active === 1 ? 'badge-green' : 'badge-red'}`} style={{ transform: 'none' }}>
                      {c.is_active === 1 ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div className="admin-table-actions" style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                      <button onClick={() => handleEditClick(c)} className="btn btn-sm btn-primary" style={{ padding: '0.35rem 0.65rem' }}>EDIT</button>
                      <button onClick={() => handleDeleteClick(c.id, c.name)} className="btn btn-sm btn-danger" style={{ padding: '0.35rem 0.65rem' }}>DEL</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Category Editor Modal */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="modal card" style={{ maxWidth: '520px', width: '100%', background: '#FFF', border: '4px solid #000', boxShadow: '8px 8px 0px #000', borderRadius: '16px', padding: '2rem' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #000', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontStyle: 'italic', fontSize: '1.4rem', margin: 0 }}>{editingId ? 'EDIT CATEGORY' : 'ADD NEW CATEGORY'}</h3>
              <button className="btn btn-sm" onClick={() => setIsModalOpen(false)} style={{ border: '2.5px solid #000', borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}>✕</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label>Category Title *</label>
                  <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="input-group">
                  <label>URL Slug (Auto-generated if blank)</label>
                  <input className="input" value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="electronics" />
                </div>
                <div className="input-group">
                  <label>Description</label>
                  <textarea className="input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ minHeight: '80px' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="input-group">
                    <label>Sort Order Index</label>
                    <input className="input" type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label>Parent Category</label>
                    <select className="input" value={form.parent_id} onChange={e => setForm(p => ({ ...p, parent_id: e.target.value }))}>
                      <option value="">None (Top Level)</option>
                      {categories.filter(c => c.id !== editingId).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <label className="filter-option" style={{ marginTop: '0.5rem', fontWeight: 800, cursor: 'pointer', background: 'var(--bg-secondary)', padding: '0.75rem', border: '2px solid #000', borderRadius: '8px' }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} /> Enable & Publish Category
                </label>
              </div>
              <div className="modal-footer" style={{ borderTop: '3px solid #000', paddingTop: '1.25rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)} style={{ border: '2.5px solid #000' }}>CANCEL</button>
                <button type="submit" className="btn btn-primary btn-lg" style={{ boxShadow: '4px 4px 0px #000' }}>{editingId ? 'SAVE CHANGES' : 'CREATE CATEGORY'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

