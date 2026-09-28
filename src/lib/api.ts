import type { Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import type { z } from 'zod';
import { findSessionUser, SESSION_COOKIE, type SessionUser } from './session';

/** Throw inside a handler to answer with this status and message. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export function apiError(status: number, message: string, details?: unknown): NextResponse {
  return NextResponse.json(
    details === undefined ? { error: message } : { error: message, details },
    {
      status,
    },
  );
}

/** Read one cookie from a request's Cookie header. */
export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.get('cookie');
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

export function userFromRequest(req: Request): Promise<SessionUser | null> {
  return findSessionUser(readCookie(req, SESSION_COOKIE));
}

/** Parse and validate a JSON body; answers 400 with the zod issues when it does not fit. */
export async function parseBody<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, 'Body must be JSON');
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, 'Invalid input', parsed.error.issues);
  return parsed.data;
}

type Handler<C> = (req: Request, ctx: C & { user: SessionUser }) => Promise<Response>;

/**
 * Wrap a route handler so it only runs for a signed-in user (401 otherwise), optionally with one
 * of `roles` (403 otherwise). `ApiError`s thrown inside become JSON error responses.
 */
export function withUser<C extends object>(
  handler: Handler<C>,
  options: { roles?: readonly Role[] } = {},
): (req: Request, ctx: C) => Promise<Response> {
  return async (req, ctx) => {
    const user = await userFromRequest(req);
    if (!user) return apiError(401, 'Sign in first');
    if (options.roles && !options.roles.includes(user.role)) return apiError(403, 'Not allowed');
    try {
      return await handler(req, { ...ctx, user });
    } catch (err) {
      if (err instanceof ApiError) return apiError(err.status, err.message, err.details);
      throw err;
    }
  };
}
