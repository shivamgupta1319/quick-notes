import { expect, test } from '@playwright/test';

test('US-001: secure user login with valid credentials and failure handling', async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(process.env.E2E_EMAIL ?? 'admin@example.com');
  await page.getByLabel('Password').fill('wrongpassword');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Wrong email or password.')).toBeVisible();

  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD ?? 'password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');
  await expect(page).toHaveURL(/.*dashboard/);
});
