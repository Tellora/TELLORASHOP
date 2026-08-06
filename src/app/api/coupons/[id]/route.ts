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
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const field of ['code', 'type', 'value', 'min_purchase', 'max_uses', 'starts_at', 'expires_at', 'is_active']) {
      if (body[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(field === 'is_active' ? (body[field] ? 1 : 0) : (field === 'code' ? body[field].toUpperCase() : body[field]));
      }
    }
    if (fields.length > 0) db.prepare(`UPDATE coupons SET ${fields.join(', ')} WHERE id = ?`).run(...values, id);
    const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id);
    return NextResponse.json({ coupon });
  } catch (error) {
    console.error('Coupon PUT error:', error);
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
    db.prepare('DELETE FROM coupons WHERE id = ?').run(id);
    return NextResponse.json({ message: 'Coupon deleted' });
  } catch (error) {
    console.error('Coupon DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
