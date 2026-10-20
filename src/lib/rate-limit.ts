import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory limiter: good enough for a single server instance. Use Redis or similar if you scale out.
const hits = new Map<string, number[]>();

export function clientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
}

/** Returns a 429 response when `key` made more than `max` requests in `windowMs`, otherwise null. */
export function rateLimit(request: NextRequest, name: string, max: number, windowMs: number): NextResponse | null {
  const key = `${name}:${clientIp(request)}`;
  const now = Date.now();
  const recent = (hits.get(key) || []).filter(t => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return NextResponse.json({ error: 'Too many attempts. Please wait a few minutes and try again.' }, { status: 429 });
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(t => now - t < windowMs)) hits.delete(k);
  return null;
}
