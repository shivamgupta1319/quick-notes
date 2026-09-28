import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { APP_NAME } from '@/config/nav';
import { getCurrentUser } from '@/lib/auth';
import { SignInForm } from './sign-in-form';

export const metadata: Metadata = { title: 'Sign in' };

export default async function SignInPage() {
  if (await getCurrentUser()) redirect('/dashboard');
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold">{APP_NAME}</h1>
        <SignInForm />
      </div>
    </main>
  );
}
