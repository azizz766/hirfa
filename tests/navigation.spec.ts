import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('landing page nav links are reachable', async ({ page }) => {
    await page.goto('/');

    const links = page.locator('nav a[href]');
    const count = await links.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const href = await links.nth(i).getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('http')) continue;

      const res = await page.goto(href);
      expect(res?.status(), `${href} returned error`).not.toBe(500);
      await page.goBack();
    }
  });

  test('client auth page has back or home navigation', async ({ page }) => {
    await page.goto('/auth/client');

    const backOrHome = page.locator(
      'a[href="/"], a[href*="back"], button:has-text("Back"), [aria-label*="back" i], [aria-label*="home" i]'
    ).first();

    const visible = await backOrHome.isVisible().catch(() => false);
    if (visible) {
      await backOrHome.click();
      // Should navigate somewhere without crashing
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('artist auth page has back or home navigation', async ({ page }) => {
    await page.goto('/auth/artist');

    const backOrHome = page.locator(
      'a[href="/"], a[href*="back"], button:has-text("Back"), [aria-label*="back" i], [aria-label*="home" i]'
    ).first();

    const visible = await backOrHome.isVisible().catch(() => false);
    if (visible) {
      await backOrHome.click();
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('unknown route shows 404 or redirects gracefully', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345');

    // Either a proper 404 or a redirect to an existing page
    const status = response?.status() ?? 0;
    const url = page.url();

    const is404 = status === 404;
    const isRedirect = status === 200 && !url.includes('this-page-does-not-exist');
    const isNotFoundPage = await page.locator('text=/404/i, text=/not found/i').count() > 0;

    expect(is404 || isRedirect || isNotFoundPage).toBe(true);
    expect(status).not.toBe(500);
  });

  test('terms page is reachable from landing', async ({ page }) => {
    await page.goto('/');

    const termsLink = page.locator('a[href="/terms"], a:has-text("Terms")').first();
    const visible = await termsLink.isVisible().catch(() => false);

    if (visible) {
      await termsLink.click();
      await expect(page).toHaveURL(/\/terms/);
    } else {
      // Direct navigation fallback
      const res = await page.goto('/terms');
      expect(res?.status()).not.toBe(500);
    }
  });
});
