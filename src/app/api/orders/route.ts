import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const isAdmin = user.role === 'admin';

    let where = isAdmin ? '1=1' : 'o.user_id = ?';
    const params: (string | number)[] = isAdmin ? [] : [user.userId];

    if (status) { where += ' AND o.status = ?'; params.push(status); }

    const offset = (page - 1) * limit;
    const countResult = db.prepare(`SELECT COUNT(*) as total FROM orders o WHERE ${where}`).get(...params) as { total: number };
    const orders = db.prepare(`
      SELECT o.*, u.name as customer_name, u.email as customer_email,
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

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();
    const { items, shipping_address, billing_address, payment_method, coupon_code, notes } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    if (!shipping_address) {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 });
    }

    const db = getDb();

    // Calculate totals
    let subtotal = 0;
    const orderItems: Array<{ product_id: string; name: string; price: number; quantity: number; image: string }> = [];

    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id) as Record<string, unknown> | undefined;
      if (!product) continue;
      const price = product.price as number;
      const qty = item.quantity || 1;
      subtotal += price * qty;
      orderItems.push({
        product_id: product.id as string,
        name: product.name as string,
        price,
        quantity: qty,
        image: (() => { try { const imgs = JSON.parse((product.images as string) || '[]'); return imgs[0] || ''; } catch { return ''; } })(),
      });

      // Decrease inventory
      if (product.track_inventory) {
        db.prepare('UPDATE products SET quantity = MAX(0, quantity - ?) WHERE id = ?').run(qty, product.id);
      }
    }

    // Apply coupon
    let discount = 0;
    if (coupon_code) {
      const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').get(coupon_code) as Record<string, unknown> | undefined;
      if (coupon) {
        if (coupon.type === 'percentage') {
          discount = subtotal * ((coupon.value as number) / 100);
        } else {
          discount = coupon.value as number;
        }
        discount = Math.min(discount, subtotal);
        db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?').run(coupon.id);
      }
    }

    // Get settings for tax and shipping
    const taxRateSetting = db.prepare("SELECT value FROM settings WHERE key = 'tax_rate'").get() as { value: string } | undefined;
    const shippingRateSetting = db.prepare("SELECT value FROM settings WHERE key = 'shipping_flat_rate'").get() as { value: string } | undefined;
    const freeShipThreshold = db.prepare("SELECT value FROM settings WHERE key = 'free_shipping_threshold'").get() as { value: string } | undefined;

    const taxRate = parseFloat(taxRateSetting?.value || '8.5') / 100;
    const shippingRate = parseFloat(shippingRateSetting?.value || '9.99');
    const freeThreshold = parseFloat(freeShipThreshold?.value || '75');

    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * taxRate;
    const shipping = afterDiscount >= freeThreshold ? 0 : shippingRate;
    const total = afterDiscount + tax + shipping;

    const orderId = uuid();
    const orderNumber = `TS-${String(Date.now()).slice(-6)}`;

    db.prepare(`
      INSERT INTO orders (id, order_number, user_id, status, subtotal, tax, shipping_cost, discount, total, shipping_address, billing_address, payment_method, payment_status, coupon_code, notes)
      VALUES (?, ?, ?, 'confirmed', ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?)
    `).run(
      orderId, orderNumber, user?.userId || null,
      subtotal, tax, shipping, discount, total,
      JSON.stringify(shipping_address), JSON.stringify(billing_address || shipping_address),
      payment_method || 'card', coupon_code || null, notes || null
    );

    for (const item of orderItems) {
      db.prepare(`
        INSERT INTO order_items (id, order_id, product_id, name, price, quantity, total, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(uuid(), orderId, item.product_id, item.name, item.price, item.quantity, item.price * item.quantity, item.image);
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    return NextResponse.json({ order, orderNumber }, { status: 201 });
  } catch (error) {
    console.error('Orders POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
