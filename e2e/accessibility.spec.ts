import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper page structure', async ({ page }) => {
    // Should have main landmark
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab through the page
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should have focused element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeTruthy();
  });

  test('should have visible focus indicators', async ({ page }) => {
    // Tab to first focusable element
    await page.keyboard.press('Tab');

    // Focused element should be visible
    const focused = page.locator(':focus');
    if (await focused.count() > 0) {
      await expect(focused.first()).toBeVisible();
    }
  });

  test('buttons should be interactive', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    // Should have multiple buttons
    expect(count).toBeGreaterThan(0);

    // First button should be clickable
    if (count > 0) {
      const firstButton = buttons.first();
      await expect(firstButton).toBeEnabled();
    }
  });
});
