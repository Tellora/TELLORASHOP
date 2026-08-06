import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, subtotal } = body;

    if (!code) return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });

    const db = getDb();
    const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').get(code.toUpperCase()) as Record<string, unknown> | undefined;

    if (!coupon) return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 });

    // Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at as string) < new Date()) {
      return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 });
    }

    // Check start date
    if (coupon.starts_at && new Date(coupon.starts_at as string) > new Date()) {
      return NextResponse.json({ error: 'Coupon is not yet active' }, { status: 400 });
    }

    // Check usage limit
    if (coupon.max_uses && (coupon.used_count as number) >= (coupon.max_uses as number)) {
      return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
    }

    // Check minimum purchase
    if (subtotal && subtotal < (coupon.min_purchase as number)) {
      return NextResponse.json({ error: `Minimum purchase of $${coupon.min_purchase} required` }, { status: 400 });
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (subtotal || 0) * ((coupon.value as number) / 100);
    } else {
      discount = coupon.value as number;
    }

    return NextResponse.json({ 
      valid: true, 
      coupon: { code: coupon.code, type: coupon.type, value: coupon.value },
      discount: Math.min(discount, subtotal || discount) 
    });
  } catch (error) {
    console.error('Coupon validate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
