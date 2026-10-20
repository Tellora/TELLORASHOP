import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuid } from 'uuid';
import { getAllSettings, num, isStripeConfigured, siteUrl } from '@/lib/settings';
import { restockOrder, sendOrderConfirmation } from '@/lib/orders';
import { createCheckoutSession } from '@/lib/stripe';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));
    const status = searchParams.get('status');
    const search = (searchParams.get('search') || '').trim();
    const isAdmin = user.role === 'admin';

    let where = isAdmin ? '1=1' : 'o.user_id = ?';
    const params: (string | number)[] = isAdmin ? [] : [user.userId];

    if (status) { where += ' AND o.status = ?'; params.push(status); }
    if (isAdmin && search) {
      where += ' AND (o.order_number LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR o.guest_email LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    const offset = (page - 1) * limit;
    const countResult = db.prepare(`SELECT COUNT(*) as total FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE ${where}`).get(...params) as { total: number };
    const orders = db.prepare(`
      SELECT o.*, COALESCE(u.name, json_extract(o.shipping_address, '$.firstName') || ' ' || json_extract(o.shipping_address, '$.lastName')) as customer_name,
      COALESCE(u.email, o.guest_email) as customer_email,
      (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
      FROM orders o LEFT JOIN users u ON o.user_id = u.id
      WHERE ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return NextResponse.json({ orders, pagination: { page, limit, total: countResult.total, totalPages: Math.ceil(countResult.total / limit) } });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

class OrderError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, 'order', 20, 10 * 60 * 1000);
    if (limited) return limited;

    const user = await getCurrentUser(request);
    const body = await request.json();
    const { items, shipping_address, billing_address, payment_method, coupon_code, notes } = body;
    const shippingMethod = body.shipping_method === 'express' ? 'express' : 'standard';

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    if (!shipping_address || typeof shipping_address !== 'object') {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 });
    }
    for (const field of ['firstName', 'lastName', 'street', 'city', 'state', 'zip']) {
      if (!String(shipping_address[field] ?? '').trim()) {
        return NextResponse.json({ error: 'Please complete your shipping address' }, { status: 400 });
      }
    }
    const email = String(shipping_address.email || user?.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }
    shipping_address.email = email;

    const db = getDb();
    const settings = getAllSettings(db);

    const method = payment_method === 'card' ? 'card' : 'cod';
    if (method === 'cod' && settings.cod_enabled === 'false') {
      return NextResponse.json({ error: 'Cash on delivery is not available' }, { status: 400 });
    }
    if (method === 'card' && !(isStripeConfigured() && settings.card_enabled !== 'false')) {
      return NextResponse.json({ error: 'Card payments are not available right now' }, { status: 400 });
    }

    const placeOrder = db.transaction(() => {
      // Merge duplicate lines and validate quantities
      const requested = new Map<string, number>();
      for (const item of items) {
        const qty = Number(item?.quantity ?? 1);
        if (typeof item?.product_id !== 'string' || !Number.isInteger(qty) || qty < 1 || qty > 999) {
          throw new OrderError('Invalid cart item');
        }
        requested.set(item.product_id, (requested.get(item.product_id) || 0) + qty);
      }

      let subtotal = 0;
      const orderItems: Array<{ product_id: string; name: string; price: number; quantity: number; image: string }> = [];

      for (const [productId, qty] of requested) {
        const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(productId) as Record<string, unknown> | undefined;
        if (!product) throw new OrderError('A product in your cart is no longer available');
        if (product.track_inventory && (product.quantity as number) < qty) {
          throw new OrderError(`Only ${product.quantity} left of "${product.name}"`);
        }
        const price = product.price as number;
        subtotal += price * qty;
        orderItems.push({
          product_id: product.id as string,
          name: product.name as string,
          price,
          quantity: qty,
          image: (() => { try { const imgs = JSON.parse((product.images as string) || '[]'); return imgs[0] || ''; } catch { return ''; } })(),
        });

        if (product.track_inventory) {
          db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?').run(qty, product.id);
        }
      }

      // Apply coupon (same rules as /api/coupons/validate)
      let discount = 0;
      let appliedCoupon: string | null = null;
      if (coupon_code) {
        const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').get(String(coupon_code).toUpperCase()) as Record<string, unknown> | undefined;
        const now = new Date();
        const valid = coupon
          && !(coupon.expires_at && new Date(coupon.expires_at as string) < now)
          && !(coupon.starts_at && new Date(coupon.starts_at as string) > now)
          && !(coupon.max_uses && (coupon.used_count as number) >= (coupon.max_uses as number))
          && subtotal >= ((coupon.min_purchase as number) || 0);
        if (coupon && valid) {
          discount = coupon.type === 'percentage' ? subtotal * ((coupon.value as number) / 100) : (coupon.value as number);
          discount = Math.min(discount, subtotal);
          appliedCoupon = coupon.code as string;
          db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?').run(coupon.id);
        }
      }

      const taxRate = num(settings, 'tax_rate', 8.5) / 100;
      const flatRate = num(settings, 'shipping_flat_rate', 9.99);
      const expressRate = num(settings, 'express_shipping_rate', 19.99);
      const freeThreshold = num(settings, 'free_shipping_threshold', 75);

      const cents = (n: number) => Math.round(n * 100) / 100;
      subtotal = cents(subtotal);
      discount = cents(discount);
      const afterDiscount = subtotal - discount;
      const tax = cents(afterDiscount * taxRate);
      const shipping = shippingMethod === 'express' ? expressRate : (afterDiscount >= freeThreshold ? 0 : flatRate);
      const total = cents(afterDiscount + tax + shipping);

      const orderId = uuid();
      const orderNumber = `TS-${Date.now().toString(36).toUpperCase()}${orderId.slice(0, 4).toUpperCase()}`;
      const isCard = method === 'card';

      db.prepare(`
        INSERT INTO orders (id, order_number, user_id, status, subtotal, tax, shipping_cost, discount, total, shipping_address, billing_address,
                            payment_method, payment_status, coupon_code, notes, shipping_method, guest_email)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
      `).run(
        orderId, orderNumber, user?.userId || null, isCard ? 'pending' : 'confirmed',
        subtotal, tax, shipping, discount, total,
        JSON.stringify(shipping_address), JSON.stringify(billing_address || shipping_address),
        method, appliedCoupon, notes ? String(notes).slice(0, 1000) : null, shippingMethod, email
      );

      for (const item of orderItems) {
        db.prepare(`
          INSERT INTO order_items (id, order_id, product_id, name, price, quantity, total, image)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(uuid(), orderId, item.product_id, item.name, item.price, item.quantity, item.price * item.quantity, item.image);
      }

      return { orderId, orderNumber, total };
    });

    const { orderId, orderNumber, total } = placeOrder();
    const origin = siteUrl(request);

    if (method === 'card') {
      try {
        const session = await createCheckoutSession({
          orderId, orderNumber, amountCents: Math.round(total * 100), currency: settings.currency || 'USD', email,
          successUrl: `${origin}/order-confirmation?order=${orderNumber}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${origin}/checkout?cancelled=${orderNumber}`,
          storeName: settings.store_name || 'Store',
        });
        db.prepare('UPDATE orders SET payment_ref = ? WHERE id = ?').run(session.id, orderId);
        return NextResponse.json({ orderNumber, checkoutUrl: session.url }, { status: 201 });
      } catch (error) {
        console.error('Stripe session error:', error);
        db.prepare("UPDATE orders SET status = 'cancelled', payment_status = 'failed', updated_at = datetime('now') WHERE id = ?").run(orderId);
        restockOrder(db, orderId);
        return NextResponse.json({ error: 'We could not start the card payment. Please try again or choose another method.' }, { status: 502 });
      }
    }

    void sendOrderConfirmation(db, orderId, origin);
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    return NextResponse.json({ order, orderNumber }, { status: 201 });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Orders POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
