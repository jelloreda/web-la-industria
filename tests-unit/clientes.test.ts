import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buscarClientePorTelefono, crearCliente } from '../api/_lib/clientes'
import { sedePorId } from '../api/_lib/sedes'
import { fetchFalso } from './helpers/fetch-falso'
import { COMMERCE_G } from './helpers/datos'

const CLIENTES = [
  { uuid: 'c-borrado', name: 'Viejo', phone: '+34612345678', isDeleted: true, isBlocked: false },
  { uuid: 'c-1', name: 'Luis', lastname: 'Pérez', phone: '+3461-234-5678', isDeleted: false, isBlocked: false },
  { uuid: 'c-sin', name: 'Sin', phone: null },
]

describe('clientes', () => {
  beforeEach(() => {
    vi.stubEnv('YEASY_API_TOKEN', 't')
  })

  it('encuentra por cifras e ignora borrados, con token', async () => {
    const llamadas = fetchFalso({ 'GET /customer/commerceAndCreatedBynewV2/.+': () => CLIENTES })
    expect((await buscarClientePorTelefono(COMMERCE_G, '+34612345678'))?.uuid).toBe('c-1')
    expect(await buscarClientePorTelefono(COMMERCE_G, '+34699000000')).toBeNull()
    expect(llamadas[0].ruta).toBe(`/customer/commerceAndCreatedBynewV2/${COMMERCE_G}`)
    expect(llamadas[0].headers.Authorization).toBe('Bearer t')
  })

  it('crea el cliente sin email, con nombre separado, el comercio como creador y contraseña aleatoria', async () => {
    const llamadas = fetchFalso({ 'POST /customer/commerce': (_u, cuerpo) => ({ uuid: 'nuevo', ...(cuerpo as object) }) })
    const c = await crearCliente(sedePorId('guzman-el-bueno')!, 'Álvaro Martín López', '+34611111111')
    expect(c.uuid).toBe('nuevo')
    expect(llamadas[0].cuerpo).toEqual({
      name: 'Álvaro', lastname: 'Martín López', email: '', phone: '+34611111111',
      password: expect.stringMatching(/^[A-Za-z0-9_-]{20,}$/), createdBy: COMMERCE_G, createdByCommerce: true,
    })
  })

  it('genera una contraseña distinta en cada llamada', async () => {
    const llamadas = fetchFalso({ 'POST /customer/commerce': (_u, cuerpo) => ({ uuid: 'nuevo', ...(cuerpo as object) }) })
    await crearCliente(sedePorId('guzman-el-bueno')!, 'Álvaro Martín López', '+34611111111')
    await crearCliente(sedePorId('guzman-el-bueno')!, 'Álvaro Martín López', '+34611111111')
    const [a, b] = llamadas.map(l => (l.cuerpo as { password: string }).password)
    expect(a).not.toBe(b)
  })
})
