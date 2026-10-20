import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getAllSettings, getPublicSettings, isStripeConfigured } from '@/lib/settings';
import { v4 as uuid } from 'uuid';

// Public: only whitelisted storefront settings. Admin (?all=true): everything, plus server capabilities.
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);

    if (searchParams.get('all') === 'true') {
      const user = await getCurrentUser(request);
      if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return NextResponse.json({
        settings: getAllSettings(db),
        capabilities: {
          stripe: isStripeConfigured(),
          stripe_webhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
          email: Boolean(process.env.RESEND_API_KEY),
          site_url: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
          jwt_secret: Boolean(process.env.JWT_SECRET),
        },
      });
    }

    return NextResponse.json({ settings: getPublicSettings(db) });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const NON_NEGATIVE_NUMBERS = ['tax_rate', 'shipping_flat_rate', 'express_shipping_rate', 'free_shipping_threshold', 'low_stock_threshold', 'return_days'];

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    for (const key of NON_NEGATIVE_NUMBERS) {
      if (body[key] !== undefined) {
        const n = parseFloat(String(body[key]));
        if (!Number.isFinite(n) || n < 0) {
          return NextResponse.json({ error: `${key.replace(/_/g, ' ')} must be a number that is 0 or more` }, { status: 400 });
        }
      }
    }

    const db = getDb();
    const save = db.transaction(() => {
      for (const [key, value] of Object.entries(body)) {
        const existing = db.prepare('SELECT id FROM settings WHERE key = ?').get(key);
        if (existing) {
          db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(String(value), key);
        } else {
          db.prepare('INSERT INTO settings (id, key, value, group_name) VALUES (?, ?, ?, ?)').run(uuid(), key, String(value), 'general');
        }
      }
    });
    save();

    return NextResponse.json({ settings: getAllSettings(db) });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
