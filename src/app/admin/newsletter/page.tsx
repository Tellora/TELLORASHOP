'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { authHeaders, downloadExport } from '@/lib/admin-client';
import { AdminHeader, AdminTable, td } from '@/components/admin/AdminUI';

interface Subscriber { id: string; email: string; is_active: number; created_at: string }

export default function AdminNewsletterPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/newsletter', { headers: authHeaders(token, false) });
    if (res.ok) setSubs((await res.json()).subscribers || []);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (token) load();
  }, [token, load]);

  const remove = async (s: Subscriber) => {
    if (!window.confirm(`Remove ${s.email}?`)) return;
    const res = await fetch(`/api/newsletter?id=${s.id}`, { method: 'DELETE', headers: authHeaders(token, false) });
    if (res.ok) { setSubs(prev => prev.filter(x => x.id !== s.id)); showToast('Subscriber removed'); }
  };

  const shown = subs.filter(s => s.email.includes(search.toLowerCase()));

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <AdminHeader
        badge="MARKETING" title="NEWSLETTER" accent="SUBSCRIBERS"
        subtitle={`${subs.filter(s => s.is_active).length} active subscribers. Export the list to send campaigns from your email tool.`}
        actions={<button className="btn btn-primary btn-lg" style={{ boxShadow: '4px 4px 0px #000' }} onClick={async () => { if (!(await downloadExport('subscribers', token))) showToast('Export failed', 'error'); }}>EXPORT CSV</button>}
      />
      <input className="input" placeholder="Search emails…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '320px', marginBottom: '1.5rem' }} />
      <AdminTable headers={['Email', 'Status', 'Subscribed', 'Actions']} empty="No subscribers yet.">
        {shown.map(s => (
          <tr key={s.id}>
            <td style={{ ...td, fontWeight: 800 }}>{s.email}</td>
            <td style={td}><span className={`badge ${s.is_active ? 'badge-green' : 'badge-red'}`} style={{ transform: 'none' }}>{s.is_active ? 'Active' : 'Unsubscribed'}</span></td>
            <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{new Date(s.created_at.replace(' ', 'T') + 'Z').toLocaleDateString()}</td>
            <td style={td}><button onClick={() => remove(s)} className="btn btn-sm btn-danger" style={{ padding: '0.35rem 0.65rem' }}>REMOVE</button></td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
