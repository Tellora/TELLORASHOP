import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const db = getDb();
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const field of ['question', 'answer', 'sort_order', 'is_active']) {
      if (body[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(field === 'is_active' ? (body[field] ? 1 : 0) : field === 'sort_order' ? Number(body[field]) || 0 : body[field]);
      }
    }
    if (fields.length) db.prepare(`UPDATE faqs SET ${fields.join(', ')} WHERE id = ?`).run(...values, id);
    const faq = db.prepare('SELECT * FROM faqs WHERE id = ?').get(id);
    if (!faq) return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    return NextResponse.json({ faq });
  } catch (error) {
    console.error('FAQ PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    getDb().prepare('DELETE FROM faqs WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('FAQ DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
