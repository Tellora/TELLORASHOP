'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';

interface CMSPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export default function AdminPagesPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    is_published: true,
  });

  const fetchPages = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pages');
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages || []);
      }
    } catch {
      showToast('Error loading pages', 'error');
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    if (token) fetchPages();
  }, [token, fetchPages]);

  const handleEditClick = (p: CMSPage) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      slug: p.slug,
      content: p.content || '',
      is_published: p.is_published === 1,
    });
    setIsModalOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingId(null);
    setForm({
      title: '',
      slug: '',
      content: '',
      is_published: true,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      showToast('Title is required', 'error');
      return;
    }

    try {
      const url = editingId ? `/api/pages/${editingId}` : '/api/pages';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        showToast(editingId ? 'Page updated successfully!' : 'Page created successfully!');
        setIsModalOpen(false);
        fetchPages();
      } else {
        const errorData = await res.json();
        showToast(errorData.error || 'Operation failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (!window.confirm('Delete this page? All user navigation links to this page will break.')) return;
    try {
      const res = await fetch(`/api/pages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Page deleted');
        fetchPages();
      } else {
        showToast('Error deleting page', 'error');
      }
    } catch {
      showToast('Error deleting page', 'error');
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">CMS PAGES</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage static site pages like About Us, Policies, and terms.</p>
        </div>
        <button onClick={handleAddNewClick} className="btn btn-primary">
          ADD NEW PAGE
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : pages.length === 0 ? (
        <div className="card text-center p-3">No custom pages created yet.</div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Page Title</th>
                <th>URL Slug</th>
                <th>Status</th>
                <th>Created</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 700 }}>{p.title}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>/page/{p.slug}</td>
                  <td>
                    <span className={`badge ${p.is_published === 1 ? 'badge-blue' : 'badge-red'}`}>
                      {p.is_published === 1 ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td>{new Date(p.updated_at || p.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button onClick={() => handleEditClick(p)} className="btn btn-sm btn-primary">Edit</button>
                      {['about', 'contact', 'shipping-policy', 'return-policy'].includes(p.slug) ? null : (
                        <button onClick={() => handleDeleteClick(p.id)} className="btn btn-sm btn-danger">Del</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Page Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3>{editingId ? 'EDIT CMS PAGE' : 'NEW CMS PAGE'}</h3>
              <button className="btn btn-sm btn-ghost" onClick={() => setIsModalOpen(false)} style={{ border: '2px solid var(--border-color)' }}>X</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="input-group">
                  <label>Page Title *</label>
                  <input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
                </div>
                <div className="input-group">
                  <label>Slug (URL Identifier)</label>
                  <input className="input" value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="about-us" />
                </div>
                <div className="input-group">
                  <label>Page Content (HTML/Markdown allowed)</label>
                  <textarea className="input" rows={12} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="<p>Welcome to our store...</p>" style={{ fontFamily: 'var(--font-mono)' }} />
                </div>
                <label className="filter-option" style={{ marginTop: '0.5rem' }}>
                  <input type="checkbox" checked={form.is_published} onChange={e => setForm(p => ({ ...p, is_published: e.target.checked }))} /> Status Published
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'SAVE CHANGES' : 'CREATE PAGE'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
