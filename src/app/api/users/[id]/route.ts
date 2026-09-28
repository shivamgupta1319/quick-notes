import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { ApiError, parseBody, withUser } from '@/lib/api';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { USER_SELECT } from '@/lib/users';
import { UpdateUserBody } from '@/lib/validation/users';

type Ctx = RouteContext<'/api/users/[id]'>;

async function findOr404(id: string) {
  const user = await db().user.findUnique({ where: { id }, select: USER_SELECT });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

export const GET = withUser<Ctx>(
  async (_req, { params }) => {
    const { id } = await params;
    return NextResponse.json({ user: await findOr404(id) });
  },
  { roles: ['ADMIN'] },
);

/** Update a user. Admins cannot change their own role, so there is always an admin left. */
export const PATCH = withUser<Ctx>(
  async (req, { params, user: me }) => {
    const { id } = await params;
    const { password, ...data } = await parseBody(req, UpdateUserBody);
    const current = await findOr404(id);
    if (id === me.id && data.role !== undefined && data.role !== current.role) {
      throw new ApiError(400, 'You cannot change your own role');
    }
    try {
      const user = await db().user.update({
        where: { id },
        data: { ...data, ...(password ? { passwordHash: await hashPassword(password) } : {}) },
        select: USER_SELECT,
      });
      return NextResponse.json({ user });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ApiError(409, 'A user with this email already exists');
      }
      throw err;
    }
  },
  { roles: ['ADMIN'] },
);

/** Delete a user and their sessions. Admins cannot delete themselves. */
export const DELETE = withUser<Ctx>(
  async (_req, { params, user: me }) => {
    const { id } = await params;
    if (id === me.id) throw new ApiError(400, 'You cannot delete yourself');
    await findOr404(id);
    await db().user.delete({ where: { id } });
    return new Response(null, { status: 204 });
  },
  { roles: ['ADMIN'] },
);
