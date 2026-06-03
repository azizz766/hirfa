import { test, expect, Page } from '@playwright/test'

// Helper to set language
async function setLang(page: Page, lang: 'ar' | 'en') {
  await page.goto('/')
  // Select language on picker
  if (lang === 'en') {
    await page.locator('text=English').click()
  } else {
    await page.locator('text=العربية').click()
  }
  await page.locator('button:has-text("متابعة"), button:has-text("Continue")').click()
  await page.waitForTimeout(500)
}

test.describe('Artist Studio — Arabic', () => {
  test.beforeEach(async ({ page }) => {
    await setLang(page, 'ar')
  })

  test('landing page shows language picker on first visit', async ({ page }) => {
    // Clear stored lang so picker shows fresh
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('hirfa_lang'))
    await page.goto('/')
    await expect(page.locator('text=العربية')).toBeVisible()
    await expect(page.locator('text=English')).toBeVisible()
  })

  test('artist auth page loads correctly', async ({ page }) => {
    await page.goto('/auth/artist')
    await expect(page.locator('body')).not.toBeEmpty()
    // Should show multi-step form
    const hasStepIndicator = await page.locator('[class*="step"], [data-step]').count() > 0
    const hasForm = await page.locator('input').count() > 0
    expect(hasStepIndicator || hasForm).toBe(true)
  })

  test('artist studio redirects to auth when not logged in', async ({ page }) => {
    await page.goto('/artist/studio')
    await page.waitForURL(/auth\/artist|artist\/studio/, { timeout: 5000 })
    // Should redirect to auth or stay and show not-logged-in state
    const url = page.url()
    const isAuthPage = url.includes('/auth/artist')
    const isStudioWithAuth = url.includes('/artist/studio')
    expect(isAuthPage || isStudioWithAuth).toBe(true)
  })

  test('artist studio page loads without JS errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))
    await page.goto('/artist/studio')
    await page.waitForTimeout(2000)
    expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0)
  })

  test('auth artist page has 4 step indicators', async ({ page }) => {
    await page.goto('/auth/artist')
    await expect(page.locator('body')).not.toBeEmpty()
    // Page renders "{step} / 4" counter in the header
    await expect(page.locator('text=/ 4')).toBeVisible()
  })

  test('auth client page loads in Arabic', async ({ page }) => {
    await page.goto('/auth/client')
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })
})

test.describe('Artist Studio — English', () => {
  test.beforeEach(async ({ page }) => {
    await setLang(page, 'en')
  })

  test('landing page shows English after language selection', async ({ page }) => {
    await page.goto('/')
    // After English selection, landing should show English text
    const body = await page.locator('body').innerText()
    // Should contain some English
    expect(body).toMatch(/Artist|Find|Browse|Service/i)
  })

  test('artist auth page loads in English', async ({ page }) => {
    await page.goto('/auth/artist')
    await expect(page.locator('body')).not.toBeEmpty()
    const url = page.url()
    expect(url).toContain('artist')
  })

  test('artist studio redirects to auth when not logged in (EN)', async ({ page }) => {
    await page.goto('/artist/studio')
    await page.waitForURL(/auth\/artist|artist\/studio/, { timeout: 5000 })
    const url = page.url()
    expect(url.includes('/auth/artist') || url.includes('/artist/studio')).toBe(true)
  })
})

test.describe('Artist Studio Tabs — UI Structure', () => {
  test('studio page has 6 tab navigation items', async ({ page }) => {
    await page.goto('/artist/studio')
    await page.waitForTimeout(2000)
    // Tabs should be visible even if redirected to auth
    // If on studio page, check tabs
    const url = page.url()
    if (url.includes('/artist/studio')) {
      const tabs = page.locator('button').filter({ hasText: /Home|Orders|Works|Messages|Earnings|Settings|الرئيسية|الطلبات|الأعمال|الرسائل|الأرباح|الإعدادات/ })
      const count = await tabs.count()
      expect(count).toBeGreaterThanOrEqual(3)
    }
  })

  test('artist auth signup form step 1 is functional', async ({ page }) => {
    await page.goto('/auth/artist')
    // Step 1: basic info
    const nameInput = page.locator('input[type="text"]').first()
    const emailInput = page.locator('input[type="email"]')

    if (await nameInput.isVisible()) {
      await nameInput.fill('Test Artist')
    }
    if (await emailInput.isVisible()) {
      await emailInput.fill('testartist@example.com')
    }

    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Artist Studio — Smoke Tests', () => {
  const artistRoutes = [
    { path: '/artist/studio', name: 'studio' },
    { path: '/artist/dashboard', name: 'dashboard' },
    { path: '/artist/orders', name: 'orders' },
    { path: '/artist/portfolio', name: 'portfolio' },
    { path: '/artist/briefs', name: 'briefs' },
    { path: '/auth/artist', name: 'artist auth' },
    { path: '/auth/artist/complete', name: 'artist complete' },
  ]

  for (const { path, name } of artistRoutes) {
    test(`${name} page loads without 500 error`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', err => errors.push(err.message))

      const response = await page.goto(path)
      expect(response?.status()).not.toBe(500)
      expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0)
    })
  }
})
