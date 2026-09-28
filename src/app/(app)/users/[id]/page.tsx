import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/app-shell/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DeleteUserButton } from '@/components/users/delete-user-button';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { ROLE_LABELS } from '@/lib/roles';
import { USER_SELECT } from '@/lib/users';

export const metadata: Metadata = { title: 'User' };

const date = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });

export default async function UserPage({ params }: PageProps<'/users/[id]'>) {
  const me = await requireRole('ADMIN');
  const { id } = await params;
  const user = await db().user.findUnique({ where: { id }, select: USER_SELECT });
  if (!user) notFound();

  return (
    <>
      <PageHeader
        title={user.name}
        actions={
          <>
            <Button asChild variant="outline" className="h-11">
              <Link href={`/users/${user.id}/edit`}>Edit</Link>
            </Button>
            {user.id !== me.id && <DeleteUserButton id={user.id} name={user.name} />}
          </>
        }
      />
      <Card className="max-w-xl">
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-[8rem_1fr]">
            <dt className="text-sm text-muted-foreground">Email</dt>
            <dd className="break-all">{user.email}</dd>
            <dt className="text-sm text-muted-foreground">Role</dt>
            <dd>
              <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
            </dd>
            <dt className="text-sm text-muted-foreground">Added</dt>
            <dd>{date.format(user.createdAt)}</dd>
          </dl>
        </CardContent>
      </Card>
    </>
  );
}
