import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();

    const where = user.role === 'admin' ? '(o.id = ? OR o.order_number = ?)' : '(o.id = ? OR o.order_number = ?) AND o.user_id = ?';
    const queryParams = user.role === 'admin' ? [id, id] : [id, id, user.userId];

    const order = db.prepare(`
      SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM orders o LEFT JOIN users u ON o.user_id = u.id
      WHERE ${where}
    `).get(...queryParams) as Record<string, unknown> | undefined;

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id as string);

    return NextResponse.json({ order, items });
  } catch (error) {
    console.error('Order GET error:', error);
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

    for (const field of ['status', 'payment_status', 'tracking_number', 'notes']) {
      if (body[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      db.prepare(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`).run(...values, id);
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    return NextResponse.json({ order });
  } catch (error) {
    console.error('Order PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
