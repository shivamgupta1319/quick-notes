import { createHash, randomBytes } from 'node:crypto';
import type { Role } from '@prisma/client';
import { db } from './db';

export const SESSION_COOKIE = 'session';
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** What the app knows about the signed-in user. Never includes the password hash. */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Start a session. The raw token goes into the cookie; only its hash is stored. */
export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db().session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  return { token, expiresAt };
}

/** The user behind a session token, or null when it is unknown or expired. */
export async function findSessionUser(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  const session = await db().session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true, name: true, role: true } } },
  });
  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await db()
      .session.delete({ where: { id: session.id } })
      .catch(() => undefined);
    return null;
  }
  return session.user;
}

export async function deleteSession(token: string | undefined): Promise<void> {
  if (!token) return;
  await db().session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

/** Cookie attributes for the session cookie. */
export function sessionCookie(token: string, expiresAt: Date) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  };
}
