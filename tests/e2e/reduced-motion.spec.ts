import { test, expect } from '@playwright/test'

test.describe('Reduced motion', () => {
  test('Next button works with prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.locator('.rounded-card h2')).toBeVisible({ timeout: 10000 })

    const first = await page.locator('.rounded-card h2').first().innerText()

    await page.getByRole('button', { name: /next flower/i }).click()

    await page.waitForFunction(
      (prev) => document.querySelector('.rounded-card h2')?.textContent !== prev,
      first,
      { timeout: 5000 },
    )

    const second = await page.locator('.rounded-card h2').first().innerText()
    expect(second).not.toBe('')
  })
})
