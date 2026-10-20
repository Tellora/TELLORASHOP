import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

type OrderRow = {
  id: string;
  shipping_address: string;
  user_email: string | null;
  [key: string]: unknown;
};

function emailFromAddress(json: string | undefined): string {
  try {
    return String(JSON.parse(json || '{}').email || '').toLowerCase();
  } catch {
    return '';
  }
}

// Public lookup for guests: the order number AND the email used at checkout must both match.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const number = (searchParams.get('number') || '').trim().toUpperCase();
    const email = (searchParams.get('email') || '').trim().toLowerCase();
    if (!number || !email) {
      return NextResponse.json({ error: 'Order number and email are required' }, { status: 400 });
    }

    const db = getDb();
    const order = db.prepare(`
      SELECT o.id, o.order_number, o.status, o.subtotal, o.tax, o.shipping_cost, o.discount, o.total,
             o.payment_status, o.tracking_number, o.created_at, o.shipping_address, u.email AS user_email
      FROM orders o LEFT JOIN users u ON o.user_id = u.id
      WHERE o.order_number = ?
    `).get(number) as OrderRow | undefined;

    const matches = order && (
      email === (order.user_email || '').toLowerCase() ||
      email === emailFromAddress(order.shipping_address)
    );

    if (!order || !matches) {
      // Same answer for "no such order" and "wrong email" so order numbers can't be probed
      return NextResponse.json({ error: 'No order found for that order number and email' }, { status: 404 });
    }

    const items = db.prepare('SELECT name, price, quantity, total, image FROM order_items WHERE order_id = ?').all(order.id);
    const safe = { ...order } as Partial<OrderRow>;
    delete safe.id;
    delete safe.shipping_address;
    delete safe.user_email;
    return NextResponse.json({ order: safe, items });
  } catch (error) {
    console.error('Order track error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
