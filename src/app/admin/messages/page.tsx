'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { authHeaders } from '@/lib/admin-client';
import { AdminHeader } from '@/components/admin/AdminUI';

interface Message { id: string; name: string; email: string; subject: string; message: string; status: 'new' | 'read' | 'replied'; created_at: string }

export default function AdminMessagesPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch('/api/contact', { headers: authHeaders(token, false) });
    if (res.ok) setMessages((await res.json()).messages || []);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (token) load();
  }, [token, load]);

  const setStatus = async (m: Message, status: Message['status']) => {
    await fetch(`/api/contact/${m.id}`, { method: 'PUT', headers: authHeaders(token), body: JSON.stringify({ status }) });
    setMessages(prev => prev.map(x => (x.id === m.id ? { ...x, status } : x)));
  };

  const remove = async (m: Message) => {
    if (!window.confirm('Delete this message?')) return;
    const res = await fetch(`/api/contact/${m.id}`, { method: 'DELETE', headers: authHeaders(token, false) });
    if (res.ok) { setMessages(prev => prev.filter(x => x.id !== m.id)); showToast('Message deleted'); }
  };

  const shown = messages.filter(m => !filter || m.status === filter);
  const colour = { new: 'badge-red', read: 'badge-yellow', replied: 'badge-green' } as const;

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <AdminHeader badge="SUPPORT" title="CUSTOMER" accent="MESSAGES" subtitle="Messages sent from the Contact page. Reply by email, then mark them replied." />
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['', 'new', 'read', 'replied'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className="btn btn-sm" style={{ border: '2.5px solid #000', background: filter === s ? 'var(--accent-yellow)' : '#FFF', boxShadow: filter === s ? '3px 3px 0 #000' : 'none' }}>
            {s ? s.toUpperCase() : 'ALL'} ({s ? messages.filter(m => m.status === s).length : messages.length})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card text-center" style={{ background: '#FFF', border: '3px solid #000', borderRadius: '12px', padding: '2rem', fontWeight: 700 }}>No messages.</div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {shown.map(m => (
            <div key={m.id} className="card" style={{ background: '#FFF', border: '3px solid #000', boxShadow: '4px 4px 0px #000', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div>
                  <strong>{m.name}</strong> &lt;{m.email}&gt;
                  <div style={{ fontSize: '0.8rem', color: '#666', fontFamily: 'var(--font-mono)' }}>{new Date(m.created_at.replace(' ', 'T') + 'Z').toLocaleString()}</div>
                </div>
                <span className={`badge ${colour[m.status]}`} style={{ transform: 'none', alignSelf: 'flex-start' }}>{m.status.toUpperCase()}</span>
              </div>
              {m.subject && <div style={{ fontWeight: 900, marginBottom: '0.4rem' }}>{m.subject}</div>}
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, marginBottom: '1rem' }}>{m.message}</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (m.subject || 'your message'))}`} onClick={() => setStatus(m, 'replied')} className="btn btn-sm btn-primary" style={{ padding: '0.35rem 0.8rem' }}>REPLY BY EMAIL</a>
                {m.status !== 'read' && <button onClick={() => setStatus(m, 'read')} className="btn btn-sm" style={{ border: '2px solid #000' }}>MARK READ</button>}
                {m.status !== 'new' && <button onClick={() => setStatus(m, 'new')} className="btn btn-sm" style={{ border: '2px solid #000' }}>MARK NEW</button>}
                <button onClick={() => remove(m)} className="btn btn-sm btn-danger">DELETE</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
