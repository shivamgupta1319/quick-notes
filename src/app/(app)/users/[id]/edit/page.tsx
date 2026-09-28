import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/app-shell/page-header';
import { UserForm } from '@/components/users/user-form';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { USER_SELECT } from '@/lib/users';

export const metadata: Metadata = { title: 'Edit user' };

export default async function EditUserPage({ params }: PageProps<'/users/[id]/edit'>) {
  await requireRole('ADMIN');
  const { id } = await params;
  const user = await db().user.findUnique({ where: { id }, select: USER_SELECT });
  if (!user) notFound();
  return (
    <>
      <PageHeader title={`Edit ${user.name}`} />
      <UserForm user={user} />
    </>
  );
}
