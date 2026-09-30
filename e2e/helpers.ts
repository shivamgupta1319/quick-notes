import type { Page } from '@playwright/test';

export async function signIn(page: Page) {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(process.env.E2E_EMAIL ?? 'admin@example.com');
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD ?? 'password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');
}
