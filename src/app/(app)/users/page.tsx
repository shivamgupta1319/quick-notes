import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/app-shell/page-header';
import { ListPagination } from '@/components/list-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { pageArgs, parsePage } from '@/lib/pagination';
import { ROLE_LABELS } from '@/lib/roles';
import { USER_SELECT } from '@/lib/users';

export const metadata: Metadata = { title: 'Users' };

const date = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

/** Users list: a table from tablet width up, stacked cards on phones. */
export default async function UsersPage({ searchParams }: PageProps<'/users'>) {
  await requireRole('ADMIN');
  const page = parsePage((await searchParams).page);
  const [users, total] = await Promise.all([
    db().user.findMany({ select: USER_SELECT, orderBy: { createdAt: 'desc' }, ...pageArgs(page) }),
    db().user.count(),
  ]);

  return (
    <>
      <PageHeader
        title="Users"
        description="People who can sign in."
        actions={
          <Button asChild className="h-11">
            <Link href="/users/new">New user</Link>
          </Button>
        }
      />
      <ul className="flex flex-col gap-2 md:hidden">
        {users.map((u) => (
          <li key={u.id}>
            <Link
              href={`/users/${u.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border p-4 hover:bg-accent"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{u.name}</div>
                <div className="truncate text-sm text-muted-foreground">{u.email}</div>
              </div>
              <Badge variant="secondary">{ROLE_LABELS[u.role]}</Badge>
            </Link>
          </li>
        ))}
      </ul>
      <div className="hidden rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  <Link href={`/users/${u.id}`} className="hover:underline">
                    {u.name}
                  </Link>
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{ROLE_LABELS[u.role]}</Badge>
                </TableCell>
                <TableCell>{date.format(u.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ListPagination path="/users" page={page} total={total} />
    </>
  );
}
