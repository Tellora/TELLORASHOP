import { NextRequest, NextResponse } from 'next/server';
import { getDb, isStoragePersistent } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getAllSettings, num } from '@/lib/settings';

// Live numbers for the admin sidebar badges (replaces the hard-coded ones).
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const count = (sql: string, ...p: unknown[]) => (db.prepare(sql).get(...p) as { n: number }).n;
    const lowStock = num(getAllSettings(db), 'low_stock_threshold', 5);
    return NextResponse.json({
      products: count('SELECT COUNT(*) n FROM products'),
      categories: count('SELECT COUNT(*) n FROM categories'),
      orders_new: count("SELECT COUNT(*) n FROM orders WHERE status IN ('pending', 'confirmed')"),
      customers: count("SELECT COUNT(*) n FROM users WHERE role = 'customer'"),
      coupons: count('SELECT COUNT(*) n FROM coupons WHERE is_active = 1'),
      reviews_pending: count('SELECT COUNT(*) n FROM reviews WHERE is_approved = 0'),
      messages_new: count("SELECT COUNT(*) n FROM contact_messages WHERE status = 'new'"),
      subscribers: count('SELECT COUNT(*) n FROM newsletter WHERE is_active = 1'),
      storage_persistent: isStoragePersistent() ? 1 : 0,
      low_stock: count('SELECT COUNT(*) n FROM products WHERE track_inventory = 1 AND is_active = 1 AND quantity <= ?', lowStock),
    });
  } catch (error) {
    console.error('Admin counts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
