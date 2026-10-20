import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyWebhook } from '@/lib/stripe';
import { markOrderPaid, restockOrder } from '@/lib/orders';
import { siteUrl } from '@/lib/settings';

// Point a Stripe webhook at /api/stripe/webhook (events: checkout.session.completed, checkout.session.expired)
// and set STRIPE_WEBHOOK_SECRET.
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 501 });

  const raw = await request.text();
  if (!verifyWebhook(raw, request.headers.get('stripe-signature'), secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    const event = JSON.parse(raw) as { type: string; data: { object: { id: string; payment_status?: string; client_reference_id?: string } } };
    const db = getDb();
    const session = event.data.object;
    const orderId = session.client_reference_id;

    if (orderId && event.type === 'checkout.session.completed' && session.payment_status === 'paid') {
      await markOrderPaid(db, orderId, siteUrl(request));
    } else if (orderId && event.type === 'checkout.session.expired') {
      const order = db.prepare('SELECT payment_status FROM orders WHERE id = ?').get(orderId) as { payment_status: string } | undefined;
      if (order && order.payment_status === 'pending') {
        db.prepare("UPDATE orders SET status = 'cancelled', payment_status = 'failed', updated_at = datetime('now') WHERE id = ?").run(orderId);
        restockOrder(db, orderId);
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
