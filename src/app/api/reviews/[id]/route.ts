import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const db = getDb();
    if (body.is_approved !== undefined) {
      db.prepare('UPDATE reviews SET is_approved = ? WHERE id = ?').run(body.is_approved ? 1 : 0, id);
    }
    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
    return NextResponse.json({ review });
  } catch (error) {
    console.error('Review PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const db = getDb();
    db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
    return NextResponse.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Review DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
