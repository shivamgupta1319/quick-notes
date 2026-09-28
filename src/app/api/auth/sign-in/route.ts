import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiError, apiError, parseBody } from '@/lib/api';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/password';
import { createSession, sessionCookie } from '@/lib/session';

const SignInBody = z.object({
  email: z.email().transform((e) => e.toLowerCase()),
  password: z.string().min(1).max(200),
});

// Compared against when the email is unknown, so both cases take the same time.
const dummyHash = hashPassword('not-a-real-password');

export async function POST(req: Request): Promise<Response> {
  try {
    const { email, password } = await parseBody(req, SignInBody);
    const user = await db().user.findUnique({ where: { email } });
    const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
    if (!user || !ok) return apiError(401, 'Wrong email or password');

    const { token, expiresAt } = await createSession(user.id);
    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
    res.cookies.set(sessionCookie(token, expiresAt));
    return res;
  } catch (err) {
    if (err instanceof ApiError) return apiError(err.status, err.message, err.details);
    throw err;
  }
}
