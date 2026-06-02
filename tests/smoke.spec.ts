import { test, expect } from '@playwright/test';

const pages = [
  { path: '/', name: 'landing' },
  { path: '/auth/client', name: 'client auth' },
  { path: '/auth/artist', name: 'artist auth' },
  { path: '/client/home', name: 'client home (may redirect)' },
  { path: '/artist/studio', name: 'artist studio (may redirect)' },
  { path: '/terms', name: 'terms' },
];

for (const { path, name } of pages) {
  test(`${name} page loads without error`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const response = await page.goto(path);

    // Allow redirects to auth pages — just check the final page loads
    expect(response?.status()).not.toBe(500);
    expect(errors.filter((e) => !e.includes('ResizeObserver'))).toHaveLength(0);

    // Page must render something
    await expect(page.locator('body')).not.toBeEmpty();
  });
}
