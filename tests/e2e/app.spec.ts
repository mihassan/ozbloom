import { test, expect } from '@playwright/test'

test.describe('OzBloom app', () => {
  test('loads and shows a flower card immediately', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('OzBloom')).toBeVisible()

    await expect(page.locator('.rounded-card h2')).toBeVisible({ timeout: 10000 })

    const heading = page.locator('.rounded-card h2').first()
    await expect(heading).not.toBeEmpty()
  })

  test('Next button advances to a different card', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.rounded-card h2')).toBeVisible({ timeout: 10000 })

    const first = await page.locator('.rounded-card h2').first().innerText()

    await page.getByRole('button', { name: 'Next flower' }).click()

    // Wait until the heading text changes (fixes waitForTimeout flakiness)
    await page.waitForFunction(
      (prev) => document.querySelector('.rounded-card h2')?.textContent !== prev,
      first,
      { timeout: 5000 },
    )

    const second = await page.locator('.rounded-card h2').first().innerText()
    expect(first).not.toBe('')
    expect(second).not.toBe('')
  })

  test('card shows all required fields', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.rounded-card h2')).toBeVisible({ timeout: 10000 })

    const card = page.locator('.rounded-card').first()
    await expect(card).toBeVisible()

    await expect(card.locator('p.italic')).toBeVisible()

    await expect(card.getByText('Region', { exact: true })).toBeVisible()
    await expect(card.getByText('Blooms', { exact: true })).toBeVisible()
    await expect(card.getByText('Colour', { exact: true })).toBeVisible()
    await expect(card.getByText('Habitat', { exact: true })).toBeVisible()

    const badge = card.locator('span.rounded-full')
    await expect(badge).toBeVisible()
  })

  test('flower image has alt text', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.rounded-card h2')).toBeVisible({ timeout: 10000 })

    const img = page.locator('.rounded-card img').first()
    await expect(img).toBeVisible()
    const alt = await img.getAttribute('alt')
    expect(alt).toBeTruthy()
    expect(alt!.length).toBeGreaterThan(5)
  })

  test('heart button toggles favorite state on card', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.rounded-card h2')).toBeVisible({ timeout: 10000 })

    const heartBtn = page.getByRole('button', { name: /save flower/i })
    await expect(heartBtn).toBeVisible()

    await heartBtn.click()
    await expect(page.getByRole('button', { name: /remove from saved/i })).toBeVisible()

    await page.getByRole('button', { name: /remove from saved/i }).click()
    await expect(page.getByRole('button', { name: /save flower/i })).toBeVisible()
  })

  test('saved view shows favorited flowers', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.rounded-card h2')).toBeVisible({ timeout: 10000 })

    const flowerName = await page.locator('.rounded-card h2').first().innerText()
    await page.getByRole('button', { name: /save flower/i }).click()

    await page.getByRole('button', { name: /saved flowers/i }).click()

    await expect(page.getByText('Saved')).toBeVisible()
    await expect(page.getByRole('heading', { name: flowerName })).toBeVisible()
  })

  test('saved view shows empty state when no flowers', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.rounded-card h2')).toBeVisible({ timeout: 10000 })

    const savedBtn = page.getByRole('button', { name: /saved flowers/i })
    await savedBtn.click()

    await expect(page.getByText(/no saved flowers/i)).toBeVisible()
  })

  test('can return to discover from saved view', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.rounded-card h2')).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: /saved flowers/i }).click()
    await page.getByRole('button', { name: /back to discover/i }).last().click()

    await expect(page.locator('.rounded-card h2')).toBeVisible()
  })

  test('API returns flowers from local D1', async ({ request }) => {
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

  test('API includes CORS headers on error responses', async ({ request }) => {
    const res = await request.get('http://localhost:8787/api/nope')
    const origin = res.headers()['access-control-allow-origin']
    expect(origin).toBeTruthy()
    expect(origin).toMatch(/^https?:\/\//)
  })

  test('API rejects invalid limit parameter with 400', async ({ request }) => {
    const res = await request.get('http://localhost:8787/api/flowers/random?limit=-1')
    expect(res.status()).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/invalid limit/i)
  })

  test('API rejects garbage limit parameter', async ({ request }) => {
    const res = await request.get('http://localhost:8787/api/flowers/random?limit=abc')
    expect(res.status()).toBe(400)
  })

  test('no console errors on load', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/')
    await expect(page.locator('.rounded-card h2')).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(500)

    expect(errors).toHaveLength(0)
  })
})
