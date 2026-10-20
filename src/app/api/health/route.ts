import { NextResponse } from 'next/server';
import { getDb, isStoragePersistent } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Used by Docker health checks and CI smoke tests. Answers 200 when the app can reach its database.
export async function GET() {
  try {
    const row = getDb().prepare('SELECT COUNT(*) AS products FROM products').get() as { products: number };
    return NextResponse.json({ status: 'ok', products: row.products, persistentStorage: isStoragePersistent() });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({ status: 'error' }, { status: 503 });
  }
}
