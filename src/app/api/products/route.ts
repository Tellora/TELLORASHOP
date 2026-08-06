import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    const featured = searchParams.get('featured');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const isAdmin = searchParams.get('admin') === 'true';

    let where = isAdmin ? '1=1' : 'p.is_active = 1';
    const params: (string | number)[] = [];

    if (category) {
      where += ' AND c.slug = ?';
      params.push(category);
    }

    if (search) {
      where += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (featured === 'true') {
      where += ' AND p.is_featured = 1';
    }

    if (minPrice) {
      where += ' AND p.price >= ?';
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      where += ' AND p.price <= ?';
      params.push(parseFloat(maxPrice));
    }

    let orderBy = 'p.created_at DESC';
    switch (sort) {
      case 'price_asc': orderBy = 'p.price ASC'; break;
      case 'price_desc': orderBy = 'p.price DESC'; break;
      case 'name_asc': orderBy = 'p.name ASC'; break;
      case 'name_desc': orderBy = 'p.name DESC'; break;
      case 'oldest': orderBy = 'p.created_at ASC'; break;
      default: orderBy = 'p.created_at DESC';
    }

    const offset = (page - 1) * limit;

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE ${where}
    `).get(...params) as { total: number };

    const products = db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
      (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.product_id = p.id AND r.is_approved = 1) as avg_rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.is_approved = 1) as review_count
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE ${where}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit),
      },
    });
  } catch (error) {
    console.error('Products GET error:', error);
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
    const { name, slug, description, short_description, price, compare_at_price, cost, sku, barcode, quantity, track_inventory, category_id, is_active, is_featured, weight, images, tags, seo_title, seo_description } = body;

    if (!name || !price) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    }

    const db = getDb();
    const id = uuid();
    const productSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check slug uniqueness
    const existingSlug = db.prepare('SELECT id FROM products WHERE slug = ?').get(productSlug);
    const finalSlug = existingSlug ? `${productSlug}-${Date.now()}` : productSlug;

    db.prepare(`
      INSERT INTO products (id, name, slug, description, short_description, price, compare_at_price, cost, sku, barcode, quantity, track_inventory, category_id, is_active, is_featured, weight, images, tags, seo_title, seo_description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name, finalSlug, description || '', short_description || '', price,
      compare_at_price || null, cost || null, sku || null, barcode || null,
      quantity || 0, track_inventory !== undefined ? (track_inventory ? 1 : 0) : 1,
      category_id || null, is_active !== undefined ? (is_active ? 1 : 0) : 1,
      is_featured ? 1 : 0, weight || null,
      JSON.stringify(images || []), tags || '', seo_title || '', seo_description || ''
    );

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
