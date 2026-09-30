import { describe, expect, it, vi } from 'vitest'
import { ErrorReserva } from '../api/_lib/errores'
import { manejarError } from '../api/_lib/http'

describe('manejarError', () => {
  it('traduce ErrorReserva a su status y cuerpo', async () => {
    const r = manejarError(new ErrorReserva('DATOS_INVALIDOS', 422, ['telefono']))
    expect(r.status).toBe(422)
    expect(await r.json()).toEqual({ error: 'DATOS_INVALIDOS', campos: ['telefono'] })
  })

  it('cualquier otro error es 503 sin detalles', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const r = manejarError(new Error('boom'))
    expect(r.status).toBe(503)
    expect(await r.json()).toEqual({ error: 'AGENDA_NO_DISPONIBLE' })
  })
})
