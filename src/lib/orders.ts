import type Database from 'better-sqlite3';
import { sendEmail, orderEmail, statusEmail } from '@/lib/email';
import { getAllSettings } from '@/lib/settings';

export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as const;
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const;

/** Put an order's stock back on the shelf exactly once (cancelled, refunded, abandoned or failed orders). */
export function restockOrder(db: Database.Database, orderId: string) {
  const order = db.prepare('SELECT stock_restored FROM orders WHERE id = ?').get(orderId) as { stock_restored: number } | undefined;
  if (!order || order.stock_restored) return;
  const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(orderId) as Array<{ product_id: string; quantity: number }>;
  for (const item of items) {
    db.prepare('UPDATE products SET quantity = quantity + ? WHERE id = ? AND track_inventory = 1').run(item.quantity, item.product_id);
  }
  db.prepare('UPDATE orders SET stock_restored = 1 WHERE id = ?').run(orderId);
}

/** Take stock for an order again (e.g. admin moves a cancelled order back to active). Fails if there is not enough. */
export function reserveOrderStock(db: Database.Database, orderId: string): string | null {
  const order = db.prepare('SELECT stock_restored FROM orders WHERE id = ?').get(orderId) as { stock_restored: number } | undefined;
  if (!order || !order.stock_restored) return null;
  const items = db.prepare('SELECT product_id, name, quantity FROM order_items WHERE order_id = ?').all(orderId) as Array<{ product_id: string; name: string; quantity: number }>;
  for (const item of items) {
    const p = db.prepare('SELECT quantity, track_inventory FROM products WHERE id = ?').get(item.product_id) as { quantity: number; track_inventory: number } | undefined;
    if (p && p.track_inventory && p.quantity < item.quantity) return `Not enough stock of "${item.name}" to reactivate this order`;
  }
  for (const item of items) db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ? AND track_inventory = 1').run(item.quantity, item.product_id);
  db.prepare('UPDATE orders SET stock_restored = 0 WHERE id = ?').run(orderId);
  return null;
}

interface OrderRow {
  id: string; order_number: string; status: string; subtotal: number; tax: number; shipping_cost: number; discount: number; total: number;
  payment_method: string; tracking_number: string | null; shipping_address: string | null; guest_email: string | null; user_id: string | null;
}

export function orderRecipient(db: Database.Database, order: OrderRow): string | null {
  if (order.user_id) {
    const u = db.prepare('SELECT email FROM users WHERE id = ?').get(order.user_id) as { email: string } | undefined;
    if (u?.email) return u.email;
  }
  if (order.guest_email) return order.guest_email;
  try { return JSON.parse(order.shipping_address || '{}').email || null; } catch { return null; }
}

export async function sendOrderConfirmation(db: Database.Database, orderId: string, origin: string) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as OrderRow | undefined;
  if (!order) return;
  const to = orderRecipient(db, order);
  if (!to) return;
  const items = db.prepare('SELECT name, quantity, total FROM order_items WHERE order_id = ?').all(orderId) as Array<{ name: string; quantity: number; total: number }>;
  const storeName = getAllSettings(db).store_name || 'Our store';
  const { subject, html } = orderEmail({
    storeName, orderNumber: order.order_number, items, subtotal: order.subtotal, discount: order.discount,
    shipping: order.shipping_cost, tax: order.tax, total: order.total, paymentMethod: order.payment_method,
    trackUrl: `${origin}/track-order`,
  });
  await sendEmail(to, subject, html);
}

export async function sendStatusEmail(db: Database.Database, orderId: string, origin: string) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as OrderRow | undefined;
  if (!order) return;
  const to = orderRecipient(db, order);
  if (!to) return;
  const storeName = getAllSettings(db).store_name || 'Our store';
  const { subject, html } = statusEmail({ storeName, orderNumber: order.order_number, status: order.status, trackingNumber: order.tracking_number, trackUrl: `${origin}/track-order` });
  await sendEmail(to, subject, html);
}

/** Mark a card order as paid and notify the customer. No-op if it was already handled. */
export async function markOrderPaid(db: Database.Database, orderId: string, origin: string) {
  const order = db.prepare('SELECT status, payment_status FROM orders WHERE id = ?').get(orderId) as { status: string; payment_status: string } | undefined;
  if (!order || order.payment_status === 'paid') return;
  db.prepare("UPDATE orders SET payment_status = 'paid', status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END, updated_at = datetime('now') WHERE id = ?").run(orderId);
  await sendOrderConfirmation(db, orderId, origin);
}
