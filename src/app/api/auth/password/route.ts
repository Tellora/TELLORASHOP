import { NextRequest, NextResponse } from 'next/server';
import { compareSync, hashSync } from 'bcryptjs';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

// Change your own password (requires the current one).
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'chpw', 10, 15 * 60 * 1000);
  if (limited) return limited;

  try {
    const auth = await getCurrentUser(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { current_password, new_password } = await request.json();
    if (typeof new_password !== 'string' || new_password.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }
    const db = getDb();
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(auth.userId) as { password_hash: string } | undefined;
    if (!user || typeof current_password !== 'string' || !compareSync(current_password, user.password_hash)) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }
    db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hashSync(new_password, 10), auth.userId);
    return NextResponse.json({ message: 'Password changed' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
