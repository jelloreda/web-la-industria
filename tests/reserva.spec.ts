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

test.describe('día, barber y hora', () => {
  async function hastaHuecos(page: import('@playwright/test').Page) {
    await mockReservas(page)
    await page.goto('/')
    await page.getByTestId('cta-reservar-guzman-el-bueno').click()
    await page.getByRole('button', { name: /Corte y degradado a máquina/ }).click()
    return page.getByTestId('booking-panel')
  }

  test('enseña 7 días, el domingo deshabilitado, y los barbers del día', async ({ page }) => {
    const panel = await hastaHuecos(page)
    await expect(panel.getByRole('heading', { name: 'Día y hora' })).toBeVisible()
    await expect(panel.getByRole('button', { name: /^(Jueves|Viernes|Sábado|Domingo|Lunes|Martes|Miércoles) \d+ de/ })).toHaveCount(7)
    await expect(panel.getByRole('button', { name: 'Domingo 4 de octubre, cerrado' })).toBeDisabled()
    await expect(panel.getByRole('button', { name: 'Cualquiera' })).toHaveAttribute('aria-pressed', 'true')
    await expect(panel.getByRole('button', { name: 'Wuilliams' })).toBeVisible()
    await expect(panel.getByRole('button', { name: 'Continuar' })).toBeDisabled()
  })

  test('filtrar por barber enseña solo sus horas', async ({ page }) => {
    const panel = await hastaHuecos(page)
    await panel.getByRole('button', { name: 'Wuilliams' }).click()
    await expect(panel.getByRole('button', { name: '10:00' })).toHaveCount(0)
    await expect(panel.getByRole('button', { name: '18:00' })).toBeVisible()
  })

  test('si el barber no trabaja el día elegido pasa a "Cualquiera" con aviso', async ({ page }) => {
    const panel = await hastaHuecos(page)
    await panel.getByRole('button', { name: 'Wuilliams' }).click()
    await panel.getByRole('button', { name: 'Lunes 5 de octubre' }).click()
    await expect(panel).toContainText('Wuilliams no trabaja el lunes. Te enseñamos los huecos de todo el equipo.')
    await expect(panel.getByRole('button', { name: 'Cualquiera' })).toHaveAttribute('aria-pressed', 'true')
    await panel.getByRole('button', { name: '17:30' }).click()
    await expect(panel).toContainText('lun 5 oct · 17:30 · con Carlos')
    await expect(panel.getByRole('button', { name: 'Continuar' })).toBeEnabled()
  })

  test('el enlace de WhatsApp para más adelante está a mano', async ({ page }) => {
    const panel = await hastaHuecos(page)
    await expect(panel.getByRole('link', { name: /Escríbenos por WhatsApp/ })).toHaveAttribute('href', 'https://wa.me/34627015904')
  })
})
