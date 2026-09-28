import type { Role } from '@prisma/client';

/** Roles as values for forms and validation (safe to import in client components). */
export const ROLES = ['ADMIN', 'MEMBER'] as const satisfies readonly Role[];

export const ROLE_LABELS: Record<Role, string> = { ADMIN: 'Admin', MEMBER: 'Member' };
