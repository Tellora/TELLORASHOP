import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuid } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const db = getDb();
    const existing = db.prepare('SELECT id FROM newsletter WHERE email = ?').get(email.toLowerCase());
    if (existing) return NextResponse.json({ message: 'Already subscribed!' });

    db.prepare('INSERT INTO newsletter (id, email) VALUES (?, ?)').run(uuid(), email.toLowerCase());
    return NextResponse.json({ message: 'Successfully subscribed!' }, { status: 201 });
  } catch (error) {
    console.error('Newsletter error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
