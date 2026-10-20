import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const addresses = getDb().prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').all(user.userId);
    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Addresses GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const b = await request.json();
    for (const f of ['street', 'city', 'state', 'zip']) {
      if (!String(b[f] ?? '').trim()) return NextResponse.json({ error: 'Street, city, state and ZIP are required' }, { status: 400 });
    }
    const db = getDb();
    const id = uuid();
    const hasAny = db.prepare('SELECT 1 FROM addresses WHERE user_id = ?').get(user.userId);
    const makeDefault = b.is_default || !hasAny;
    db.transaction(() => {
      if (makeDefault) db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(user.userId);
      db.prepare(`INSERT INTO addresses (id, user_id, label, first_name, last_name, street, city, state, zip, country, phone, is_default)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        id, user.userId, b.label || 'Home', b.first_name || '', b.last_name || '', b.street.trim(), b.city.trim(), b.state.trim(), b.zip.trim(),
        b.country || 'US', b.phone || '', makeDefault ? 1 : 0
      );
    })();
    return NextResponse.json({ address: db.prepare('SELECT * FROM addresses WHERE id = ?').get(id) }, { status: 201 });
  } catch (error) {
    console.error('Addresses POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
