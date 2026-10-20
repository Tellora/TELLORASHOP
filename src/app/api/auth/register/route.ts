import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashSync } from 'bcryptjs';
import { createToken } from '@/lib/auth';
import { v4 as uuid } from 'uuid';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'register', 10, 60 * 60 * 1000);
  if (limited) return limited;
  try {
    const body = await request.json();
    const { password, name } = body;
    const email = typeof body.email === 'string' ? body.email.trim() : body.email;

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const id = uuid();
    const passwordHash = hashSync(password, 10);

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, 'customer')
    `).run(id, email.toLowerCase(), passwordHash, name);

    const token = await createToken({ userId: id, email: email.toLowerCase(), role: 'customer', name });

    const response = NextResponse.json({ 
      user: { id, email: email.toLowerCase(), name, role: 'customer' }, 
      token 
    }, { status: 201 });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
