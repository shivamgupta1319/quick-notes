import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Liveness plus a database round trip; the staging deploy polls this. */
export async function GET(): Promise<Response> {
  try {
    await db().$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', db: 'ok' });
  } catch {
    return NextResponse.json({ status: 'error', db: 'unreachable' }, { status: 503 });
  }
}
