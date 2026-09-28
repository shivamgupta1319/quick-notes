import type { Metadata } from 'next';
import { PageHeader } from '@/components/app-shell/page-header';
import { requireUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await requireUser();
  return (
    <PageHeader title={`Welcome, ${user.name}`} description="Choose a section from the menu." />
  );
}
