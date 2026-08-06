import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    if (!q) return NextResponse.json({ products: [], categories: [] });

    const db = getDb();
    const searchTerm = `%${q}%`;

    const products = db.prepare(`
      SELECT p.id, p.name, p.slug, p.price, p.compare_at_price, p.images, c.name as category_name,
      (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.product_id = p.id AND r.is_approved = 1) as avg_rating
      FROM products p LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1 AND (p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)
      ORDER BY p.is_featured DESC, p.name ASC LIMIT 20
    `).all(searchTerm, searchTerm, searchTerm);

    const categories = db.prepare(`
      SELECT id, name, slug, image FROM categories
      WHERE is_active = 1 AND name LIKE ?
      ORDER BY name ASC LIMIT 5
    `).all(searchTerm);

    return NextResponse.json({ products, categories });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
