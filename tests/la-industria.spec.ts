import { test, expect } from '@playwright/test'

test.describe('La Industria Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
  })

  test('loads without critical console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))
    await page.goto('/')
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

  test('contact tabs switch location details', async ({ page }) => {
    const contact = page.locator('#contacto')
    await expect(contact).toContainText('Avenida Reina Victoria 41')
    await contact.getByRole('tab', { name: /Argüelles/ }).click()
    await expect(contact).toContainText('Calle de Altamirano 3')
  })

  test('services section is gone and nothing links to it', async ({ page }) => {
    await expect(page.locator('#servicios')).toHaveCount(0)
    await expect(page.locator('a[href="#servicios"]')).toHaveCount(0)
  })

  test('hero has carbon background so it contrasts with the team section', async ({ page }) => {
    const hero = await page.locator('#hero').evaluate(el => getComputedStyle(el).backgroundColor)
    const equipo = await page.locator('#equipo').evaluate(el => getComputedStyle(el).backgroundColor)
    expect(hero).toContain('65, 64, 64') // #414040
    expect(equipo).toContain('51, 50, 49') // #333231
  })

  test('desktop screenshot at 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.screenshot({
      path: 'screenshots/la-industria-desktop.png',
      fullPage: true,
    })
  })

  test('mobile screenshot at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.screenshot({
      path: 'screenshots/la-industria-mobile.png',
      fullPage: true,
    })
  })
})
