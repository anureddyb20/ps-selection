import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { Team } from './types';

// Server-side secrets (NEVER exposed to frontend NEXT_PUBLIC_*)
const ADMIN_ACCESS_CODE = process.env.ADMIN_ACCESS_CODE || '123654';
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'super_secret_vvce_ideathon_admin_session_key_2026';

export const ADMIN_COOKIE_NAME = 'vvce_admin_session';
export const TEAM_COOKIE_NAME = 'vvce_team_session';

/**
 * Hash a team password using PBKDF2 with a unique salt (environment independent)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password.trim(), salt, 10000, 32, 'sha256').toString('hex');
  return `pbkdf2:${salt}:${hash}`;
}

/**
 * Verify team password against stored hash with multiple format support
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  const cleanPass = password.trim();

  // 1. Direct match (safety fallback)
  if (storedHash === cleanPass) return true;

  // 2. PBKDF2 format: pbkdf2:salt:hash
  if (storedHash.startsWith('pbkdf2:')) {
    const parts = storedHash.split(':');
    if (parts.length === 3) {
      const [, salt, originalHash] = parts;
      const computed = crypto.pbkdf2Sync(cleanPass, salt, 10000, 32, 'sha256').toString('hex');
      if (computed.length === originalHash.length && crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(originalHash))) {
        return true;
      }
    }
  }

  // 3. Two-part format: salt:hash (supports PBKDF2 and HMAC across any environment secret)
  const parts = storedHash.split(':');
  if (parts.length === 2) {
    const [salt, originalHash] = parts;

    // Try PBKDF2 (32 bytes)
    const computedPbkdf2 = crypto.pbkdf2Sync(cleanPass, salt, 10000, 32, 'sha256').toString('hex');
    if (computedPbkdf2.length === originalHash.length && crypto.timingSafeEqual(Buffer.from(computedPbkdf2), Buffer.from(originalHash))) {
      return true;
    }

    // Try HMAC with possible secrets
    const possibleSecrets = [
      process.env.ADMIN_JWT_SECRET || '',
      'super_secret_vvce_ideathon_admin_session_key_2026',
      'vvce_ideathon_admin_secure_secret_hash_token_2026',
    ].filter(Boolean);

    for (const secret of possibleSecrets) {
      const hmac = crypto.createHmac('sha256', secret).update(`${salt}:${cleanPass}`).digest('hex');
      if (hmac.length === originalHash.length && crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(originalHash))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Creates a signed session token for an authenticated Team
 */
export function createTeamSessionToken(team: Team): string {
  const payload = {
    role: 'team',
    id: team.id,
    team_id: team.team_id,
    team_name: team.team_name,
    domain: team.domain,
    issuedAt: Date.now(),
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`team:${payloadStr}`)
    .digest('base64url');

  return `${payloadStr}.${signature}`;
}

/**
 * Verifies a Team session token
 */
export function verifyTeamSessionToken(token: string | undefined | null): {
  id: string;
  team_id: string;
  team_name: string;
  domain: string;
} | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadStr, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`team:${payloadStr}`)
    .digest('base64url');

  if (signature.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf-8'));
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    if (Date.now() - payload.issuedAt > maxAgeMs) {
      return null;
    }
    if (payload.role !== 'team') return null;

    return {
      id: payload.id,
      team_id: payload.team_id,
      team_name: payload.team_name,
      domain: payload.domain,
    };
  } catch {
    return null;
  }
}

/**
 * Get logged in team session from NextRequest
 */
export function getAuthenticatedTeamFromRequest(req: NextRequest): {
  id: string;
  team_id: string;
  team_name: string;
  domain: string;
} | null {
  const token = req.cookies.get(TEAM_COOKIE_NAME)?.value;
  return verifyTeamSessionToken(token);
}

// ====================================================================
// ADMIN AUTHENTICATION
// ====================================================================

export function createSessionToken(): string {
  const payload = {
    role: 'vvce_organizer',
    issuedAt: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex'),
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`admin:${payloadStr}`)
    .digest('base64url');

  return `${payloadStr}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadStr, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`admin:${payloadStr}`)
    .digest('base64url');

  if (signature.length !== expectedSig.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf-8'));
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - payload.issuedAt > maxAgeMs) {
      return false;
    }
    return payload.role === 'vvce_organizer';
  } catch {
    return false;
  }
}

export function verifyAdminAccessCode(inputCode: string): boolean {
  if (!inputCode || typeof inputCode !== 'string') return false;

  const inputBuffer = Buffer.from(inputCode.trim());
  const actualBuffer = Buffer.from(ADMIN_ACCESS_CODE.trim());

  if (inputBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(inputBuffer, actualBuffer);
}

export function isRequestAuthorizedAdmin(req: NextRequest): boolean {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (verifySessionToken(cookie)) {
    return true;
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (verifySessionToken(token)) {
      return true;
    }
  }

  return false;
}
