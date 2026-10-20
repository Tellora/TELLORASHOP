import type Database from 'better-sqlite3';
import { getDb } from '@/lib/db';
import { PUBLIC_SETTING_KEYS, DEFAULT_SETTINGS } from '@/lib/schema-extras';

export type SettingsMap = Record<string, string>;

export function getAllSettings(db?: Database.Database): SettingsMap {
  const map: SettingsMap = {};
  for (const d of DEFAULT_SETTINGS) map[d.key] = d.value;
  try {
    const rows = (db ?? getDb()).prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string | null }>;
    for (const r of rows) map[r.key] = r.value ?? '';
  } catch (error) {
    // If the database is unavailable the pages must still render, so fall back to the built-in defaults
    console.error('Could not read settings, using defaults:', error);
  }
  return map;
}

/** Only the settings the storefront needs; safe to send to any visitor. */
export function getPublicSettings(db?: Database.Database): SettingsMap {
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
  // Vercel sets these automatically
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  if (request) return new URL(request.url).origin;
  return 'http://localhost:3000';
}
