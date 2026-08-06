import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const page = db.prepare('SELECT * FROM pages WHERE id = ? OR slug = ?').get(id, id);
    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    return NextResponse.json({ page });
  } catch (error) {
    console.error('Page GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const db = getDb();
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const field of ['title', 'slug', 'content', 'is_published']) {
      if (body[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(field === 'is_published' ? (body[field] ? 1 : 0) : body[field]);
      }
    }
    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      db.prepare(`UPDATE pages SET ${fields.join(', ')} WHERE id = ?`).run(...values, id);
    }
    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
    return NextResponse.json({ page });
  } catch (error) {
    console.error('Page PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const db = getDb();
    db.prepare('DELETE FROM pages WHERE id = ?').run(id);
    return NextResponse.json({ message: 'Page deleted' });
  } catch (error) {
    console.error('Page DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
