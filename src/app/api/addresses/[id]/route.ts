import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const b = await request.json();
    const db = getDb();
    const existing = db.prepare('SELECT id FROM addresses WHERE id = ? AND user_id = ?').get(id, user.userId);
    if (!existing) return NextResponse.json({ error: 'Address not found' }, { status: 404 });

    db.transaction(() => {
      if (b.is_default) db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(user.userId);
      const fields: string[] = [];
      const values: unknown[] = [];
      for (const f of ['label', 'first_name', 'last_name', 'street', 'city', 'state', 'zip', 'country', 'phone']) {
        if (b[f] !== undefined) { fields.push(`${f} = ?`); values.push(b[f]); }
      }
      if (b.is_default !== undefined) { fields.push('is_default = ?'); values.push(b.is_default ? 1 : 0); }
      if (fields.length) db.prepare(`UPDATE addresses SET ${fields.join(', ')} WHERE id = ?`).run(...values, id);
    })();
    return NextResponse.json({ address: db.prepare('SELECT * FROM addresses WHERE id = ?').get(id) });
  } catch (error) {
    console.error('Address PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    getDb().prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(id, user.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Address DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
