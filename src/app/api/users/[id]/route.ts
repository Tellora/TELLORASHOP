import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hashSync } from 'bcryptjs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getCurrentUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (authUser.role !== 'admin' && authUser.userId !== id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const db = getDb();
    const user = db.prepare('SELECT id, email, name, role, phone, avatar, is_active, created_at FROM users WHERE id = ?').get(id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(id);
    const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ?').all(id);

    return NextResponse.json({ user, orders, addresses });
  } catch (error) {
    console.error('User GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getCurrentUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (authUser.role !== 'admin' && authUser.userId !== id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const db = getDb();
    const fields: string[] = [];
    const values: unknown[] = [];

    const allowed = authUser.role === 'admin' ? ['name', 'email', 'phone', 'role', 'is_active', 'avatar'] : ['name', 'phone', 'avatar'];
    for (const field of allowed) {
      if (body[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(field === 'is_active' ? (body[field] ? 1 : 0) : body[field]);
      }
    }
    if (authUser.role === 'admin' && authUser.userId === id && (body.role === 'customer' || body.is_active === false || body.is_active === 0)) {
      return NextResponse.json({ error: 'You cannot demote or deactivate your own admin account' }, { status: 400 });
    }
    if (body.password && authUser.role === 'admin') {
      if (String(body.password).length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
      fields.push('password_hash = ?');
      values.push(hashSync(body.password, 10));
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values, id);
    }

    const user = db.prepare('SELECT id, email, name, role, phone, avatar, is_active, created_at FROM users WHERE id = ?').get(id);
    return NextResponse.json({ user });
  } catch (error) {
    console.error('User PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getCurrentUser(request);
    if (!authUser || authUser.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const db = getDb();
    db.prepare('DELETE FROM users WHERE id = ? AND role != ?').run(id, 'admin');
    return NextResponse.json({ message: 'User deleted' });
  } catch (error) {
    console.error('User DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
