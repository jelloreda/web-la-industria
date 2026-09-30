import type { SedeId } from './tipos'

export interface SedeYeasy { id: SedeId; commerceUuid: string }

const SEDES: Record<SedeId, SedeYeasy> = {
  'guzman-el-bueno': { id: 'guzman-el-bueno', commerceUuid: '6f554a4a-15ea-4752-9ea5-985791a6c972' },
  arguelles: { id: 'arguelles', commerceUuid: 'c14b04a8-a151-41e4-b042-0f8c5c678b42' },
}

export function sedePorId(id: string | null): SedeYeasy | null {
  return id && Object.prototype.hasOwnProperty.call(SEDES, id) ? SEDES[id as SedeId] : null
}
