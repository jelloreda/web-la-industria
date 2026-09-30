import type { Page } from '@playwright/test'

export const SERVICIOS = {
  servicios: [
    { id: '5029b0af-bd81-424d-bb85-8043fae859ea', nombre: 'Corte y degradado a máquina', precio: 16, desde: false, duracion: 30 },
    { id: '88a96e08-1721-413d-855d-e8349ffb4d6a', nombre: 'Corte a tijera y barba', precio: 27, desde: true, duracion: 60 },
  ],
}

const CARLOS = { id: 'b-carlos', nombre: 'Carlos', foto: null }
const WUILL = { id: 'b-wuilliams', nombre: 'Wuilliams', foto: null }

/** Wuilliams no trabaja los lunes; los domingos está cerrado. */
export function huecosPara(fecha: string) {
  const dia = new Date(`${fecha}T12:00:00Z`).getUTCDay()
  if (dia === 0) return { fecha, barberos: [], huecos: [] }
  if (dia === 1) {
    return { fecha, barberos: [CARLOS], huecos: [
      { hora: '10:00', franja: 'manana', barberos: ['b-carlos'] },
      { hora: '17:30', franja: 'tarde', barberos: ['b-carlos'] },
    ] }
  }
  return { fecha, barberos: [CARLOS, WUILL], huecos: [
    { hora: '10:00', franja: 'manana', barberos: ['b-carlos'] },
    { hora: '17:30', franja: 'tarde', barberos: ['b-carlos', 'b-wuilliams'] },
    { hora: '18:00', franja: 'tarde', barberos: ['b-wuilliams'] },
  ] }
}

export const CITA = {
  sede: 'guzman-el-bueno', servicio: 'Corte y degradado a máquina', precio: 16, desde: false,
  fecha: '2026-10-05', hora: '17:30', duracion: 30, barbero: 'Carlos',
}

type Respuesta = { status: number; json: unknown }

export async function mockReservas(page: Page, opciones: { reservar?: (n: number) => Respuesta } = {}) {
  const cuerpos: Array<Record<string, unknown>> = []
  await page.route('**/api/reservas/servicios**', r => r.fulfill({ json: SERVICIOS }))
  await page.route('**/api/reservas/huecos**', r => {
    const fecha = new URL(r.request().url()).searchParams.get('fecha')!
    return r.fulfill({ json: huecosPara(fecha) })
  })
  await page.route('**/api/reservas', r => {
    cuerpos.push(r.request().postDataJSON())
    const res = opciones.reservar?.(cuerpos.length) ?? { status: 201, json: { cita: CITA } }
    return r.fulfill({ status: res.status, json: res.json })
  })
  return cuerpos
}
