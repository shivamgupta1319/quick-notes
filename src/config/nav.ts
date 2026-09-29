import type { Role } from '@prisma/client';

export interface NavItem {
  href: string;
  label: string;
  /** Only these roles see the item; everyone signed in when omitted. */
  roles?: readonly Role[];
}

/** Top navigation. Add one entry per resource screen (CONVENTIONS.md). */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/notes', label: 'Corkboard' },
  { href: '/notes/archive', label: 'Archived Notes' },
  { href: '/users', label: 'Users', roles: ['ADMIN'] },
];

export const APP_NAME = 'App';
