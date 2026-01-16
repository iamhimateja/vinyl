import { test, expect } from '@playwright/test';

test.describe('App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the app', async ({ page }) => {
    await expect(page).toHaveTitle(/Vinyl/i);
  });

  test('should display the sidebar', async ({ page }) => {
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();
  });

  test('should display the main content area', async ({ page }) => {
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
  });

  test('should display bottom player', async ({ page }) => {
    // Bottom player should be present
    const bottomPlayer = page.locator('[class*="fixed"][class*="bottom"]').first();
    await expect(bottomPlayer).toBeVisible();
  });
});
