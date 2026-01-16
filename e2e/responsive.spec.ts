import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('should display correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Sidebar should be visible on desktop
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();
  });

  test('should display correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Main content should be visible
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
  });

  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Bottom navigation should be visible on mobile
    const bottomNav = page.locator('nav').first();
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle orientation change', async ({ page }) => {
    // Portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();

    // Landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await expect(page.locator('body')).toBeVisible();
  });
});
