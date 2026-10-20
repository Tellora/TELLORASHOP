/**
 * Transactional email through Resend's REST API (no SDK needed).
 * Set RESEND_API_KEY and EMAIL_FROM (for example "TelloraShop <orders@yourdomain.com>") to turn it on.
 * Without a key the message is written to the server log so nothing breaks in development.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'TelloraShop <onboarding@resend.dev>';
  if (!key) {
    console.log(`[email not configured] to=${to} subject="${subject}"`);
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) console.error('Email send failed:', res.status, await res.text());
    return res.ok;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

function layout(storeName: string, body: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;border:3px solid #000">
    <div style="background:#E5E535;padding:16px 20px;border-bottom:3px solid #000;font-weight:900;font-size:20px">${escapeHtml(storeName)}</div>
    <div style="padding:20px;line-height:1.6">${body}</div></div>`;
}

const money = (n: number) => `$${Number(n).toFixed(2)}`;

export function orderEmail(opts: {
  storeName: string; orderNumber: string; items: Array<{ name: string; quantity: number; total: number }>;
  subtotal: number; discount: number; shipping: number; tax: number; total: number; trackUrl: string; paymentMethod: string;
}): { subject: string; html: string } {
  const rows = opts.items.map(i => `<tr><td style="padding:6px 0">${escapeHtml(i.name)} × ${i.quantity}</td><td style="text-align:right">${money(i.total)}</td></tr>`).join('');
  return {
    subject: `Order ${opts.orderNumber} confirmed`,
    html: layout(opts.storeName, `<h2 style="margin-top:0">Thanks for your order!</h2>
      <p>Your order <strong>${escapeHtml(opts.orderNumber)}</strong> is confirmed.${opts.paymentMethod === 'cod' ? ' You will pay on delivery.' : ''}</p>
      <table style="width:100%;border-collapse:collapse">${rows}
      <tr><td style="border-top:1px solid #000;padding-top:8px">Subtotal</td><td style="border-top:1px solid #000;text-align:right">${money(opts.subtotal)}</td></tr>
      ${opts.discount > 0 ? `<tr><td>Discount</td><td style="text-align:right">-${money(opts.discount)}</td></tr>` : ''}
      <tr><td>Shipping</td><td style="text-align:right">${opts.shipping === 0 ? 'FREE' : money(opts.shipping)}</td></tr>
      <tr><td>Tax</td><td style="text-align:right">${money(opts.tax)}</td></tr>
      <tr><td style="font-weight:900;font-size:18px;padding-top:8px">Total</td><td style="text-align:right;font-weight:900;font-size:18px;padding-top:8px">${money(opts.total)}</td></tr></table>
      <p><a href="${opts.trackUrl}" style="background:#000;color:#fff;padding:10px 16px;text-decoration:none;display:inline-block">Track your order</a></p>`),
  };
}

export function statusEmail(opts: { storeName: string; orderNumber: string; status: string; trackingNumber?: string | null; trackUrl: string }) {
  const nice: Record<string, string> = {
    processing: 'is being prepared',
    shipped: 'has shipped',
    delivered: 'has been delivered',
    cancelled: 'has been cancelled',
    refunded: 'has been refunded',
  };
  return {
    subject: `Order ${opts.orderNumber} ${nice[opts.status] || 'was updated'}`,
    html: layout(opts.storeName, `<h2 style="margin-top:0">Order update</h2>
      <p>Your order <strong>${escapeHtml(opts.orderNumber)}</strong> ${nice[opts.status] || `is now ${escapeHtml(opts.status)}`}.</p>
      ${opts.trackingNumber ? `<p>Tracking number: <strong>${escapeHtml(opts.trackingNumber)}</strong></p>` : ''}
      <p><a href="${opts.trackUrl}" style="background:#000;color:#fff;padding:10px 16px;text-decoration:none;display:inline-block">View order status</a></p>`),
  };
}

export function resetEmail(opts: { storeName: string; resetUrl: string }) {
  return {
    subject: 'Reset your password',
    html: layout(opts.storeName, `<h2 style="margin-top:0">Reset your password</h2>
      <p>We received a request to reset your password. This link works for one hour.</p>
      <p><a href="${opts.resetUrl}" style="background:#000;color:#fff;padding:10px 16px;text-decoration:none;display:inline-block">Choose a new password</a></p>
      <p>If you didn't ask for this, you can ignore this email.</p>`),
  };
}
