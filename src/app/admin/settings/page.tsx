'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data.settings || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        showToast('Settings saved successfully!');
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch {
      showToast('Network error saving settings', 'error');
    }
    setSaving(false);
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div className="brutal-badge-slanted brutal-badge-purple" style={{ marginBottom: '0.5rem' }}>
            SYSTEM CONFIGURATION
          </div>
          <h1 className="admin-page-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontStyle: 'italic', fontWeight: 900, margin: 0 }}>
            STORE <span style={{ color: 'var(--accent-purple)' }}>SETTINGS</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginTop: '0.25rem' }}>
            Configure global store properties, financial taxes, shipping rules, and SEO defaults.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* General settings */}
          <div className="card" style={{ background: '#FFF', border: '3.5px solid #000', borderRadius: '12px', boxShadow: '5px 5px 0px #000', padding: '1.75rem' }}>
            <h3 style={{ fontStyle: 'italic', fontWeight: 900, marginBottom: '1.25rem', borderBottom: '2.5px solid #000', paddingBottom: '0.5rem' }}>GENERAL STORE DETAILS</h3>
            <div className="input-group">
              <label>Store Name *</label>
              <input className="input" value={settings.store_name || ''} onChange={e => handleChange('store_name', e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Tagline / Motto</label>
              <input className="input" value={settings.store_tagline || ''} onChange={e => handleChange('store_tagline', e.target.value)} />
            </div>
            <div className="input-group">
              <label>Support Email Address</label>
              <input className="input" type="email" value={settings.store_email || ''} onChange={e => handleChange('store_email', e.target.value)} />
            </div>
            <div className="input-group">
              <label>Support Phone Number</label>
              <input className="input" value={settings.store_phone || ''} onChange={e => handleChange('store_phone', e.target.value)} />
            </div>
          </div>

          {/* Pricing / Tax settings */}
          <div className="card" style={{ background: '#FFF', border: '3.5px solid #000', borderRadius: '12px', boxShadow: '5px 5px 0px #000', padding: '1.75rem' }}>
            <h3 style={{ fontStyle: 'italic', fontWeight: 900, marginBottom: '1.25rem', borderBottom: '2.5px solid #000', paddingBottom: '0.5rem' }}>FINANCIALS & CURRENCY</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="input-group">
                <label>Currency ISO Code</label>
                <input className="input" value={settings.currency || 'USD'} onChange={e => handleChange('currency', e.target.value)} />
              </div>
              <div className="input-group">
                <label>Currency Symbol</label>
                <input className="input" value={settings.currency_symbol || '$'} onChange={e => handleChange('currency_symbol', e.target.value)} />
              </div>
            </div>
            <div className="input-group">
              <label>Sales Tax Rate (%)</label>
              <input className="input" type="number" step="0.01" value={settings.tax_rate || '8.5'} onChange={e => handleChange('tax_rate', e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Shipping configurations */}
          <div className="card" style={{ background: '#FFF', border: '3.5px solid #000', borderRadius: '12px', boxShadow: '5px 5px 0px #000', padding: '1.75rem' }}>
            <h3 style={{ fontStyle: 'italic', fontWeight: 900, marginBottom: '1.25rem', borderBottom: '2.5px solid #000', paddingBottom: '0.5rem' }}>SHIPPING RULES</h3>
            <div className="input-group">
              <label>Flat Rate Shipping Fee ($)</label>
              <input className="input" type="number" step="0.01" value={settings.shipping_flat_rate || '9.99'} onChange={e => handleChange('shipping_flat_rate', e.target.value)} />
            </div>
            <div className="input-group">
              <label>Free Shipping Minimum Threshold ($)</label>
              <input className="input" type="number" step="1" value={settings.free_shipping_threshold || '75'} onChange={e => handleChange('free_shipping_threshold', e.target.value)} />
            </div>
          </div>

          {/* SEO configurations */}
          <div className="card" style={{ background: '#FFF', border: '3.5px solid #000', borderRadius: '12px', boxShadow: '5px 5px 0px #000', padding: '1.75rem', borderLeft: '8px solid var(--accent-blue)' }}>
            <h3 style={{ fontStyle: 'italic', fontWeight: 900, marginBottom: '1.25rem', borderBottom: '2.5px solid #000', paddingBottom: '0.5rem' }}>SEARCH ENGINE OPTIMIZATION</h3>
            <div className="input-group">
              <label>Default Store Meta Title</label>
              <input className="input" value={settings.seo_title || ''} onChange={e => handleChange('seo_title', e.target.value)} />
            </div>
            <div className="input-group">
              <label>Default Meta Description</label>
              <textarea className="input" rows={3} value={settings.seo_description || ''} onChange={e => handleChange('seo_description', e.target.value)} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-full" style={{ boxShadow: '4px 4px 0px #000' }} disabled={saving}>
            {saving ? 'SAVING CONFIGURATION...' : 'SAVE ALL STORE SETTINGS'}
          </button>
        </div>
      </form>
    </div>
  );
}

