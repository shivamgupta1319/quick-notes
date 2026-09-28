import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { ApiError, parseBody, withUser } from '@/lib/api';
import { db } from '@/lib/db';
import { PAGE_SIZE, type Page, pageArgs, parsePage } from '@/lib/pagination';
import { hashPassword } from '@/lib/password';
import { USER_SELECT, type UserDto } from '@/lib/users';
import { CreateUserBody } from '@/lib/validation/users';

/** List users, newest first (admins only). */
export const GET = withUser(
  async (req) => {
    const page = parsePage(new URL(req.url).searchParams.get('page'));
    const [items, total] = await Promise.all([
      db().user.findMany({
        select: USER_SELECT,
        orderBy: { createdAt: 'desc' },
        ...pageArgs(page),
      }),
      db().user.count(),
    ]);
    return NextResponse.json({ items, page, pageSize: PAGE_SIZE, total } satisfies Page<UserDto>);
  },
  { roles: ['ADMIN'] },
);

/** Create a user (admins only). 409 when the email is taken. */
export const POST = withUser(
  async (req) => {
    const { password, ...data } = await parseBody(req, CreateUserBody);
    try {
      const user = await db().user.create({
        data: { ...data, passwordHash: await hashPassword(password) },
        select: USER_SELECT,
      });
      return NextResponse.json({ user }, { status: 201 });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ApiError(409, 'A user with this email already exists');
      }
      throw err;
    }
  },
  { roles: ['ADMIN'] },
);
