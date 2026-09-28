import type { Prisma } from '@prisma/client';

/** The fields of a user the app may show or return. Never the password hash. */
export const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type UserDto = Prisma.UserGetPayload<{ select: typeof USER_SELECT }>;
