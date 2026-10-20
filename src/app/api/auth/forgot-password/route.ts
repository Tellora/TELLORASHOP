import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { getDb } from '@/lib/db';
import { sendEmail, resetEmail } from '@/lib/email';
import { getAllSettings, siteUrl } from '@/lib/settings';
import { rateLimit } from '@/lib/rate-limit';

export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

// Always answers the same way so the endpoint can't be used to discover which emails have accounts.
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'forgot', 5, 15 * 60 * 1000);
  if (limited) return limited;

  try {
    const { email } = await request.json();
    const db = getDb();
    const user = typeof email === 'string'
      ? db.prepare('SELECT id, is_active FROM users WHERE email = ?').get(email.trim().toLowerCase()) as { id: string; is_active: number } | undefined
      : undefined;

    if (user && user.is_active) {
      const token = crypto.randomBytes(32).toString('hex');
      db.prepare('UPDATE password_resets SET used = 1 WHERE user_id = ?').run(user.id);
      db.prepare("INSERT INTO password_resets (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, datetime('now', '+1 hour'))")
        .run(uuid(), user.id, hashToken(token));
      const resetUrl = `${siteUrl(request)}/reset-password?token=${token}`;
      const { subject, html } = resetEmail({ storeName: getAllSettings(db).store_name || 'Our store', resetUrl });
      const sent = await sendEmail((email as string).trim().toLowerCase(), subject, html);
      // With no email provider configured in development, surface the link in the server log
      if (!sent && process.env.NODE_ENV !== 'production') console.log(`[dev] password reset link: ${resetUrl}`);
    }
    return NextResponse.json({ message: 'If an account exists for that email, a reset link is on its way.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
