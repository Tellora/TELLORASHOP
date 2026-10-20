import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ORDER_STATUSES, PAYMENT_STATUSES, restockOrder, reserveOrderStock, sendStatusEmail } from '@/lib/orders';
import { siteUrl } from '@/lib/settings';

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
      SELECT o.*, COALESCE(u.name, json_extract(o.shipping_address, '$.firstName') || ' ' || json_extract(o.shipping_address, '$.lastName')) as customer_name,
             COALESCE(u.email, o.guest_email) as customer_email, u.phone as customer_phone
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

    const before = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as { status: string; payment_status: string; tracking_number: string | null } | undefined;
    if (!before) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (body.status !== undefined && !(ORDER_STATUSES as readonly string[]).includes(body.status)) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
    }
    if (body.payment_status !== undefined && !(PAYMENT_STATUSES as readonly string[]).includes(body.payment_status)) {
      return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 });
    }

    const closing = (s: string) => s === 'cancelled' || s === 'refunded';
    if (body.status !== undefined && closing(before.status) && !closing(body.status)) {
      const problem = reserveOrderStock(db, id);
      if (problem) return NextResponse.json({ error: problem }, { status: 409 });
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    for (const field of ['status', 'payment_status', 'tracking_number', 'notes']) {
      if (body[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(body[field]);
      }
    }
    // Refunding an order also marks the payment as refunded unless told otherwise
    if (body.status === 'refunded' && body.payment_status === undefined && before.payment_status === 'paid') {
      fields.push('payment_status = ?');
      values.push('refunded');
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      db.prepare(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`).run(...values, id);
    }

    if (body.status !== undefined && closing(body.status) && !closing(before.status)) restockOrder(db, id);

    const statusChanged = body.status !== undefined && body.status !== before.status;
    const trackingAdded = body.tracking_number && body.tracking_number !== before.tracking_number;
    if ((statusChanged && body.status !== 'pending' && body.status !== 'confirmed') || (trackingAdded && !statusChanged)) {
      void sendStatusEmail(db, id, siteUrl(request));
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    return NextResponse.json({ order });
  } catch (error) {
    console.error('Order PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** Admin-only hard delete (for test orders). Restocks first so inventory stays correct. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const db = getDb();
    const order = db.prepare('SELECT status FROM orders WHERE id = ?').get(id) as { status: string } | undefined;
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.status !== 'cancelled' && order.status !== 'refunded') restockOrder(db, id);
    db.prepare('DELETE FROM order_items WHERE order_id = ?').run(id);
    db.prepare('DELETE FROM orders WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Order DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
