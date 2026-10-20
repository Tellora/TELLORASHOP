import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { v4 as uuid } from 'uuid';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'newsletter', 10, 15 * 60 * 1000);
  if (limited) return limited;
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });

    const db = getDb();
    const existing = db.prepare('SELECT id, is_active FROM newsletter WHERE email = ?').get(email) as { id: string; is_active: number } | undefined;
    if (existing) {
      if (!existing.is_active) db.prepare('UPDATE newsletter SET is_active = 1 WHERE id = ?').run(existing.id);
      return NextResponse.json({ message: 'Already subscribed!' });
    }

    db.prepare('INSERT INTO newsletter (id, email) VALUES (?, ?)').run(uuid(), email);
    return NextResponse.json({ message: 'Successfully subscribed!' }, { status: 201 });
  } catch (error) {
    console.error('Newsletter error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Admin: subscriber list
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const subscribers = getDb().prepare('SELECT * FROM newsletter ORDER BY created_at DESC').all();
    return NextResponse.json({ subscribers });
  } catch (error) {
    console.error('Newsletter GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Admin: remove a subscriber (?id=...)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    getDb().prepare('DELETE FROM newsletter WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Newsletter DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
