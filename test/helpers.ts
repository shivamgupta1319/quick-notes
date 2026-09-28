import type { Role, User } from '@prisma/client';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { createSession, SESSION_COOKIE } from '@/lib/session';
import { testDatabaseUrl } from './db-url';

testDatabaseUrl();

/** Empty every app table (not the migrations table). Call in `beforeEach`. */
export async function resetDb(): Promise<void> {
  const rows = await db().$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (rows.length === 0) return;
  const tables = rows.map((r) => `"public"."${r.tablename.replaceAll('"', '""')}"`).join(', ');
  await db().$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
}

let counter = 0;

export async function createUser(
  overrides: Partial<Pick<User, 'email' | 'name' | 'role'>> & { password?: string } = {},
): Promise<User> {
  counter += 1;
  const { password = 'test-password', ...rest } = overrides;
  return db().user.create({
    data: {
      email: `user${counter}@example.com`,
      name: `User ${counter}`,
      role: 'MEMBER' as Role,
      ...rest,
      passwordHash: await hashPassword(password),
    },
  });
}

/** A request with a session cookie for `user` (or no cookie when `user` is omitted). */
export async function request(
  path: string,
  init: { method?: string; body?: unknown; user?: User } = {},
): Promise<Request> {
  const headers = new Headers();
  if (init.body !== undefined) headers.set('content-type', 'application/json');
  if (init.user) {
    const { token } = await createSession(init.user.id);
    headers.set('cookie', `${SESSION_COOKIE}=${token}`);
  }
  return new Request(`http://localhost${path}`, {
    method: init.method ?? 'GET',
    headers,
    ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
  });
}

/** Route context for a dynamic route, e.g. `params({ id })`. */
export function params<P extends Record<string, string>>(p: P): { params: Promise<P> } {
  return { params: Promise.resolve(p) };
}
