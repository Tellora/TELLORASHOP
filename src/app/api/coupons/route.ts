import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const coupons = db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error('Coupons GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { code, type, value, min_purchase, max_uses, starts_at, expires_at, is_active } = body;
    if (!code || !value) return NextResponse.json({ error: 'Code and value are required' }, { status: 400 });

    const db = getDb();
    const id = uuid();
    db.prepare(`INSERT INTO coupons (id, code, type, value, min_purchase, max_uses, starts_at, expires_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, code.toUpperCase(), type || 'percentage', value, min_purchase || 0, max_uses || null, starts_at || null, expires_at || null, is_active !== false ? 1 : 0
    );
    const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id);
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    console.error('Coupons POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
