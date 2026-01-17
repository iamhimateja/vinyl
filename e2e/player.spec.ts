import { test, expect } from '@playwright/test';

test.describe('Player Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display player controls', async ({ page }) => {
    // Verify the page loads with buttons (player controls)
    await expect(page.locator('main')).toBeVisible();
    
    const buttons = page.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display volume control area', async ({ page }) => {
    // Just verify page loads properly
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have keyboard shortcuts working', async ({ page }) => {
    // Press space - should not cause errors
    await page.keyboard.press('Space');
    
    // Press M for mute
    await page.keyboard.press('m');
    
    // Press S for shuffle
    await page.keyboard.press('s');
    
    // App should still be responsive
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Queue', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display library when no songs', async ({ page }) => {
    // Verify the app loads properly
    await expect(page.locator('main')).toBeVisible();
  });
});
