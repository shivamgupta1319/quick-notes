import { createUser, request, resetDb } from '@test/helpers';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { SESSION_COOKIE } from '@/lib/session';
import { GET as session } from './session/route';
import { POST as signIn } from './sign-in/route';
import { POST as signOut } from './sign-out/route';

beforeEach(resetDb);

function cookieFrom(res: Response): string | undefined {
  const match = res.headers.get('set-cookie')?.match(new RegExp(`${SESSION_COOKIE}=([^;]*)`));
  return match?.[1];
}

describe('POST /api/auth/sign-in', () => {
  it('signs in with the right password and sets an httpOnly session cookie', async () => {
    await createUser({ email: 'ada@example.com', password: 'secret-pass' });
    const res = await signIn(
      await request('/api/auth/sign-in', {
        method: 'POST',
        body: { email: 'ADA@example.com', password: 'secret-pass' },
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ user: { email: 'ada@example.com' } });
    expect(res.headers.get('set-cookie')).toMatch(/HttpOnly/i);
    expect(cookieFrom(res)).toBeTruthy();
  });

  it('answers 401 for a wrong password or an unknown email', async () => {
    await createUser({ email: 'ada@example.com', password: 'secret-pass' });
    for (const body of [
      { email: 'ada@example.com', password: 'nope' },
      { email: 'nobody@example.com', password: 'secret-pass' },
    ]) {
      const res = await signIn(await request('/api/auth/sign-in', { method: 'POST', body }));
      expect(res.status).toBe(401);
      expect(cookieFrom(res)).toBeUndefined();
    }
  });

  it('answers 400 for invalid input', async () => {
    const res = await signIn(
      await request('/api/auth/sign-in', { method: 'POST', body: { email: 'not-an-email' } }),
    );
    expect(res.status).toBe(400);
  });
});

describe('session and sign-out', () => {
  it('returns the signed-in user without the password hash', async () => {
    const user = await createUser();
    const res = await session(await request('/api/auth/session', { user }), {});
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toMatchObject({ id: user.id, role: 'MEMBER' });
    expect(body.user.passwordHash).toBeUndefined();
  });

  it('answers 401 without a session', async () => {
    const res = await session(await request('/api/auth/session'), {});
    expect(res.status).toBe(401);
  });

  it('rejects an expired session', async () => {
    const user = await createUser();
    const req = await request('/api/auth/session', { user });
    await db().session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await session(req, {})).status).toBe(401);
  });

  it('sign-out ends the session', async () => {
    const user = await createUser();
    const req = await request('/api/auth/sign-out', { method: 'POST', user });
    const cookie = req.headers.get('cookie') ?? '';
    expect((await signOut(req)).status).toBe(200);
    const after = new Request('http://localhost/api/auth/session', { headers: { cookie } });
    expect((await session(after, {})).status).toBe(401);
  });
});
