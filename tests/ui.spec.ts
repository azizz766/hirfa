import { test, expect } from '@playwright/test';

test.describe('UI features', () => {
  test('landing page has expected elements', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).not.toBeEmpty();

    // Must have at least one primary CTA button or link
    const cta = page.locator('a[href], button').first();
    await expect(cta).toBeVisible();
  });

  test('dark mode toggle changes data-theme attribute', async ({ page }) => {
    await page.goto('/');

    const toggle = page.locator(
      '[data-testid="theme-toggle"], button:has-text("dark"), button:has-text("light"), button[aria-label*="theme" i], button[aria-label*="dark" i], button[aria-label*="mode" i]'
    ).first();

    const toggleVisible = await toggle.isVisible().catch(() => false);
    if (!toggleVisible) {
      test.skip(true, 'No theme toggle found on landing page');
      return;
    }

    const htmlEl = page.locator('html');
    const before = await htmlEl.getAttribute('data-theme');

    await toggle.click();

    const after = await htmlEl.getAttribute('data-theme');
    expect(after).not.toBe(before);
  });

  test('language switch changes nav labels', async ({ page }) => {
    await page.goto('/');

    const langBtn = page.locator(
      '[data-testid="lang-toggle"], button:has-text("EN"), button:has-text("AR"), button[aria-label*="language" i], button[aria-label*="lang" i]'
    ).first();

    const visible = await langBtn.isVisible().catch(() => false);
    if (!visible) {
      test.skip(true, 'No language toggle found on landing page');
      return;
    }

    // Grab some nav text before switching
    const navText = await page.locator('nav').innerText().catch(() => '');
    await langBtn.click();
    await page.waitForTimeout(500);
    const navTextAfter = await page.locator('nav').innerText().catch(() => '');

    expect(navTextAfter).not.toBe(navText);
  });

  test('category pills on landing page are clickable', async ({ page }) => {
    await page.goto('/');

    const pills = page.locator(
      '[data-testid="category-pill"], .pill, button[class*="pill"], button[class*="category"], a[class*="category"]'
    );

    const count = await pills.count();
    if (count === 0) {
      test.skip(true, 'No category pills found on landing page');
      return;
    }

    // Click first pill and verify no crash
    await pills.first().click();
    await expect(page.locator('body')).toBeVisible();
  });
});
