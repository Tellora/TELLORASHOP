import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// CSV exports for bookkeeping: /api/admin/export?type=orders|products|customers|subscribers
const csvCell = (v: unknown) => {
  let s = v === null || v === undefined ? '' : String(v);
  // Neutralise spreadsheet formula injection from user-supplied text
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const type = new URL(request.url).searchParams.get('type');
    const db = getDb();

    let rows: Array<Record<string, unknown>>;
    switch (type) {
      case 'orders':
        rows = db.prepare(`
          SELECT o.order_number, o.created_at, o.status, o.payment_status, o.payment_method, o.shipping_method,
                 COALESCE(u.name, json_extract(o.shipping_address, '$.firstName') || ' ' || json_extract(o.shipping_address, '$.lastName')) AS customer,
                 COALESCE(u.email, o.guest_email) AS email, o.subtotal, o.discount, o.shipping_cost, o.tax, o.total, o.coupon_code, o.tracking_number
          FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC`).all() as Array<Record<string, unknown>>;
        break;
      case 'products':
        rows = db.prepare(`
          SELECT p.name, p.sku, c.name AS category, p.price, p.compare_at_price, p.cost, p.quantity, p.is_active, p.is_featured
          FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.name`).all() as Array<Record<string, unknown>>;
        break;
      case 'customers':
        rows = db.prepare(`
          SELECT u.name, u.email, u.phone, u.is_active, u.created_at,
                 (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders,
                 (SELECT COALESCE(SUM(total), 0) FROM orders o WHERE o.user_id = u.id AND o.status NOT IN ('cancelled', 'refunded')) AS lifetime_spend
          FROM users u WHERE u.role = 'customer' ORDER BY u.created_at DESC`).all() as Array<Record<string, unknown>>;
        break;
      case 'subscribers':
        rows = db.prepare('SELECT email, is_active, created_at FROM newsletter ORDER BY created_at DESC').all() as Array<Record<string, unknown>>;
        break;
      default:
        return NextResponse.json({ error: 'Unknown export type' }, { status: 400 });
    }

    const headers = rows.length ? Object.keys(rows[0]) : ['(no data)'];
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => csvCell(r[h])).join(','))].join('\r\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
