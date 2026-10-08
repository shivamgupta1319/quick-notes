import { expect, test } from '@playwright/test';
import { signIn } from './helpers';

test('US-002: create a note with title, body, tags, reminders and formatting options', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/notes');
  await page.getByRole('button', { name: '+ New Note' }).click();
  const uniqueTitle = `Test Note ${Date.now()}`;
  await page.getByRole('textbox', { name: 'Title' }).fill(uniqueTitle);
  await page.getByLabel('Bold Title').click();
  await page.getByLabel('Body').fill('This is a test note body.');
  await page.getByPlaceholder('work, personal, urgent').fill('work, urgent');
  await page.getByRole('button', { name: 'Create Note' }).click();
  await expect(page.getByText(uniqueTitle)).toBeVisible();
  await expect(page.locator('section', { hasText: uniqueTitle }).getByText('work')).toBeVisible();
});

test('US-003: edit an existing note title, body and formatting', async ({ page }) => {
  await signIn(page);
  await page.goto('/notes');
  await page.getByRole('button', { name: '+ New Note' }).click();
  const uniqueTitle = `Edit Me ${Date.now()}`;
  await page.getByRole('textbox', { name: 'Title' }).fill(uniqueTitle);
  await page.getByLabel('Body').fill('Original body');
  await page.getByRole('button', { name: 'Create Note' }).click();
  await expect(page.getByText(uniqueTitle)).toBeVisible();

  await page
    .locator('section', { hasText: uniqueTitle })
    .locator('button')
    .filter({ hasText: '✎' })
    .click();
  const updatedTitle = `${uniqueTitle} Updated`;
  await page
    .locator('div[role="dialog"] input, div[role="dialog"] textbox')
    .first()
    .fill(updatedTitle);
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByText(updatedTitle)).toBeVisible();
});

test('US-004: delete a note from the board', async ({ page }) => {
  await signIn(page);
  await page.goto('/notes');
  await page.getByRole('button', { name: '+ New Note' }).click();
  const uniqueTitle = `Delete Me ${Date.now()}`;
  await page.getByRole('textbox', { name: 'Title' }).fill(uniqueTitle);
  await page.getByLabel('Body').fill('To be deleted');
  await page.getByRole('button', { name: 'Create Note' }).click();
  await expect(page.getByText(uniqueTitle)).toBeVisible();

  await page
    .locator('section', { hasText: uniqueTitle })
    .locator('button')
    .filter({ hasText: '✕' })
    .click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByText(uniqueTitle)).not.toBeVisible();
});

test('US-014: archive a note and view in archive', async ({ page }) => {
  await signIn(page);
  await page.goto('/notes');
  await page.getByRole('button', { name: '+ New Note' }).click();
  const uniqueTitle = `Archive Me ${Date.now()}`;
  await page.getByRole('textbox', { name: 'Title' }).fill(uniqueTitle);
  await page.getByLabel('Body').fill('To be archived');
  await page.getByRole('button', { name: 'Create Note' }).click();
  await expect(page.getByText(uniqueTitle)).toBeVisible();

  await page
    .locator('section', { hasText: uniqueTitle })
    .locator('button')
    .filter({ hasText: '📥' })
    .click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByText(uniqueTitle)).not.toBeVisible();

  await page.goto('/notes/archive');
  await expect(page.getByText(uniqueTitle)).toBeVisible();
});
