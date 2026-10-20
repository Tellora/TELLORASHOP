import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { compareSync } from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getCurrentUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const user = db.prepare('SELECT id, email, name, role, phone, avatar, created_at FROM users WHERE id = ?').get(authUser.userId) as Record<string, unknown> | undefined;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Let the admin panel warn when the shipped demo password is still in use
    let insecure_default_password = false;
    if (user.role === 'admin') {
      const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(authUser.userId) as { password_hash: string };
      insecure_default_password = compareSync('admin123', row.password_hash);
    }

    return NextResponse.json({ user, insecure_default_password });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
