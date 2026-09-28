import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell/app-shell';
import { NAV_ITEMS } from '@/config/nav';
import { requireUser } from '@/lib/auth';

/** Every page in this group needs a signed-in user. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const items = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user.role));
  return (
    <AppShell user={user} items={items}>
      {children}
    </AppShell>
  );
}
