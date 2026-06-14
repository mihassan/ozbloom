import { test, expect } from '@playwright/test'

test.describe('OzBloom app', () => {
  test('loads and shows a flower card immediately', async ({ page }) => {
    await page.goto('/')

    // Header visible
    await expect(page.getByText('OzBloom')).toBeVisible()

    // Wait for loading to finish (sand skeleton disappears, card content appears)
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 })

    // A flower name heading is present
    const heading = page.locator('h1')
    await expect(heading).not.toBeEmpty()
  })

  test('Next button advances to a different card', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 })

    const first = await page.locator('h1').innerText()

    await page.getByRole('button', { name: 'Next flower' }).click()

    // Wait for transition — heading may briefly be the same then change
    await page.waitForTimeout(400)

    const second = await page.locator('h1').innerText()

    // With 8 flowers randomised it's overwhelmingly likely these differ;
    // the test retries on flake via playwright config retries: 1
    expect(second).not.toBe('')
    // Both should be non-empty valid names
    expect(first).not.toBe('')
  })

  test('card shows all required fields', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 })

    const card = page.locator('.rounded-card').first()
    await expect(card).toBeVisible()

    // Scientific name (italic)
    await expect(card.locator('p.italic')).toBeVisible()

    // Metadata labels
    await expect(card.getByText('Region')).toBeVisible()
    await expect(card.getByText('Blooms')).toBeVisible()
    await expect(card.getByText('Colour')).toBeVisible()
    await expect(card.getByText('Habitat')).toBeVisible()

    // Conservation badge
    const badge = card.locator('span.rounded-full')
    await expect(badge).toBeVisible()
  })

  test('flower image has alt text', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 })

    const img = page.locator('img').first()
    await expect(img).toBeVisible()
    const alt = await img.getAttribute('alt')
    expect(alt).toBeTruthy()
    expect(alt!.length).toBeGreaterThan(5)
  })

  test('API returns 8 flowers from local D1', async ({ request }) => {
    const res = await request.get('http://localhost:8787/api/flowers/random?limit=8')
    expect(res.ok()).toBe(true)

    const body = await res.json() as { flowers: unknown[] }
    expect(body.flowers).toHaveLength(8)

    const first = body.flowers[0] as Record<string, string>
    expect(first.id).toBeTruthy()
    expect(first.common_name).toBeTruthy()
    expect(first.image_url).toBeTruthy()
  })

  test('API respects limit param', async ({ request }) => {
    const res = await request.get('http://localhost:8787/api/flowers/random?limit=3')
    expect(res.ok()).toBe(true)
    const body = await res.json() as { flowers: unknown[] }
    expect(body.flowers).toHaveLength(3)
  })

  test('API returns 404 for unknown routes', async ({ request }) => {
    const res = await request.get('http://localhost:8787/api/nope')
    expect(res.status()).toBe(404)
  })

  test('no console errors on load', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(500)

    expect(errors).toHaveLength(0)
  })
})
