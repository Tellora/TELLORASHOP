'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';

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
    </div>
  );
}
