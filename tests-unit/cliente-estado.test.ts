import { describe, expect, it } from 'vitest'
import { estadoInicial, reducir, type EstadoReserva } from '@/components/booking/estado'

const servicio = { id: 's1', nombre: 'Corte', precio: 16, desde: false, duracion: 30 }
const abierto = (sedeId?: 'arguelles') => reducir(estadoInicial, { tipo: 'abrir', sedeId, hoy: '2026-10-01' })

describe('reducir', () => {
  it('abrir sin sede empieza en el paso 0; con sede, en el 1', () => {
    expect(abierto()).toMatchObject({ abierto: true, paso: 0, sedeId: null, fecha: '2026-10-01' })
    expect(abierto('arguelles')).toMatchObject({ paso: 1, sedeId: 'arguelles' })
  })

  it('cambiar día o barber borra el hueco elegido', () => {
    let e: EstadoReserva = reducir(abierto('arguelles'), { tipo: 'elegirServicio', servicio })
    e = reducir(e, { tipo: 'elegirHueco', hueco: { hora: '10:00', barbero: 'any', barberoNombre: 'Luz' } })
    expect(reducir(e, { tipo: 'elegirFecha', fecha: '2026-10-02' }).hueco).toBeNull()
    expect(reducir(e, { tipo: 'elegirBarbero', barbero: 'b1', nombre: 'Luz' }).hueco).toBeNull()
  })

  it('continuar solo con hueco', () => {
    const e = reducir(abierto('arguelles'), { tipo: 'elegirServicio', servicio })
    expect(reducir(e, { tipo: 'continuar' }).paso).toBe(2)
    const conHueco = reducir(e, { tipo: 'elegirHueco', hueco: { hora: '10:00', barbero: 'any', barberoNombre: 'Luz' } })
    expect(reducir(conHueco, { tipo: 'continuar' }).paso).toBe(3)
  })

  it('hueco ocupado vuelve al paso 2 con aviso y conserva nombre y teléfono', () => {
    let e = reducir(abierto('arguelles'), { tipo: 'elegirServicio', servicio })
    e = reducir(e, { tipo: 'elegirHueco', hueco: { hora: '10:00', barbero: 'any', barberoNombre: 'Luz' } })
    e = reducir(e, { tipo: 'continuar' })
    e = reducir(e, { tipo: 'dato', campo: 'nombre', valor: 'Luis Pérez' })
    e = reducir(e, { tipo: 'dato', campo: 'telefono', valor: '612345678' })
    e = reducir(e, { tipo: 'huecoOcupado' })
    expect(e).toMatchObject({ paso: 2, hueco: null, avisoHuecoOcupado: true, nombre: 'Luis Pérez', telefono: '612345678' })
  })

  it('cerrar lo reinicia todo', () => {
    expect(reducir(abierto('arguelles'), { tipo: 'cerrar' })).toEqual(estadoInicial)
  })
})
