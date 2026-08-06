import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();

    // Revenue stats
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as value FROM orders WHERE payment_status = 'paid'").get() as { value: number };
    const todayRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as value FROM orders WHERE payment_status = 'paid' AND date(created_at) = date('now')").get() as { value: number };
    const monthRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as value FROM orders WHERE payment_status = 'paid' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')").get() as { value: number };

    // Order stats
    const totalOrders = db.prepare('SELECT COUNT(*) as value FROM orders').get() as { value: number };
    const pendingOrders = db.prepare("SELECT COUNT(*) as value FROM orders WHERE status = 'pending'").get() as { value: number };
    const processingOrders = db.prepare("SELECT COUNT(*) as value FROM orders WHERE status IN ('confirmed', 'processing')").get() as { value: number };

    // Customer stats
    const totalCustomers = db.prepare("SELECT COUNT(*) as value FROM users WHERE role = 'customer'").get() as { value: number };
    const newCustomersToday = db.prepare("SELECT COUNT(*) as value FROM users WHERE role = 'customer' AND date(created_at) = date('now')").get() as { value: number };

    // Product stats
    const totalProducts = db.prepare('SELECT COUNT(*) as value FROM products WHERE is_active = 1').get() as { value: number };
    const lowStockProducts = db.prepare('SELECT COUNT(*) as value FROM products WHERE quantity <= 5 AND track_inventory = 1 AND is_active = 1').get() as { value: number };

    // Top products by revenue
    const topProducts = db.prepare(`
      SELECT oi.name, SUM(oi.quantity) as sold, SUM(oi.total) as revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.payment_status = 'paid'
      GROUP BY oi.product_id
      ORDER BY revenue DESC LIMIT 5
    `).all();

    // Recent orders
    const recentOrders = db.prepare(`
      SELECT o.*, u.name as customer_name
      FROM orders o LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC LIMIT 10
    `).all();

    // Low stock alerts
    const lowStockItems = db.prepare(`
      SELECT id, name, sku, quantity FROM products 
      WHERE quantity <= 5 AND track_inventory = 1 AND is_active = 1
      ORDER BY quantity ASC LIMIT 10
    `).all();

    // Sales last 7 days
    const salesByDay = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as orders, COALESCE(SUM(total), 0) as revenue
      FROM orders WHERE payment_status = 'paid' AND created_at >= datetime('now', '-7 days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all();

    // Sales by category
    const salesByCategory = db.prepare(`
      SELECT c.name as category, COALESCE(SUM(oi.total), 0) as revenue, SUM(oi.quantity) as sold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.payment_status = 'paid'
      GROUP BY c.id
      ORDER BY revenue DESC
    `).all();

    return NextResponse.json({
      stats: {
        totalRevenue: totalRevenue.value,
        todayRevenue: todayRevenue.value,
        monthRevenue: monthRevenue.value,
        totalOrders: totalOrders.value,
        pendingOrders: pendingOrders.value,
        processingOrders: processingOrders.value,
        totalCustomers: totalCustomers.value,
        newCustomersToday: newCustomersToday.value,
        totalProducts: totalProducts.value,
        lowStockProducts: lowStockProducts.value,
      },
      topProducts,
      recentOrders,
      lowStockItems,
      salesByDay,
      salesByCategory,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
