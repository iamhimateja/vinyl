import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to settings', async ({ page }) => {
    // Click settings link in sidebar
    await page.click('a[href="/settings"]');
    await expect(page).toHaveURL(/.*settings/);
  });

  test('should navigate to playlists', async ({ page }) => {
    await page.click('a[href="/playlists"]');
    await expect(page).toHaveURL(/.*playlists/);
  });

  test('should navigate to favorites', async ({ page }) => {
    await page.click('a[href="/favorites"]');
    await expect(page).toHaveURL(/.*favorites/);
  });

  test('should navigate back to home', async ({ page }) => {
    await page.click('a[href="/settings"]');
    await expect(page).toHaveURL(/.*settings/);
    
    // Click home/library link
    await page.click('a[href="/"]');
    await expect(page).toHaveURL('/');
  });
});
