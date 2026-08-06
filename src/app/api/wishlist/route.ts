import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const items = db.prepare(`
      SELECT w.*, p.name, p.slug, p.price, p.compare_at_price, p.images, p.is_active
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `).all(user.userId);

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Wishlist GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Please login to add to wishlist' }, { status: 401 });

    const body = await request.json();
    const { product_id } = body;
    if (!product_id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    const db = getDb();
    const existing = db.prepare('SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?').get(user.userId, product_id);
    if (existing) {
      // Remove from wishlist (toggle)
      db.prepare('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?').run(user.userId, product_id);
      return NextResponse.json({ action: 'removed', message: 'Removed from wishlist' });
    }

    db.prepare('INSERT INTO wishlists (id, user_id, product_id) VALUES (?, ?, ?)').run(uuid(), user.userId, product_id);
    return NextResponse.json({ action: 'added', message: 'Added to wishlist' }, { status: 201 });
  } catch (error) {
    console.error('Wishlist POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
