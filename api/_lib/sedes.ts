import { ErrorReserva } from './errores'
import type { SedeId } from './tipos'

export interface SedeYeasy { id: SedeId; commerceUuid: string; userUuidEnv: string }

const SEDES: Record<SedeId, SedeYeasy> = {
  'guzman-el-bueno': { id: 'guzman-el-bueno', commerceUuid: '6f554a4a-15ea-4752-9ea5-985791a6c972', userUuidEnv: 'YEASY_USER_UUID_GUZMAN' },
  arguelles: { id: 'arguelles', commerceUuid: 'c14b04a8-a151-41e4-b042-0f8c5c678b42', userUuidEnv: 'YEASY_USER_UUID_ARGUELLES' },
}

export function sedePorId(id: string | null): SedeYeasy | null {
  return id && Object.prototype.hasOwnProperty.call(SEDES, id) ? SEDES[id as SedeId] : null
}

export function userUuid(sede: SedeYeasy): string {
  const valor = process.env[sede.userUuidEnv]
  if (!valor) {
    console.error('[reservas] falta', sede.userUuidEnv)
    throw new ErrorReserva('AGENDA_NO_DISPONIBLE', 503)
  }
  return valor
}
