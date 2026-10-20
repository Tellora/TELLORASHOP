'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';

function ChangePassword() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) { showToast('New passwords do not match', 'error'); return; }
    setSaving(true);
    const res = await fetch('/api/auth/password', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ current_password: current, new_password: next }) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) { showToast('Password changed'); setCurrent(''); setNext(''); setConfirm(''); } else showToast(data.error || 'Could not change password', 'error');
    setSaving(false);
  };

  return (
    <div className="card mt-2">
      <h2 style={{ fontFamily: 'var(--font-mono)', marginBottom: '1.5rem' }}>SECURITY</h2>
      <form onSubmit={submit}>
        <div className="input-group"><label>Current password</label><input className="input" type="password" autoComplete="current-password" required value={current} onChange={e => setCurrent(e.target.value)} /></div>
        <div className="input-group"><label>New password (8+ characters)</label><input className="input" type="password" autoComplete="new-password" required minLength={8} value={next} onChange={e => setNext(e.target.value)} /></div>
        <div className="input-group"><label>Confirm new password</label><input className="input" type="password" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} /></div>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'SAVING...' : 'CHANGE PASSWORD'}</button>
      </form>
    </div>
  );
}

export default function AccountProfilePage() {
  const { user, token, updateUser } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, phone }),
      });
      if (res.ok) {
        const data = await res.json();
        updateUser(data.user);
        showToast('Profile updated!');
      } else { showToast('Error updating profile', 'error'); }
    } catch { showToast('Error updating profile', 'error'); }
    setLoading(false);
  };

  return (
    <div>
      <div className="card">
        <h2 style={{ fontFamily: 'var(--font-mono)', marginBottom: '1.5rem' }}>PROFILE SETTINGS</h2>
        <form onSubmit={handleSave}>
          <div className="input-group"><label>Email</label><input className="input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} /></div>
          <div className="input-group"><label>Full Name</label><input className="input" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="input-group"><label>Phone</label><input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 234 567 890" /></div>
          <div className="input-group"><label>Role</label><input className="input" value={user?.role || ''} disabled style={{ opacity: 0.6 }} /></div>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'SAVING...' : 'SAVE CHANGES'}</button>
        </form>
      </div>
      <ChangePassword />
    </div>
  );
}
