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

    // Try to find by slug first, then by id
    let product = db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
      (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.product_id = p.id AND r.is_approved = 1) as avg_rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.is_approved = 1) as review_count
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.slug = ? OR p.id = ?
    `).get(id, id) as Record<string, unknown> | undefined;

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get reviews
    const reviews = db.prepare(`
      SELECT r.*, u.name as user_name FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ? AND r.is_approved = 1
      ORDER BY r.created_at DESC
    `).all(product.id as string);

    // Get variants
    const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(product.id as string);

    // Get related products
    const related = db.prepare(`
      SELECT p.*, 
      (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.product_id = p.id AND r.is_approved = 1) as avg_rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.is_approved = 1) as review_count
      FROM products p 
      WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1 
      LIMIT 4
    `).all(product.category_id as string, product.id as string);

    return NextResponse.json({ product, reviews, variants, related });
  } catch (error) {
    console.error('Product GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    const allowedFields = ['name', 'slug', 'description', 'short_description', 'price', 'compare_at_price', 'cost', 'sku', 'barcode', 'quantity', 'track_inventory', 'category_id', 'is_active', 'is_featured', 'weight', 'images', 'tags', 'seo_title', 'seo_description'];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        fields.push(`${field} = ?`);
        if (field === 'images') {
          values.push(JSON.stringify(body[field]));
        } else if (['is_active', 'is_featured', 'track_inventory'].includes(field)) {
          values.push(body[field] ? 1 : 0);
        } else {
          values.push(body[field]);
        }
      }
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).run(...values, id);
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    return NextResponse.json({ product });
  } catch (error) {
    console.error('Product PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Product DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
