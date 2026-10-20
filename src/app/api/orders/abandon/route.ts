import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { restockOrder } from '@/lib/orders';

// Called when a customer comes back from the card payment page without paying: release the stock held for the unpaid order.
// Only unpaid card orders can be abandoned, and the order number is not guessable.
export async function POST(request: NextRequest) {
  try {
    const { order_number } = await request.json();
    if (typeof order_number !== 'string') return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    const db = getDb();
    const order = db.prepare("SELECT id FROM orders WHERE order_number = ? AND payment_method = 'card' AND payment_status = 'pending' AND status = 'pending'").get(order_number.trim().toUpperCase()) as { id: string } | undefined;
    if (order) {
      db.prepare("UPDATE orders SET status = 'cancelled', payment_status = 'failed', updated_at = datetime('now') WHERE id = ?").run(order.id);
      restockOrder(db, order.id);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Order abandon error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
