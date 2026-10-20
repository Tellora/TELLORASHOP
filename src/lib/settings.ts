import type Database from 'better-sqlite3';
import { getDb } from '@/lib/db';
import { PUBLIC_SETTING_KEYS } from '@/lib/schema-extras';

export type SettingsMap = Record<string, string>;

export function getAllSettings(db: Database.Database = getDb()): SettingsMap {
  const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string | null }>;
  const map: SettingsMap = {};
  for (const r of rows) map[r.key] = r.value ?? '';
  return map;
}

/** Only the settings the storefront needs; safe to send to any visitor. */
export function getPublicSettings(db: Database.Database = getDb()): SettingsMap {
  const all = getAllSettings(db);
  const out: SettingsMap = {};
  for (const key of Object.keys(all)) if (PUBLIC_SETTING_KEYS.has(key)) out[key] = all[key];
  // Never expose the analytics/other admin-only values beyond what the page needs
  out.card_available = isStripeConfigured() ? 'true' : 'false';
  return out;
}

export function num(map: SettingsMap, key: string, fallback: number): number {
  const n = parseFloat(map[key] ?? '');
  return Number.isFinite(n) ? n : fallback;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function siteUrl(request?: Request): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  if (request) return new URL(request.url).origin;
  return 'http://localhost:3000';
}
