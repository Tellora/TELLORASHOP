import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { restockOrder, sendStatusEmail } from '@/lib/orders';
import { siteUrl } from '@/lib/settings';

// Customers can cancel their own order until it ships.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const db = getDb();

    const order = db.prepare('SELECT id, status, payment_status FROM orders WHERE (id = ? OR order_number = ?) AND user_id = ?').get(id, id, user.userId) as
      { id: string; status: string; payment_status: string } | undefined;
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (!['pending', 'confirmed', 'processing'].includes(order.status)) {
      return NextResponse.json({ error: 'This order can no longer be cancelled. Please contact support.' }, { status: 400 });
    }

    db.prepare("UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(order.id);
    restockOrder(db, order.id);
    void sendStatusEmail(db, order.id, siteUrl(request));

    return NextResponse.json({
      success: true,
      message: order.payment_status === 'paid' ? 'Order cancelled. Your refund will be processed by our team.' : 'Order cancelled.',
    });
  } catch (error) {
    console.error('Order cancel error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
