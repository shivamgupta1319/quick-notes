import { NextResponse } from 'next/server';
import { withUser } from '@/lib/api';

/** The signed-in user (401 when signed out). */
export const GET = withUser(async (_req, { user }) => NextResponse.json({ user }));
