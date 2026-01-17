import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('should display settings page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('should toggle theme', async ({ page }) => {
    // Find theme toggle
    const themeSection = page.locator('text=Theme').first();
    await expect(themeSection).toBeVisible();

    // Get initial state
    const html = page.locator('html');
    const initialHasLight = await html.evaluate((el) => el.classList.contains('light'));

    // Click theme toggle button
    const themeToggle = page.locator('button').filter({ hasText: /light|dark/i }).first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      
      // Verify theme changed
      const newHasLight = await html.evaluate((el) => el.classList.contains('light'));
      expect(newHasLight).not.toBe(initialHasLight);
    }
  });

  test('should display accent color options', async ({ page }) => {
    const accentSection = page.locator('text=Accent Color').first();
    await expect(accentSection).toBeVisible();
  });

  test('should display equalizer section', async ({ page }) => {
    const eqSection = page.locator('text=Equalizer').first();
    await expect(eqSection).toBeVisible();
  });

  test('should display playback section', async ({ page }) => {
    const playbackSection = page.locator('text=Crossfade').first();
    await expect(playbackSection).toBeVisible();
  });
});

test.describe('About Page', () => {
  test('should display about page', async ({ page }) => {
    await page.goto('/about');
    const aboutContent = page.locator('text=Vinyl').first();
    await expect(aboutContent).toBeVisible();
  });
});
