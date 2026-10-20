'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';

interface Address {
  id: string; label: string; first_name: string; last_name: string; street: string; city: string; state: string; zip: string; country: string; phone: string; is_default: number;
}

const EMPTY = { label: 'Home', first_name: '', last_name: '', street: '', city: '', state: '', zip: '', country: 'US', phone: '', is_default: false };

export default function AddressesPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState(EMPTY);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    const res = await fetch('/api/addresses', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setAddresses((await res.json()).addresses || []);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (token) load();
  }, [token, load]);

  const startNew = () => { setForm(EMPTY); setEditing('new'); };
  const startEdit = (a: Address) => { setForm({ label: a.label, first_name: a.first_name || '', last_name: a.last_name || '', street: a.street, city: a.city, state: a.state, zip: a.zip, country: a.country || 'US', phone: a.phone || '', is_default: a.is_default === 1 }); setEditing(a.id); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(editing === 'new' ? '/api/addresses' : `/api/addresses/${editing}`, { method: editing === 'new' ? 'POST' : 'PUT', headers, body: JSON.stringify(form) });
    if (res.ok) { showToast('Address saved'); setEditing(null); load(); } else showToast((await res.json()).error || 'Could not save address', 'error');
  };

  const remove = async (a: Address) => {
    if (!window.confirm('Delete this address?')) return;
    const res = await fetch(`/api/addresses/${a.id}`, { method: 'DELETE', headers });
    if (res.ok) { showToast('Address deleted'); load(); }
  };

  const makeDefault = async (a: Address) => {
    await fetch(`/api/addresses/${a.id}`, { method: 'PUT', headers, body: JSON.stringify({ is_default: true }) });
    load();
  };

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontFamily: 'var(--font-mono)' }}>ADDRESS BOOK</h2>
        {!editing && <button className="btn btn-primary" onClick={startNew}>+ ADD ADDRESS</button>}
      </div>

      {editing && (
        <form onSubmit={save} className="card mb-2">
          <h3 style={{ marginBottom: '1rem' }}>{editing === 'new' ? 'New address' : 'Edit address'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <div className="input-group"><label>Label</label><input className="input" value={form.label} onChange={set('label')} placeholder="Home, Work…" /></div>
            <div className="input-group"><label>Phone</label><input className="input" value={form.phone} onChange={set('phone')} /></div>
            <div className="input-group"><label>First name</label><input className="input" value={form.first_name} onChange={set('first_name')} /></div>
            <div className="input-group"><label>Last name</label><input className="input" value={form.last_name} onChange={set('last_name')} /></div>
          </div>
          <div className="input-group"><label>Street address *</label><input className="input" required value={form.street} onChange={set('street')} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0 1rem' }}>
            <div className="input-group"><label>City *</label><input className="input" required value={form.city} onChange={set('city')} /></div>
            <div className="input-group"><label>State *</label><input className="input" required value={form.state} onChange={set('state')} /></div>
            <div className="input-group"><label>ZIP *</label><input className="input" required value={form.zip} onChange={set('zip')} /></div>
          </div>
          <label style={{ fontWeight: 700, cursor: 'pointer', display: 'block', marginBottom: '1rem' }}><input type="checkbox" checked={form.is_default} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} /> Use as my default address</label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary">SAVE ADDRESS</button>
            <button type="button" className="btn" onClick={() => setEditing(null)}>CANCEL</button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !editing ? (
        <div className="empty-state"><h3>No saved addresses</h3><p>Add one to check out faster next time.</p></div>
      ) : (
        <div className="grid grid-2">
          {addresses.map(a => (
            <div key={a.id} className="card" style={{ border: '3px solid #000' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong>{a.label}</strong>
                {a.is_default === 1 && <span className="badge badge-green" style={{ transform: 'none' }}>DEFAULT</span>}
              </div>
              <p>{[a.first_name, a.last_name].filter(Boolean).join(' ')}</p>
              <p>{a.street}</p>
              <p>{a.city}, {a.state} {a.zip}</p>
              {a.phone && <p>Tel: {a.phone}</p>}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button className="btn btn-sm" onClick={() => startEdit(a)}>EDIT</button>
                {a.is_default !== 1 && <button className="btn btn-sm" onClick={() => makeDefault(a)}>MAKE DEFAULT</button>}
                <button className="btn btn-sm btn-danger" onClick={() => remove(a)}>DELETE</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
