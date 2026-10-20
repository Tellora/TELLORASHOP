'use client';
import React, { createContext, useContext, useMemo, ReactNode } from 'react';

export type PublicSettings = Record<string, string>;

const num = (v: string | undefined, fallback: number) => {
  const n = parseFloat(v ?? '');
  return Number.isFinite(n) ? n : fallback;
};

function derive(s: PublicSettings) {
  return {
    raw: s,
    storeName: s.store_name || 'Our Store',
    tagline: s.store_tagline || '',
    email: s.store_email || '',
    phone: s.store_phone || '',
    address: s.store_address || '',
    currency: s.currency || 'USD',
    symbol: s.currency_symbol || '$',
    taxRate: num(s.tax_rate, 0),
    shippingFlat: num(s.shipping_flat_rate, 0),
    shippingExpress: num(s.express_shipping_rate, 0),
    freeShippingThreshold: num(s.free_shipping_threshold, 0),
    deliveryDays: s.shipping_estimate_days || '3-5',
    returnDays: num(s.return_days, 30),
    lowStock: num(s.low_stock_threshold, 5),
    codEnabled: s.cod_enabled !== 'false',
    cardEnabled: s.card_enabled !== 'false' && s.card_available === 'true',
    announcements: s.announcement_enabled === 'false' ? [] : (s.announcement_text || '').split('|').map(x => x.trim()).filter(Boolean),
    maintenance: s.maintenance_mode === 'true',
    social: {
      instagram: s.social_instagram, x: s.social_x, facebook: s.social_facebook, youtube: s.social_youtube,
    },
  };
}

export type StoreSettings = ReturnType<typeof derive>;

const SettingsContext = createContext<StoreSettings>(derive({}));

export function SettingsProvider({ initial, children }: { initial: PublicSettings; children: ReactNode }) {
  const value = useMemo(() => derive(initial), [initial]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);

/** Format a number as store currency, e.g. $12.50 */
export function useMoney() {
  const { symbol } = useSettings();
  return (n: number) => `${symbol}${Number(n || 0).toFixed(2)}`;
}
