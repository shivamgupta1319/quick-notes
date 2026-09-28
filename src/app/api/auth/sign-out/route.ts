import { NextResponse } from 'next/server';
import { readCookie } from '@/lib/api';
import { deleteSession, SESSION_COOKIE } from '@/lib/session';

export async function POST(req: Request): Promise<Response> {
  await deleteSession(readCookie(req, SESSION_COOKIE));
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
