import { expect, test } from '@playwright/test';
import { signIn } from './helpers';

test('US-005: add free-form text tags to a note for categorization', async ({ page }) => {
  await signIn(page);
  await page.goto('/notes');
  await page.getByRole('button', { name: '+ New Note' }).click();
  const uniqueTitle = `Tag Test ${Date.now()}`;
  await page.getByRole('textbox', { name: 'Title' }).fill(uniqueTitle);
  await page.getByPlaceholder('work, personal, urgent').fill('project-alpha, important');
  await page.getByRole('button', { name: 'Create Note' }).click();
  await expect(
    page.locator('section', { hasText: uniqueTitle }).getByText('project-alpha'),
  ).toBeVisible();
  await expect(
    page.locator('section', { hasText: uniqueTitle }).getByText('important'),
  ).toBeVisible();
});

test('US-006: set a reminder for a note', async ({ page }) => {
  await signIn(page);
  await page.goto('/notes');
  await page.getByRole('button', { name: '+ New Note' }).click();
  const uniqueTitle = `Reminder Test ${Date.now()}`;
  await page.getByRole('textbox', { name: 'Title' }).fill(uniqueTitle);
  await page.locator('input[type="datetime-local"]').fill('2026-12-31T12:00');
  await page.getByRole('button', { name: 'Create Note' }).click();
  await expect(
    page.locator('section', { hasText: uniqueTitle }).getByText('Reminder:'),
  ).toBeVisible();
});

test('US-015: organize notes visually on a colorful corkboard-style board', async ({ page }) => {
  await signIn(page);
  await page.goto('/notes');
  await page.getByRole('button', { name: '+ New Note' }).click();
  const uniqueTitle = `Corkboard Note ${Date.now()}`;
  await page.getByRole('textbox', { name: 'Title' }).fill(uniqueTitle);
  await page.getByRole('button', { name: 'Create Note' }).click();
  const card = page.locator('section', { hasText: uniqueTitle });
  await expect(card).toBeVisible();
  const box = await card.boundingBox();
  if (box) {
    await page.mouse.move(box.x + 10, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.up();
  }
  await expect(card).toBeVisible();
});

test('US-013: verify responsive layout on mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await signIn(page);
  await page.goto('/notes');
  await expect(page.getByRole('heading', { name: 'Corkboard', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '+ New Note' }).click();
  const uniqueTitle = `Mobile Note ${Date.now()}`;
  await page.getByRole('textbox', { name: 'Title' }).fill(uniqueTitle);
  await page.getByRole('button', { name: 'Create Note' }).click();
  await expect(page.getByText(uniqueTitle)).toBeVisible();
});
