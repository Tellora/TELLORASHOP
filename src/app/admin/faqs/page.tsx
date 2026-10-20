'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { authHeaders } from '@/lib/admin-client';
import { AdminHeader, AdminModal, AdminTable, Field, td } from '@/components/admin/AdminUI';

interface Faq { id: string; question: string; answer: string; sort_order: number; is_active: number }

export default function AdminFaqsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ question: '', answer: '', is_active: true });

  const load = useCallback(async () => {
    const res = await fetch('/api/faqs?all=true', { headers: authHeaders(token, false) });
    if (res.ok) setFaqs((await res.json()).faqs || []);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  const openNew = () => { setEditingId(null); setForm({ question: '', answer: '', is_active: true }); setOpen(true); };
  const openEdit = (f: Faq) => { setEditingId(f.id); setForm({ question: f.question, answer: f.answer, is_active: f.is_active === 1 }); setOpen(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(editingId ? `/api/faqs/${editingId}` : '/api/faqs', { method: editingId ? 'PUT' : 'POST', headers: authHeaders(token), body: JSON.stringify(form) });
    if (res.ok) { showToast('FAQ saved'); setOpen(false); load(); } else showToast((await res.json()).error || 'Could not save', 'error');
  };

  const remove = async (f: Faq) => {
    if (!window.confirm('Delete this FAQ?')) return;
    const res = await fetch(`/api/faqs/${f.id}`, { method: 'DELETE', headers: authHeaders(token, false) });
    if (res.ok) { showToast('FAQ deleted'); load(); }
  };

  // Swap sort_order with the neighbour
  const move = async (index: number, dir: -1 | 1) => {
    const other = faqs[index + dir];
    const current = faqs[index];
    if (!other) return;
    await Promise.all([
      fetch(`/api/faqs/${current.id}`, { method: 'PUT', headers: authHeaders(token), body: JSON.stringify({ sort_order: index + dir }) }),
      fetch(`/api/faqs/${other.id}`, { method: 'PUT', headers: authHeaders(token), body: JSON.stringify({ sort_order: index }) }),
    ]);
    load();
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <AdminHeader badge="CONTENT" title="HELP CENTER" accent="FAQS" subtitle="Questions shown on the public FAQ page."
        actions={<button onClick={openNew} className="btn btn-primary btn-lg" style={{ boxShadow: '4px 4px 0px #000' }}>+ NEW FAQ</button>} />
      <AdminTable headers={['Order', 'Question', 'Status', 'Actions']} empty="No FAQs yet.">
        {faqs.map((f, i) => (
          <tr key={f.id}>
            <td style={td}>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button className="btn btn-sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up" style={{ padding: '0.2rem 0.5rem', border: '2px solid #000' }}>↑</button>
                <button className="btn btn-sm" disabled={i === faqs.length - 1} onClick={() => move(i, 1)} aria-label="Move down" style={{ padding: '0.2rem 0.5rem', border: '2px solid #000' }}>↓</button>
              </div>
            </td>
            <td style={td}><div style={{ fontWeight: 900 }}>{f.question}</div><div style={{ color: '#555', fontSize: '0.85rem', maxWidth: '520px' }}>{f.answer.slice(0, 140)}{f.answer.length > 140 ? '…' : ''}</div></td>
            <td style={td}><span className={`badge ${f.is_active ? 'badge-green' : 'badge-red'}`} style={{ transform: 'none' }}>{f.is_active ? 'Published' : 'Hidden'}</span></td>
            <td style={td}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button onClick={() => openEdit(f)} className="btn btn-sm btn-primary" style={{ padding: '0.35rem 0.65rem' }}>EDIT</button>
                <button onClick={() => remove(f)} className="btn btn-sm btn-danger" style={{ padding: '0.35rem 0.65rem' }}>DEL</button>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>

      {open && (
        <AdminModal title={editingId ? 'EDIT FAQ' : 'NEW FAQ'} onClose={() => setOpen(false)} onSubmit={save} submitLabel="SAVE FAQ">
          <Field label="Question *"><input className="input" required value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} /></Field>
          <Field label="Answer *"><textarea className="input" required rows={5} value={form.answer} onChange={e => setForm(p => ({ ...p, answer: e.target.value }))} /></Field>
          <label style={{ fontWeight: 800, cursor: 'pointer' }}><input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} /> Show on the FAQ page</label>
        </AdminModal>
      )}
    </div>
  );
}
