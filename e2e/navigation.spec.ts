import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to settings', async ({ page }) => {
    await page.click('a[href="/settings"]');
    await expect(page).toHaveURL(/.*settings/);
  });

  test('should navigate to playlists', async ({ page }) => {
    await page.click('a[href="/playlists"]');
    await expect(page).toHaveURL(/.*playlists/);
  });

  test('should navigate to generator', async ({ page }) => {
    await page.click('a[href="/generator"]');
    await expect(page).toHaveURL(/.*generator/);
  });

  test('should navigate back to library', async ({ page }) => {
    // First go to settings
    await page.click('a[href="/settings"]');
    await expect(page).toHaveURL(/.*settings/);
    
    // Click library link to go back
    await page.click('a[href="/library"]');
    await expect(page).toHaveURL(/.*library/);
  });
});
