'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { authHeaders } from '@/lib/admin-client';
import { AdminHeader, Field } from '@/components/admin/AdminUI';

type Settings = Record<string, string>;
interface Capabilities { persistent_storage: boolean; stripe: boolean; stripe_webhook: boolean; email: boolean; site_url: boolean; jwt_secret: boolean }

const card: React.CSSProperties = { background: '#FFF', border: '3.5px solid #000', boxShadow: '5px 5px 0px #000', borderRadius: '12px', padding: '1.5rem' };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={card}>
      <h3 style={{ fontStyle: 'italic', marginBottom: '1.25rem', borderBottom: '3px solid #000', paddingBottom: '0.6rem' }}>{title}</h3>
      <div style={{ display: 'grid', gap: '1rem' }}>{children}</div>
    </section>
  );
}

function Check({ ok, label, help }: { ok: boolean; label: string; help: string }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
      <span className={`badge ${ok ? 'badge-green' : 'badge-red'}`} style={{ transform: 'none', minWidth: '3.2rem', textAlign: 'center' }}>{ok ? 'OK' : 'TODO'}</span>
      <div><strong>{label}</strong><div style={{ fontSize: '0.8rem', color: '#555', fontWeight: 600 }}>{help}</div></div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [s, setS] = useState<Settings>({});
  const [caps, setCaps] = useState<Capabilities | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/settings?all=true', { headers: authHeaders(token, false) });
    if (res.ok) {
      const d = await res.json();
      setS(d.settings || {});
      setCaps(d.capabilities || null);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setS(p => ({ ...p, [key]: e.target.value }));
  const flag = (key: string) => s[key] !== 'false';
  const setFlag = (key: string, on: boolean) => setS(p => ({ ...p, [key]: on ? 'true' : 'false' }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/settings', { method: 'PUT', headers: authHeaders(token), body: JSON.stringify(s) });
    if (res.ok) showToast('Settings saved'); else showToast((await res.json()).error || 'Could not save settings', 'error');
    setSaving(false);
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <AdminHeader badge="SYSTEM" title="STORE" accent="SETTINGS" subtitle="Everything here is read live by the storefront, cart, checkout and emails." />

      <div style={{ display: 'grid', gap: '2rem', maxWidth: '900px' }}>
        {caps && (
          <Section title="LAUNCH READINESS">
            <Check ok={caps.persistent_storage} label="Persistent storage" help="The database must live on a disk that survives restarts (a VPS, or a Docker volume with DB_PATH set). On serverless hosts such as Vercel storage is temporary, so the shop refuses orders until you move it to a persistent host." />
            <Check ok={caps.jwt_secret} label="JWT_SECRET set" help="Required in production so login sessions can't be forged. Set it as an environment variable." />
            <Check ok={caps.site_url} label="NEXT_PUBLIC_SITE_URL set" help="Your public address (https://yourshop.com). Used for emails, the sitemap and payment redirects." />
            <Check ok={caps.email} label="Email provider connected" help="Set RESEND_API_KEY and EMAIL_FROM to send order confirmations, shipping updates and password resets." />
            <Check ok={caps.stripe} label="Card payments (Stripe) connected" help="Set STRIPE_SECRET_KEY to accept cards. Until then only cash on delivery is offered." />
            <Check ok={caps.stripe_webhook} label="Stripe webhook secret" help="Add a webhook to /api/stripe/webhook and set STRIPE_WEBHOOK_SECRET so payments confirm even if the customer closes the tab." />
          </Section>
        )}

        <form onSubmit={save} style={{ display: 'grid', gap: '2rem' }}>
          <Section title="STORE DETAILS">
            <div style={grid2}>
              <Field label="Store name"><input className="input" value={s.store_name || ''} onChange={set('store_name')} /></Field>
              <Field label="Tagline"><input className="input" value={s.store_tagline || ''} onChange={set('store_tagline')} /></Field>
              <Field label="Support email" hint="Contact-form messages are emailed here"><input className="input" type="email" value={s.store_email || ''} onChange={set('store_email')} /></Field>
              <Field label="Phone"><input className="input" value={s.store_phone || ''} onChange={set('store_phone')} /></Field>
            </div>
            <Field label="Business address (shown in the footer)"><textarea className="input" rows={2} value={s.store_address || ''} onChange={set('store_address')} /></Field>
            <div style={grid2}>
              <Field label="Currency code"><input className="input" value={s.currency || ''} onChange={set('currency')} placeholder="USD" /></Field>
              <Field label="Currency symbol"><input className="input" value={s.currency_symbol || ''} onChange={set('currency_symbol')} placeholder="$" /></Field>
            </div>
            <label style={{ fontWeight: 800, cursor: 'pointer', background: s.maintenance_mode === 'true' ? 'var(--accent-yellow)' : 'var(--bg-secondary)', padding: '0.75rem', border: '2px solid #000', borderRadius: '8px' }}>
              <input type="checkbox" checked={s.maintenance_mode === 'true'} onChange={e => setFlag('maintenance_mode', e.target.checked)} /> Maintenance mode (shows a &quot;back soon&quot; page to visitors; admins can still log in)
            </label>
          </Section>

          <Section title="ANNOUNCEMENT BAR">
            <label style={{ fontWeight: 800, cursor: 'pointer' }}><input type="checkbox" checked={flag('announcement_enabled')} onChange={e => setFlag('announcement_enabled', e.target.checked)} /> Show the scrolling bar at the top of the site</label>
            <Field label="Messages" hint="Separate messages with the | character"><textarea className="input" rows={2} value={s.announcement_text || ''} onChange={set('announcement_text')} /></Field>
          </Section>

          <Section title="SHIPPING & TAX">
            <div style={grid2}>
              <Field label="Standard shipping rate"><input className="input" type="number" min="0" step="0.01" value={s.shipping_flat_rate || ''} onChange={set('shipping_flat_rate')} /></Field>
              <Field label="Express shipping rate"><input className="input" type="number" min="0" step="0.01" value={s.express_shipping_rate || ''} onChange={set('express_shipping_rate')} /></Field>
              <Field label="Free standard shipping over" hint="Set 0 to always charge shipping"><input className="input" type="number" min="0" step="0.01" value={s.free_shipping_threshold || ''} onChange={set('free_shipping_threshold')} /></Field>
              <Field label="Tax rate (%)"><input className="input" type="number" min="0" step="0.01" value={s.tax_rate || ''} onChange={set('tax_rate')} /></Field>
              <Field label="Delivery estimate (business days)" hint="e.g. 3-5"><input className="input" value={s.shipping_estimate_days || ''} onChange={set('shipping_estimate_days')} /></Field>
              <Field label="Return window (days)"><input className="input" type="number" min="0" value={s.return_days || ''} onChange={set('return_days')} /></Field>
            </div>
          </Section>

          <Section title="INVENTORY">
            <Field label="Low-stock threshold" hint="Products at or below this level appear in low-stock alerts"><input className="input" type="number" min="0" value={s.low_stock_threshold || ''} onChange={set('low_stock_threshold')} style={{ maxWidth: '200px' }} /></Field>
          </Section>

          <Section title="PAYMENT METHODS">
            <label style={{ fontWeight: 800, cursor: 'pointer' }}><input type="checkbox" checked={flag('cod_enabled')} onChange={e => setFlag('cod_enabled', e.target.checked)} /> Cash on delivery</label>
            <label style={{ fontWeight: 800, cursor: caps?.stripe ? 'pointer' : 'not-allowed', opacity: caps?.stripe ? 1 : 0.55 }}>
              <input type="checkbox" disabled={!caps?.stripe} checked={caps?.stripe ? flag('card_enabled') : false} onChange={e => setFlag('card_enabled', e.target.checked)} /> Credit / debit card via Stripe {caps?.stripe ? '' : '(connect Stripe first, see Launch Readiness)'}
            </label>
          </Section>

          <Section title="SOCIAL LINKS">
            <div style={grid2}>
              <Field label="Instagram URL"><input className="input" value={s.social_instagram || ''} onChange={set('social_instagram')} placeholder="https://instagram.com/…" /></Field>
              <Field label="X / Twitter URL"><input className="input" value={s.social_x || ''} onChange={set('social_x')} /></Field>
              <Field label="Facebook URL"><input className="input" value={s.social_facebook || ''} onChange={set('social_facebook')} /></Field>
              <Field label="YouTube URL"><input className="input" value={s.social_youtube || ''} onChange={set('social_youtube')} /></Field>
            </div>
          </Section>

          <Section title="SEO & ANALYTICS">
            <Field label="Default page title"><input className="input" value={s.seo_title || ''} onChange={set('seo_title')} /></Field>
            <Field label="Default meta description"><textarea className="input" rows={2} value={s.seo_description || ''} onChange={set('seo_description')} /></Field>
            <Field label="Google Analytics measurement ID" hint="e.g. G-XXXXXXXXXX. Leave blank to disable tracking."><input className="input" value={s.analytics_id || ''} onChange={set('analytics_id')} placeholder="G-XXXXXXXXXX" style={{ maxWidth: '280px' }} /></Field>
          </Section>

          <div><button type="submit" className="btn btn-primary btn-lg" disabled={saving} style={{ boxShadow: '4px 4px 0px #000' }}>{saving ? 'SAVING…' : 'SAVE ALL SETTINGS'}</button></div>
        </form>
      </div>
    </div>
  );
}
