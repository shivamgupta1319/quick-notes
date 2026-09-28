import type { Metadata } from 'next';
import { PageHeader } from '@/components/app-shell/page-header';
import { UserForm } from '@/components/users/user-form';
import { requireRole } from '@/lib/auth';

export const metadata: Metadata = { title: 'New user' };

export default async function NewUserPage() {
  await requireRole('ADMIN');
  return (
    <>
      <PageHeader title="New user" />
      <UserForm />
    </>
  );
}
