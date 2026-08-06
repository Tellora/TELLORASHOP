import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function GET() {
  try {
    const db = getDb();
    const pages = db.prepare('SELECT * FROM pages ORDER BY created_at DESC').all();
    return NextResponse.json({ pages });
  } catch (error) {
    console.error('Pages GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { title, slug, content, is_published } = body;
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    const db = getDb();
    const id = uuid();
    const pageSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    db.prepare('INSERT INTO pages (id, title, slug, content, is_published) VALUES (?, ?, ?, ?, ?)').run(id, title, pageSlug, content || '', is_published ? 1 : 0);
    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    console.error('Pages POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
