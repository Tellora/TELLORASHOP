import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function GET() {
  try {
    const db = getDb();
    const categories = db.prepare(`
      SELECT c.*, 
      (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) as product_count
      FROM categories c 
      ORDER BY c.sort_order ASC, c.name ASC
    `).all();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, description, image, parent_id, is_active } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const db = getDb();
    const id = uuid();
    const catSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    db.prepare(`
      INSERT INTO categories (id, name, slug, description, image, parent_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, catSlug, description || '', image || null, parent_id || null, is_active !== false ? 1 : 0);

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Categories POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
