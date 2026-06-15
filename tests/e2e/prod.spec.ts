import { test, expect } from '@playwright/test'

const PROD_URL = 'https://ozbloom.mihassan.workers.dev'

test.describe('Production smoke', () => {
  test('app loads with no console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto(PROD_URL)
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 })
    await page.waitForTimeout(1000)

    expect(errors).toHaveLength(0)
  })

  test('service worker is registered', async ({ page }) => {
    await page.goto(PROD_URL)
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 })

    const hasSw = await page.evaluate(() => 'serviceWorker' in navigator)
    expect(hasSw).toBe(true)

    const registration = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration('/')
      return reg ? reg.active?.state || null : null
    })
    expect(registration).toBe('activated')
  })

  test('fetches and displays a flower', async ({ page }) => {
    await page.goto(PROD_URL)
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 })

    const heading = page.locator('h1')
    await expect(heading).not.toBeEmpty()

    const text = await heading.innerText()
    expect(text.length).toBeGreaterThan(0)
  })
})
