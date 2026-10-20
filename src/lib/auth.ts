import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getDataDir, isStoragePersistent } from '@/lib/db';

export class AuthConfigError extends Error {}

let cachedSecret: Uint8Array | undefined;

/**
 * Signing key for login sessions.
 * 1. JWT_SECRET from the environment (recommended).
 * 2. In production with persistent storage: a random key generated once and saved next to the database.
 * 3. In production with temporary storage (serverless) there is nowhere safe to keep one, so login is refused
 *    until JWT_SECRET is set. Browsing the shop keeps working.
 * Development uses a fixed insecure key.
 */
function getSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv) return (cachedSecret = new TextEncoder().encode(fromEnv));
  if (process.env.NODE_ENV !== 'production') return new TextEncoder().encode('dev-only-insecure-secret-change-me');

  if (!isStoragePersistent()) {
    throw new AuthConfigError('Login is not configured yet: set the JWT_SECRET environment variable.');
  }
  const file = path.join(getDataDir(), '.jwt-secret');
  try {
    cachedSecret = new TextEncoder().encode(fs.readFileSync(file, 'utf8').trim());
  } catch {
    const generated = crypto.randomBytes(48).toString('hex');
    fs.writeFileSync(file, generated, { mode: 0o600 });
    console.warn(`JWT_SECRET is not set; generated a signing key at ${file}. Set JWT_SECRET to manage it yourself.`);
    cachedSecret = new TextEncoder().encode(generated);
  }
  return cachedSecret;
}

const TOKEN_EXPIRY = '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(TOKEN_EXPIRY)
    .setIssuedAt()
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getTokenFromRequest(request: NextRequest): Promise<string | null> {
  // Check Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check cookie
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('token');
  return tokenCookie?.value || null;
}

export async function getCurrentUser(request: NextRequest): Promise<JWTPayload | null> {
  const token = await getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(request: NextRequest): Promise<JWTPayload> {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireAdmin(request: NextRequest): Promise<JWTPayload> {
  const user = await requireAuth(request);
  if (user.role !== 'admin') {
    throw new Error('Forbidden');
  }
  return user;
}
