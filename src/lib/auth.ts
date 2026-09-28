import type { Role } from '@prisma/client';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { findSessionUser, SESSION_COOKIE, type SessionUser } from './session';

/** The signed-in user in a server component, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return findSessionUser(store.get(SESSION_COOKIE)?.value);
}

/** The signed-in user in a server component; sends everyone else to the sign-in page. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  return user;
}

/** Like `requireUser`, and shows not-found to users without one of the roles. */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) notFound();
  return user;
}
