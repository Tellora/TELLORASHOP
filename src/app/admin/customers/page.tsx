'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { downloadExport } from '@/lib/admin-client';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_active: number;
  created_at: string;
  order_count: number;
  total_spent: number;
}

export default function AdminCustomersPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [roleView, setRoleView] = useState<'customer' | 'admin'>('customer');

  const fetchCustomers = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('role', roleView);
      params.set('limit', '200');
      
      const res = await fetch(`/api/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.users || []);
      }
    } catch {
      showToast('Error loading customers', 'error');
    }
    setLoading(false);
  }, [token, search, roleView, showToast]);

  useEffect(() => {
    if (token) fetchCustomers();
  }, [token, fetchCustomers]);

  const handleToggleStatus = async (id: string, currentStatus: number) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: currentStatus === 1 ? 0 : 1 })
      });
      if (res.ok) {
        showToast('Customer status updated');
        fetchCustomers();
      }
    } catch {
      showToast('Error updating customer', 'error');
    }
  };

  const handleRole = async (id: string, name: string, role: 'admin' | 'customer') => {
    if (!window.confirm(role === 'admin' ? `Give ${name} full admin access?` : `Remove admin access from ${name}?`)) return;
    const res = await fetch(`/api/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ role }) });
    if (res.ok) { showToast('Role updated'); fetchCustomers(); } else showToast((await res.json().catch(() => ({}))).error || 'Could not update role', 'error');
  };

  const handleReset = async (email: string) => {
    const res = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    showToast(res.ok ? `Password reset email sent to ${email} (if email is configured)` : 'Could not send reset email', res.ok ? 'success' : 'error');
  };

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div className="brutal-badge-slanted brutal-badge-purple" style={{ marginBottom: '0.5rem' }}>
            USER TELEMETRY & CRM
          </div>
          <h1 className="admin-page-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontStyle: 'italic', fontWeight: 900, margin: 0 }}>
            STORE <span style={{ color: 'var(--accent-purple)' }}>CUSTOMERS</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginTop: '0.25rem' }}>
            Review customer accounts, total order counts, lifetime spending (LTV), and account statuses.
          </p>
        </div>
      </div>

      <div className="shop-toolbar mb-2" style={{ background: '#FFF', border: '3px solid #000', borderRadius: '8px', boxShadow: '3px 3px 0px #000', padding: '0.85rem 1.25rem', marginBottom: '1.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="input"
          style={{ maxWidth: '320px', boxShadow: 'none', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
          placeholder="SEARCH BY NAME OR EMAIL..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchCustomers()}
        />
        <button onClick={fetchCustomers} className="btn btn-sm btn-dark">SEARCH</button>
        <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto' }}>
          {(['customer', 'admin'] as const).map(r => (
            <button key={r} onClick={() => setRoleView(r)} className="btn btn-sm" style={{ border: '2px solid #000', background: roleView === r ? 'var(--accent-yellow)' : '#FFF' }}>{r === 'customer' ? 'CUSTOMERS' : 'ADMINS'}</button>
          ))}
          <button className="btn btn-sm" style={{ border: '2px solid #000' }} onClick={async () => { if (!(await downloadExport('customers', token))) showToast('Export failed', 'error'); }}>EXPORT CSV</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : customers.length === 0 ? (
        <div className="card text-center p-3" style={{ background: '#FFF', border: '3px solid #000', borderRadius: '12px' }}>No registered customers found.</div>
      ) : (
        <div className="admin-table-wrapper" style={{ border: '3.5px solid #000', borderRadius: '12px', boxShadow: '5px 5px 0px #000', background: '#FFF', overflow: 'hidden' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '3px solid #000' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>CUSTOMER</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>EMAIL</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>PHONE</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>JOINED</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>ORDERS PLACED</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>LIFETIME SPENT (LTV)</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>STATUS</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => {
                const initials = c.name ? c.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'US';
                return (
                  <tr key={c.id} style={{ borderBottom: '2px solid #EEE' }}>
                    <td style={{ padding: '1rem', fontWeight: 800 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--accent-pink)', color: '#FFF', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: '#000' }}>{c.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{c.email}</td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{c.phone || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.85rem' }}>{c.order_count} orders</td>
                    <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.95rem', color: 'var(--accent-purple)' }}>
                      ${(c.total_spent || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${c.is_active === 1 ? 'badge-green' : 'badge-red'}`} style={{ transform: 'none' }}>
                        {c.is_active === 1 ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => handleReset(c.email)} className="btn btn-sm" style={{ padding: '0.35rem 0.65rem', fontSize: '0.7rem', border: '2px solid #000' }}>RESET PW</button>
                      <button onClick={() => handleRole(c.id, c.name, roleView === 'customer' ? 'admin' : 'customer')} className="btn btn-sm" style={{ padding: '0.35rem 0.65rem', fontSize: '0.7rem', border: '2px solid #000' }}>{roleView === 'customer' ? 'MAKE ADMIN' : 'REMOVE ADMIN'}</button>
                      <button
                        onClick={() => handleToggleStatus(c.id, c.is_active)}
                        className={`btn btn-sm ${c.is_active === 1 ? 'btn-danger' : 'btn-success'}`}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.7rem' }}
                      >
                        {c.is_active === 1 ? 'SUSPEND' : 'ACTIVATE'}
                      </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

