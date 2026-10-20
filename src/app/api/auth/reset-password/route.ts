import { NextRequest, NextResponse } from 'next/server';
import { hashSync } from 'bcryptjs';
import crypto from 'crypto';
import { getDb } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'reset', 10, 15 * 60 * 1000);
  if (limited) return limited;

  try {
    const { token, password } = await request.json();
    if (typeof token !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const db = getDb();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const row = db.prepare("SELECT id, user_id FROM password_resets WHERE token_hash = ? AND used = 0 AND expires_at > datetime('now')").get(tokenHash) as
      { id: string; user_id: string } | undefined;
    if (!row) return NextResponse.json({ error: 'This reset link is invalid or has expired. Please request a new one.' }, { status: 400 });

    db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hashSync(password, 10), row.user_id);
    db.prepare('UPDATE password_resets SET used = 1 WHERE user_id = ?').run(row.user_id);
    return NextResponse.json({ message: 'Password updated. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
