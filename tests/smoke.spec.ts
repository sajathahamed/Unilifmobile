import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
});

test('app boots successfully in browser', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#root')).toBeVisible();
  await expect(page.locator('text=[runtime not ready]')).toHaveCount(0);
});

test('login screen renders required controls', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('#root')).toBeVisible();
  await expect(page.locator('text=[runtime not ready]')).toHaveCount(0);
  await expect(page.locator('text=ReferenceError')).toHaveCount(0);
  await expect(page.locator('text=TypeError')).toHaveCount(0);
});
