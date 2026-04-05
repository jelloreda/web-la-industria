import { test, expect } from '@playwright/test'
import path from 'path'

const FILE_PATH = path.resolve(__dirname, '../index.html')
const FILE_URL  = `file://${FILE_PATH}`

test.describe('La Industria Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FILE_URL)
    await page.waitForLoadState('domcontentloaded')
  })

  test('loads without critical console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))
    await page.goto(FILE_URL)
    await page.waitForLoadState('networkidle')
    // Allow Google Maps iframe errors — expected when offline
    const realErrors = errors.filter(e =>
      !e.includes('maps.google') && !e.includes('maps.googleapis')
    )
    expect(realErrors).toHaveLength(0)
  })

  test('hero section is visible', async ({ page }) => {
    const hero = page.locator('#hero')
    await expect(hero).toBeVisible()
    await expect(hero.locator('svg').first()).toBeVisible()
  })

  test('booking CTA is present and points to Yeasy', async ({ page }) => {
    const cta = page.locator('[data-testid="cta-reservar"]')
    await expect(cta).toBeVisible()
    const href = await cta.getAttribute('href')
    expect(href).toBe('https://cut.yeasyapp.com/J0W7kF')
  })

  test('services section has carbon background', async ({ page }) => {
    const section = page.locator('#servicios')
    await expect(section).toBeVisible()
    const bg = await section.evaluate(el =>
      getComputedStyle(el).backgroundColor
    )
    // #414040 = rgb(65, 64, 64)
    expect(bg).toContain('65, 64, 64')
  })

  test('desktop screenshot at 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(FILE_URL)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.screenshot({
      path: 'screenshots/la-industria-desktop.png',
      fullPage: true,
    })
  })

  test('mobile screenshot at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(FILE_URL)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.screenshot({
      path: 'screenshots/la-industria-mobile.png',
      fullPage: true,
    })
  })
})
