import { expect, test } from '@playwright/test'
import { mockReservas } from './mocks/reservas'

test.beforeEach(async ({ page }) => {
  // Jueves 1 de octubre de 2026, 09:00 en Madrid
  await page.clock.setFixedTime(new Date('2026-10-01T07:00:00Z'))
})

test.describe('abrir el flujo', () => {
  test('el Reservar del menú abre el panel en "Elige tu sede" y lleva a servicios', async ({ page }) => {
    await mockReservas(page)
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.getByRole('navigation').getByRole('button', { name: 'Reservar' }).click()
    const panel = page.getByTestId('booking-panel')
    await expect(panel.getByRole('heading', { name: 'Elige tu sede' })).toBeVisible()
    await panel.getByTestId('picker-arguelles').click()
    await expect(panel.getByRole('heading', { name: 'Elige servicio' })).toBeVisible()
    await expect(panel).toContainText('Reservar · Argüelles')
    await expect(panel.getByRole('button', { name: /Corte a tijera y barba/ })).toContainText('Desde 27 €')
  })

  test('el botón de una sede abre directamente sus servicios', async ({ page }) => {
    await mockReservas(page)
    await page.goto('/')
    await page.getByTestId('cta-reservar-guzman-el-bueno').click()
    const panel = page.getByTestId('booking-panel')
    await expect(panel.getByRole('heading', { name: 'Elige servicio' })).toBeVisible()
    await expect(panel).toContainText('Reservar · Guzmán el Bueno')
  })

  test('cerrar y volver a abrir empieza de cero', async ({ page }) => {
    await mockReservas(page)
    await page.goto('/')
    await page.getByTestId('cta-reservar-arguelles').click()
    await page.getByRole('button', { name: 'Cerrar' }).click()
    await expect(page.getByTestId('booking-panel')).toBeHidden()
    await page.getByTestId('cta-reservar-guzman-el-bueno').click()
    await expect(page.getByTestId('booking-panel')).toContainText('Reservar · Guzmán el Bueno')
  })
})
