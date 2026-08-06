'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  min_purchase: number;
  max_uses: number;
  used_count: number;
  starts_at: string;
  expires_at: string;
  is_active: number;
}

export default function AdminCouponsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: '',
    type: 'percentage',
    value: '',
    min_purchase: '0',
    max_uses: '',
    is_active: true,
  });

  const fetchCoupons = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/coupons', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch {
      showToast('Error loading coupons', 'error');
    }
    setLoading(false);
  }, [token, showToast]);

  useEffect(() => {
    if (token) fetchCoupons();
  }, [token, fetchCoupons]);

  const handleEditClick = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      min_purchase: String(c.min_purchase),
      max_uses: c.max_uses ? String(c.max_uses) : '',
      is_active: c.is_active === 1,
    });
    setIsModalOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingId(null);
    setForm({
      code: '',
      type: 'percentage',
      value: '',
      min_purchase: '0',
      max_uses: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.value) {
      showToast('Code and discount value are required', 'error');
      return;
    }

    const payload = {
      code: form.code.toUpperCase(),
      type: form.type,
      value: parseFloat(form.value),
      min_purchase: parseFloat(form.min_purchase || '0'),
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      is_active: form.is_active,
    };

    try {
      const url = editingId ? `/api/coupons/${editingId}` : '/api/coupons';
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
        showToast(editingId ? 'Discount updated!' : 'Discount coupon created!');
        setIsModalOpen(false);
        fetchCoupons();
      } else {
        const errorData = await res.json();
        showToast(errorData.error || 'Operation failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (!window.confirm('Delete this coupon? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Coupon deleted');
        fetchCoupons();
      } else {
        showToast('Error deleting coupon', 'error');
      }
    } catch {
      showToast('Error deleting coupon', 'error');
    }
  };

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div className="brutal-badge-slanted brutal-badge-pink" style={{ marginBottom: '0.5rem' }}>
            MARKETING & PROMOTIONS
          </div>
          <h1 className="admin-page-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontStyle: 'italic', fontWeight: 900, margin: 0 }}>
            DISCOUNT <span style={{ color: 'var(--accent-purple)' }}>COUPONS</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginTop: '0.25rem' }}>
            Configure checkout discount codes, minimum order thresholds, and usage limits.
          </p>
        </div>
        <button onClick={handleAddNewClick} className="btn btn-primary btn-lg" style={{ boxShadow: '4px 4px 0px #000' }}>
          + CREATE DISCOUNT CODE
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : coupons.length === 0 ? (
        <div className="card text-center p-3" style={{ background: '#FFF', border: '3px solid #000', borderRadius: '12px' }}>No promotional coupons configured yet.</div>
      ) : (
        <div className="admin-table-wrapper" style={{ border: '3.5px solid #000', borderRadius: '12px', boxShadow: '5px 5px 0px #000', background: '#FFF', overflow: 'hidden' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '3px solid #000' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>COUPON CODE</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>TYPE</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>DISCOUNT VALUE</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>MIN PURCHASE</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>USAGE METER</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>STATUS</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => {
                const limitStr = c.max_uses ? `${c.used_count} / ${c.max_uses}` : `${c.used_count} / Unlimited`;
                return (
                  <tr key={c.id} style={{ borderBottom: '2px solid #EEE' }}>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-yellow" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', padding: '0.35rem 0.65rem', border: '2px solid #000', transform: 'none' }}>
                        {c.code}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textTransform: 'uppercase', fontWeight: 800, fontSize: '0.85rem' }}>{c.type}</td>
                    <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1rem', color: 'var(--accent-purple)' }}>
                      {c.type === 'percentage' ? `${c.value}% OFF` : `$${c.value.toFixed(2)} OFF`}
                    </td>
                    <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>${c.min_purchase.toFixed(2)}</td>
                    <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 800, marginBottom: '0.2rem' }}>{limitStr}</div>
                      <div style={{ width: '100px', height: '6px', background: '#EEE', borderRadius: '3px', border: '1px solid #000', overflow: 'hidden' }}>
                        <div style={{ width: c.max_uses ? `${Math.min(100, (c.used_count / c.max_uses) * 100)}%` : '15%', height: '100%', background: 'var(--accent-purple)' }} />
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${c.is_active === 1 ? 'badge-green' : 'badge-red'}`} style={{ transform: 'none' }}>
                        {c.is_active === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div className="admin-table-actions" style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                        <button onClick={() => handleEditClick(c)} className="btn btn-sm btn-primary" style={{ padding: '0.35rem 0.65rem' }}>EDIT</button>
                        <button onClick={() => handleDeleteClick(c.id)} className="btn btn-sm btn-danger" style={{ padding: '0.35rem 0.65rem' }}>DEL</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Coupon Modal */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="modal card" style={{ maxWidth: '520px', width: '100%', background: '#FFF', border: '4px solid #000', boxShadow: '8px 8px 0px #000', borderRadius: '16px', padding: '2rem' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #000', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontStyle: 'italic', fontSize: '1.4rem', margin: 0 }}>{editingId ? 'EDIT DISCOUNT COUPON' : 'CREATE NEW COUPON'}</h3>
              <button className="btn btn-sm" onClick={() => setIsModalOpen(false)} style={{ border: '2.5px solid #000', borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}>✕</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label>Coupon Code *</label>
                  <input className="input" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="SAVE50" style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 900 }} required />
                </div>
                <div className="input-group">
                  <label>Discount Type</label>
                  <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                    <option value="percentage">Percentage (%) Off</option>
                    <option value="fixed">Fixed Amount ($) Off</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="input-group">
                    <label>Discount Value *</label>
                    <input className="input" type="number" step="0.1" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} required />
                  </div>
                  <div className="input-group">
                    <label>Minimum Order ($)</label>
                    <input className="input" type="number" step="1" value={form.min_purchase} onChange={e => setForm(p => ({ ...p, min_purchase: e.target.value }))} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Usage Limit (Blank for Unlimited)</label>
                  <input className="input" type="number" value={form.max_uses} onChange={e => setForm(p => ({ ...p, max_uses: e.target.value }))} placeholder="e.g. 100" />
                </div>
                <label className="filter-option" style={{ marginTop: '0.5rem', fontWeight: 800, cursor: 'pointer', background: 'var(--bg-secondary)', padding: '0.75rem', border: '2px solid #000', borderRadius: '8px' }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} /> Enable & Publish Coupon
                </label>
              </div>
              <div className="modal-footer" style={{ borderTop: '3px solid #000', paddingTop: '1.25rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)} style={{ border: '2.5px solid #000' }}>CANCEL</button>
                <button type="submit" className="btn btn-primary btn-lg" style={{ boxShadow: '4px 4px 0px #000' }}>{editingId ? 'SAVE CHANGES' : 'CREATE DISCOUNT'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

