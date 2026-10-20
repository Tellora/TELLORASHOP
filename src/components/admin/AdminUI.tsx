'use client';
import React from 'react';

export function AdminHeader({ badge, title, accent, subtitle, actions }: {
  badge: string; title: string; accent: string; subtitle?: string; actions?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
      <div>
        <div className="brutal-badge-slanted brutal-badge-yellow" style={{ marginBottom: '0.75rem' }}>{badge}</div>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontStyle: 'italic', fontWeight: 900, margin: 0 }}>
          {title} <span style={{ color: 'var(--accent-purple)' }}>{accent}</span>
        </h1>
        {subtitle && <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginTop: '0.25rem' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

export function AdminTable({ headers, children, empty }: { headers: string[]; children: React.ReactNode; empty?: string }) {
  const hasRows = React.Children.count(children) > 0;
  if (!hasRows) {
    return <div className="card text-center" style={{ background: '#FFF', border: '3px solid #000', borderRadius: '12px', padding: '2rem', fontWeight: 700 }}>{empty || 'Nothing here yet.'}</div>;
  }
  return (
    <div className="admin-table-wrapper" style={{ border: '3.5px solid #000', borderRadius: '12px', boxShadow: '5px 5px 0px #000', background: '#FFF', overflowX: 'auto' }}>
      <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--bg-secondary)', borderBottom: '3px solid #000' }}>
            {headers.map(h => (
              <th key={h} style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export const td: React.CSSProperties = { padding: '1rem', verticalAlign: 'top', borderBottom: '2px solid #EEE' };

export function AdminModal({ title, onClose, onSubmit, submitLabel, children, wide }: {
  title: string; onClose: () => void; onSubmit: (e: React.FormEvent) => void; submitLabel: string; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="modal card" style={{ maxWidth: wide ? '720px' : '520px', width: '100%', maxHeight: '92vh', overflowY: 'auto', background: '#FFF', border: '4px solid #000', boxShadow: '8px 8px 0px #000', borderRadius: '16px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #000', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontStyle: 'italic', fontSize: '1.4rem', margin: 0 }}>{title}</h3>
          <button type="button" className="btn btn-sm" onClick={onClose} aria-label="Close" style={{ border: '2.5px solid #000', borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}>✕</button>
        </div>
        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>{children}</div>
          <div style={{ borderTop: '3px solid #000', paddingTop: '1.25rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" className="btn" onClick={onClose} style={{ border: '2.5px solid #000' }}>CANCEL</button>
            <button type="submit" className="btn btn-primary btn-lg" style={{ boxShadow: '4px 4px 0px #000' }}>{submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="input-group">
      <label>{label}</label>
      {children}
      {hint && <small style={{ color: '#666', fontWeight: 600 }}>{hint}</small>}
    </div>
  );
}
