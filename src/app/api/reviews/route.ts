import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let where = '1=1';
    const params: (string | number)[] = [];
    if (status === 'approved') { where += ' AND r.is_approved = 1'; }
    if (status === 'pending') { where += ' AND r.is_approved = 0'; }

    const reviews = db.prepare(`
      SELECT r.*, u.name as user_name, u.email as user_email, p.name as product_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      WHERE ${where}
      ORDER BY r.created_at DESC
    `).all(...params);

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Reviews admin GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
