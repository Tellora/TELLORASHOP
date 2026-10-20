import crypto from 'crypto';

/**
 * Minimal Stripe Checkout client over the REST API (no SDK dependency).
 * Needs STRIPE_SECRET_KEY. STRIPE_WEBHOOK_SECRET is optional but recommended (see /api/stripe/webhook).
 */
const API = 'https://api.stripe.com/v1';

function headers() {
  return { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' };
}

export async function createCheckoutSession(opts: {
  orderId: string; orderNumber: string; amountCents: number; currency: string; email?: string;
  successUrl: string; cancelUrl: string; storeName: string;
}): Promise<{ id: string; url: string }> {
  const body = new URLSearchParams({
    mode: 'payment',
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    client_reference_id: opts.orderId,
    'metadata[order_id]': opts.orderId,
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': opts.currency.toLowerCase(),
    'line_items[0][price_data][unit_amount]': String(opts.amountCents),
    'line_items[0][price_data][product_data][name]': `${opts.storeName} order ${opts.orderNumber}`,
  });
  if (opts.email) body.set('customer_email', opts.email);

  const res = await fetch(`${API}/checkout/sessions`, { method: 'POST', headers: headers(), body });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Stripe error');
  return { id: data.id, url: data.url };
}

export async function retrieveSession(id: string): Promise<{ id: string; payment_status: string; status: string; client_reference_id: string | null }> {
  const res = await fetch(`${API}/checkout/sessions/${encodeURIComponent(id)}`, { headers: headers() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Stripe error');
  return data;
}

/** Verify a Stripe webhook signature (tolerance 5 minutes). */
export function verifyWebhook(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(signatureHeader.split(',').map(p => p.split('=') as [string, string]));
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
