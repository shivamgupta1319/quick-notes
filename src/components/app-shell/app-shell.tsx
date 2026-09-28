'use client';

import { LogOut, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { APP_NAME, type NavItem } from '@/config/nav';
import type { SessionUser } from '@/lib/session';
import { cn } from '@/lib/utils';

/** Top navigation (a menu button on phones), the signed-in user, and the page content. */
export function AppShell({
  user,
  items,
  children,
}: {
  user: SessionUser;
  items: readonly NavItem[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await fetch('/api/auth/sign-out', { method: 'POST' });
    router.replace('/sign-in');
    router.refresh();
  }

  const links = items.map((item) => {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setOpen(false)}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex min-h-11 items-center rounded-md px-3 text-sm font-medium hover:bg-accent',
          active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
        )}
      >
        {item.label}
      </Link>
    );
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link href="/dashboard" className="font-semibold">
            {APP_NAME}
          </Link>
          <nav className="hidden flex-1 items-center gap-1 md:flex">{links}</nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden max-w-48 truncate text-sm text-muted-foreground sm:inline">
              {user.name}
            </span>
            <Button variant="ghost" size="icon-lg" onClick={signOut} aria-label="Sign out">
              <LogOut />
            </Button>
            <Button
              variant="ghost"
              size="icon-lg"
              className="md:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        {open && <nav className="flex flex-col gap-1 border-t px-4 py-2 md:hidden">{links}</nav>}
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
