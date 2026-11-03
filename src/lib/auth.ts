import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// Server-side admin configuration (NEVER expose to frontend NEXT_PUBLIC_*)
const ADMIN_ACCESS_CODE = process.env.ADMIN_ACCESS_CODE || '123654';
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'vvce_ideathon_admin_secure_secret_hash_token_2026';
export const ADMIN_COOKIE_NAME = 'vvce_admin_session';

/**
 * Creates a cryptographically signed session token.
 */
export function createSessionToken(): string {
  const payload = {
    role: 'vvce_organizer',
    issuedAt: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex'),
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(payloadStr)
    .digest('base64url');

  return `${payloadStr}.${signature}`;
}

/**
 * Validates a signed session token.
 */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadStr, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(payloadStr)
    .digest('base64url');

  if (signature.length !== expectedSig.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf-8'));
    // Valid for 7 days
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - payload.issuedAt > maxAgeMs) {
      return false;
    }
    return payload.role === 'vvce_organizer';
  } catch {
    return false;
  }
}

/**
 * Verifies if the supplied code matches the configured admin access code using timing-safe comparison.
 */
export function verifyAdminAccessCode(inputCode: string): boolean {
  if (!inputCode || typeof inputCode !== 'string') return false;

  const inputBuffer = Buffer.from(inputCode.trim());
  const actualBuffer = Buffer.from(ADMIN_ACCESS_CODE.trim());

  if (inputBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(inputBuffer, actualBuffer);
}

/**
 * Helper to verify an incoming NextRequest for admin endpoints.
 */
export function isRequestAuthorizedAdmin(req: NextRequest): boolean {
  // Check cookie
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (verifySessionToken(cookie)) {
    return true;
  }

  // Check Bearer authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (verifySessionToken(token)) {
      return true;
    }
  }

  return false;
}

