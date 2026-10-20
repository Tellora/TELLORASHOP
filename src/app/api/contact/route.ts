import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { sendEmail, escapeHtml } from '@/lib/email';
import { getAllSettings } from '@/lib/settings';
import { v4 as uuid } from 'uuid';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public: send a message to the store.
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'contact', 5, 15 * 60 * 1000);
  if (limited) return limited;
  try {
    const { name, email, subject, message, website } = await request.json();
    if (website) return NextResponse.json({ message: 'Thanks! We will be in touch soon.' }); // honeypot field: bots fill it, people never see it
    if (!String(name || '').trim() || !EMAIL_RE.test(String(email || '').trim()) || String(message || '').trim().length < 5) {
      return NextResponse.json({ error: 'Please enter your name, a valid email and a message' }, { status: 400 });
    }
    const db = getDb();
    db.prepare('INSERT INTO contact_messages (id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)').run(
      uuid(), String(name).trim().slice(0, 100), String(email).trim().toLowerCase(), String(subject || '').trim().slice(0, 150), String(message).trim().slice(0, 5000)
    );
    const settings = getAllSettings(db);
    if (settings.store_email) {
      void sendEmail(settings.store_email, `New contact message: ${subject || 'No subject'}`,
        `<p><strong>${escapeHtml(name)}</strong> (${escapeHtml(email)}) wrote:</p><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`);
    }
    return NextResponse.json({ message: 'Thanks! We will be in touch soon.' }, { status: 201 });
  } catch (error) {
    console.error('Contact POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Admin: inbox.
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const status = new URL(request.url).searchParams.get('status');
    const db = getDb();
    const messages = status
      ? db.prepare('SELECT * FROM contact_messages WHERE status = ? ORDER BY created_at DESC').all(status)
      : db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Contact GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
