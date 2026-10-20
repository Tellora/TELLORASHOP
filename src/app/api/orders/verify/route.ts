import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { retrieveSession } from '@/lib/stripe';
import { markOrderPaid } from '@/lib/orders';
import { isStripeConfigured, siteUrl } from '@/lib/settings';

// Called from the order-confirmation page after Stripe redirects back, so the order is marked paid even before the webhook arrives.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    if (!sessionId || !isStripeConfigured()) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    const db = getDb();
    const order = db.prepare('SELECT id, order_number, payment_status FROM orders WHERE payment_ref = ?').get(sessionId) as
      { id: string; order_number: string; payment_status: string } | undefined;
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const session = await retrieveSession(sessionId);
    if (session.payment_status === 'paid') await markOrderPaid(db, order.id, siteUrl(request));

    const fresh = db.prepare('SELECT order_number, payment_status, status FROM orders WHERE id = ?').get(order.id);
    return NextResponse.json({ order: fresh });
  } catch (error) {
    console.error('Order verify error:', error);
    return NextResponse.json({ error: 'Could not verify payment' }, { status: 500 });
  }
}
