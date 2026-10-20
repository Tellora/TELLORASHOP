import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// In production the secret must come from the environment; the fallback is for local development only.
function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return new TextEncoder().encode(secret || 'dev-only-insecure-secret-change-me');
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
