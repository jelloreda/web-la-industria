import { expect, test } from '@playwright/test'
import { CITA, mockReservas } from './mocks/reservas'

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

test.describe('datos y confirmación', () => {
  async function hastaDatos(page: import('@playwright/test').Page, reservar?: (n: number) => { status: number; json: unknown }) {
    const cuerpos = await mockReservas(page, { reservar })
    await page.goto('/')
    await page.getByTestId('cta-reservar-guzman-el-bueno').click()
    const panel = page.getByTestId('booking-panel')
    await panel.getByRole('button', { name: /Corte y degradado a máquina/ }).click()
    await panel.getByRole('button', { name: 'Lunes 5 de octubre' }).click()
    await panel.getByRole('button', { name: '17:30' }).click()
    await panel.getByRole('button', { name: 'Continuar' }).click()
    await expect(panel.getByRole('heading', { name: 'Tus datos' })).toBeVisible()
    return { panel, cuerpos }
  }

  test('valida al enviar y no llama a la API con datos malos', async ({ page }) => {
    const { panel, cuerpos } = await hastaDatos(page)
    await panel.getByRole('button', { name: 'Reservar cita' }).click()
    await expect(panel).toContainText('Escribe tu nombre y al menos un apellido.')
    await expect(panel).toContainText('Revisa el teléfono: 9 cifras que empiecen por 6, 7, 8 o 9.')
    await panel.getByLabel('Prefijo del país').selectOption('+44')
    await expect(panel).toContainText('Revisa el teléfono: solo cifras, sin el prefijo.')
    expect(cuerpos).toHaveLength(0)
  })

  test('reserva y confirma, mandando lo que el cliente eligió', async ({ page }) => {
    const { panel, cuerpos } = await hastaDatos(page)
    await expect(panel).toContainText('Lunes 5 de octubre')
    await panel.getByLabel('Nombre y apellidos').fill('álvaro martín')
    await panel.getByLabel('Teléfono').fill('612 345 678')
    await panel.getByRole('button', { name: 'Reservar cita' }).click()
    await expect(panel.getByRole('heading', { name: 'Cita reservada' })).toBeVisible()
    await expect(panel).toContainText('Te esperamos en Guzmán el Bueno. Nos vemos en el sillón.')
    await expect(panel).toContainText(CITA.barbero)
    expect(cuerpos[0]).toMatchObject({
      sede: 'guzman-el-bueno', servicio: '5029b0af-bd81-424d-bb85-8043fae859ea', fecha: '2026-10-05', hora: '17:30',
      barbero: 'any', nombre: 'álvaro martín', prefijo: '+34', telefono: '612 345 678', website: '',
    })
    await expect(panel.getByRole('link', { name: 'Cómo llegar' })).toHaveAttribute('href', 'https://maps.app.goo.gl/DWMwgH6QEkesm1Rp8')
  })

  test('hueco ocupado: vuelve a las horas con aviso y conserva los datos', async ({ page }) => {
    const { panel, cuerpos } = await hastaDatos(page, n => n === 1
      ? { status: 409, json: { error: 'HUECO_OCUPADO' } }
      : { status: 201, json: { cita: CITA } })
    await panel.getByLabel('Nombre y apellidos').fill('Álvaro Martín')
    await panel.getByLabel('Teléfono').fill('612345678')
    await panel.getByRole('button', { name: 'Reservar cita' }).click()
    await expect(panel.getByRole('heading', { name: 'Día y hora' })).toBeVisible()
    await expect(panel.getByRole('alert')).toContainText('Esa hora ya no está disponible')
    await panel.getByRole('button', { name: '10:00' }).click()
    await panel.getByRole('button', { name: 'Continuar' }).click()
    await expect(panel.getByLabel('Nombre y apellidos')).toHaveValue('Álvaro Martín')
    await panel.getByRole('button', { name: 'Reservar cita' }).click()
    await expect(panel.getByRole('heading', { name: 'Cita reservada' })).toBeVisible()
    expect(cuerpos).toHaveLength(2)
  })

  test('agenda caída: mensaje claro y se queda en el paso', async ({ page }) => {
    const { panel } = await hastaDatos(page, () => ({ status: 503, json: { error: 'AGENDA_NO_DISPONIBLE' } }))
    await panel.getByLabel('Nombre y apellidos').fill('Álvaro Martín')
    await panel.getByLabel('Teléfono').fill('612345678')
    await panel.getByRole('button', { name: 'Reservar cita' }).click()
    await expect(panel.getByRole('alert')).toContainText('No hemos podido completar la reserva.')
    await expect(panel.getByRole('heading', { name: 'Tus datos' })).toBeVisible()
  })

  test('el servidor rechaza el teléfono: se marca el campo', async ({ page }) => {
    const { panel } = await hastaDatos(page, () => ({ status: 422, json: { error: 'DATOS_INVALIDOS', campos: ['telefono'] } }))
    await panel.getByLabel('Nombre y apellidos').fill('Álvaro Martín')
    await panel.getByLabel('Teléfono').fill('612345678')
    await panel.getByRole('button', { name: 'Reservar cita' }).click()
    await expect(panel).toContainText('Revisa el teléfono: 9 cifras que empiecen por 6, 7, 8 o 9.')
  })
})
