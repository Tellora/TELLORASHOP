import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const role = searchParams.get('role');

    let where = '1=1';
    const params: (string | number)[] = [];
    if (search) { where += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (role) { where += ' AND role = ?'; params.push(role); }

    const offset = (page - 1) * limit;
    const countResult = db.prepare(`SELECT COUNT(*) as total FROM users WHERE ${where}`).get(...params) as { total: number };
    const users = db.prepare(`
      SELECT id, email, name, role, phone, avatar, is_active, created_at,
      (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count,
      (SELECT COALESCE(SUM(total), 0) FROM orders WHERE user_id = users.id AND payment_status = 'paid') as total_spent
      FROM users WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return NextResponse.json({ users, pagination: { page, limit, total: countResult.total, totalPages: Math.ceil(countResult.total / limit) } });
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
