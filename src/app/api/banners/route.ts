import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const wantsAll = new URL(request.url).searchParams.get('all') === 'true';
    let sql = 'SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order ASC';
    if (wantsAll) {
      const user = await getCurrentUser(request);
      if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      sql = 'SELECT * FROM banners ORDER BY sort_order ASC';
    }
    const banners = db.prepare(sql).all();
    return NextResponse.json({ banners });
  } catch (error) {
    console.error('Banners GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { title, subtitle, image, link, button_text, sort_order, is_active } = body;
    if (!title || !String(title).trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    const db = getDb();
    const id = uuid();
    db.prepare('INSERT INTO banners (id, title, subtitle, image, link, button_text, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      id, String(title).trim(), subtitle || '', image || null, link || '/shop', button_text || 'Shop Now', Number(sort_order) || 0, is_active !== false ? 1 : 0
    );
    const banner = db.prepare('SELECT * FROM banners WHERE id = ?').get(id);
    return NextResponse.json({ banner }, { status: 201 });
  } catch (error) {
    console.error('Banners POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
