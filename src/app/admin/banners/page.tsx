'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { authHeaders } from '@/lib/admin-client';
import { AdminHeader, AdminModal, AdminTable, Field, td } from '@/components/admin/AdminUI';

interface Banner {
  id: string; title: string; subtitle: string; image: string | null; link: string; button_text: string; sort_order: number; is_active: number;
}

const EMPTY = { title: '', subtitle: '', image: '', link: '/shop', button_text: 'SHOP NOW', sort_order: '0', is_active: true };

export default function AdminBannersPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    const res = await fetch('/api/banners?all=true', { headers: authHeaders(token, false) });
    if (res.ok) setBanners((await res.json()).banners || []);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  const openNew = () => { setEditingId(null); setForm({ ...EMPTY, sort_order: String(banners.length + 1) }); setOpen(true); };
  const openEdit = (b: Banner) => {
    setEditingId(b.id);
    setForm({ title: b.title, subtitle: b.subtitle || '', image: b.image || '', link: b.link || '/shop', button_text: b.button_text || '', sort_order: String(b.sort_order), is_active: b.is_active === 1 });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(editingId ? `/api/banners/${editingId}` : '/api/banners', {
      method: editingId ? 'PUT' : 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ ...form, sort_order: Number(form.sort_order) || 0, image: form.image || null }),
    });
    if (res.ok) { showToast(editingId ? 'Banner updated' : 'Banner created'); setOpen(false); load(); }
    else showToast((await res.json()).error || 'Could not save banner', 'error');
  };

  const toggle = async (b: Banner) => {
    await fetch(`/api/banners/${b.id}`, { method: 'PUT', headers: authHeaders(token), body: JSON.stringify({ is_active: b.is_active !== 1 }) });
    load();
  };

  const remove = async (b: Banner) => {
    if (!window.confirm(`Delete banner "${b.title}"?`)) return;
    const res = await fetch(`/api/banners/${b.id}`, { method: 'DELETE', headers: authHeaders(token, false) });
    if (res.ok) { showToast('Banner deleted'); load(); } else showToast('Could not delete banner', 'error');
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <AdminHeader
        badge="MARKETING" title="HOMEPAGE" accent="BANNERS"
        subtitle="The first active banner (lowest order number) is shown in the homepage hero. Add more to rotate promotions."
        actions={<button onClick={openNew} className="btn btn-primary btn-lg" style={{ boxShadow: '4px 4px 0px #000' }}>+ NEW BANNER</button>}
      />

      <AdminTable headers={['Order', 'Banner', 'Link', 'Status', 'Actions']} empty="No banners yet. The homepage will show its default hero.">
        {banners.map(b => (
          <tr key={b.id}>
            <td style={{ ...td, fontFamily: 'var(--font-mono)', fontWeight: 900 }}>{b.sort_order}</td>
            <td style={td}>
              <div style={{ fontWeight: 900 }}>{b.title}</div>
              <div style={{ color: '#555', fontSize: '0.85rem' }}>{b.subtitle}</div>
              {b.button_text && <span className="badge badge-yellow" style={{ transform: 'none', marginTop: '0.4rem' }}>{b.button_text}</span>}
            </td>
            <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{b.link}</td>
            <td style={td}>
              <button onClick={() => toggle(b)} className={`badge ${b.is_active === 1 ? 'badge-green' : 'badge-red'}`} style={{ transform: 'none', cursor: 'pointer', border: '2px solid #000' }}>
                {b.is_active === 1 ? 'Active' : 'Hidden'}
              </button>
            </td>
            <td style={td}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button onClick={() => openEdit(b)} className="btn btn-sm btn-primary" style={{ padding: '0.35rem 0.65rem' }}>EDIT</button>
                <button onClick={() => remove(b)} className="btn btn-sm btn-danger" style={{ padding: '0.35rem 0.65rem' }}>DEL</button>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>

      {open && (
        <AdminModal title={editingId ? 'EDIT BANNER' : 'NEW BANNER'} onClose={() => setOpen(false)} onSubmit={save} submitLabel={editingId ? 'SAVE CHANGES' : 'CREATE BANNER'}>
          <Field label="Headline *"><input className="input" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="SUMMER COLLECTION" /></Field>
          <Field label="Subtitle"><input className="input" value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} placeholder="Up to 40% off" /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Field label="Button text"><input className="input" value={form.button_text} onChange={e => setForm(p => ({ ...p, button_text: e.target.value }))} /></Field>
            <Field label="Button link" hint="e.g. /shop or /shop?category=sports"><input className="input" value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} /></Field>
          </div>
          <Field label="Background image URL (optional)"><input className="input" value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))} placeholder="https://..." /></Field>
          <Field label="Display order" hint="Lower numbers first"><input className="input" type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: e.target.value }))} /></Field>
          <label style={{ fontWeight: 800, cursor: 'pointer' }}><input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} /> Show on the storefront</label>
        </AdminModal>
      )}
    </div>
  );
}
