import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    let sql = 'SELECT * FROM faqs WHERE is_active = 1 ORDER BY sort_order ASC, created_at ASC';
    if (new URL(request.url).searchParams.get('all') === 'true') {
      const user = await getCurrentUser(request);
      if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      sql = 'SELECT * FROM faqs ORDER BY sort_order ASC, created_at ASC';
    }
    return NextResponse.json({ faqs: db.prepare(sql).all() });
  } catch (error) {
    console.error('FAQ GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { question, answer, sort_order, is_active } = await request.json();
    if (!question?.trim() || !answer?.trim()) return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    const db = getDb();
    const id = uuid();
    const next = (db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM faqs').get() as { n: number }).n;
    db.prepare('INSERT INTO faqs (id, question, answer, sort_order, is_active) VALUES (?, ?, ?, ?, ?)').run(
      id, question.trim(), answer.trim(), sort_order !== undefined ? Number(sort_order) || 0 : next, is_active === false ? 0 : 1
    );
    return NextResponse.json({ faq: db.prepare('SELECT * FROM faqs WHERE id = ?').get(id) }, { status: 201 });
  } catch (error) {
    console.error('FAQ POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
