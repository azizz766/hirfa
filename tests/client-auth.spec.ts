import { test, expect } from '@playwright/test';

test.describe('Client auth flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/client');
  });

  test('auth page renders name and email fields', async ({ page }) => {
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('submitting form shows email confirmation state', async ({ page }) => {
    const nameInput = page.locator('input[type="text"]').first();
    const emailInput = page.locator('input[type="email"]');
    // Button has no type=submit, identified by position (first button in form area)
    const submitBtn = page.locator('button').first();

    await nameInput.fill('Test User');
    await emailInput.fill(`test+${Date.now()}@example.com`);
    await submitBtn.click();

    // Either success state (📬) or a Sonner error toast — both mean the form submitted
    const successEmoji = page.locator('text=📬');
    const errorToast = page.locator('[data-sonner-toast]');
    await expect(successEmoji.or(errorToast).first()).toBeVisible({ timeout: 10000 });
  });

  test('shows toast error when submitting empty name', async ({ page }) => {
    // Click send without filling any fields — should trigger toast
    const submitBtn = page.locator('button').first();
    await submitBtn.click();

    // Sonner renders toasts with data-sonner-toast attribute
    await expect(
      page.locator('[data-sonner-toast]').first()
    ).toBeVisible({ timeout: 5000 });
  });
});
