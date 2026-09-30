import { ErrorReserva } from './errores'
import type { ServicioPublico } from './tipos'
import { yeasy, type YServicio } from './yeasy'

/** Nombres limpios por UUID de servicio de Yeasy (los mismos en las dos sedes). */
const NOMBRES: Record<string, string> = {
  // Guzmán el Bueno
  '5029b0af-bd81-424d-bb85-8043fae859ea': 'Corte y degradado a máquina',
  '7bdc2cbf-a1b7-4a44-a6b4-1da3d78ba772': 'Cejas + corte y degradado',
  'f6f3d411-0c41-40cb-81c4-590b8aaa3758': 'Corte a tijera + taper (mullet, warrior, modcut)',
  'e9621d70-a956-4b8f-bb80-dd2a1a816f6a': 'Corte y degradado + barba',
  '88a96e08-1721-413d-855d-e8349ffb4d6a': 'Corte a tijera y barba',
  '64c2eaf8-22a1-46f7-a383-b7381701a614': 'Asesoramiento y corte',
  '72bef3d5-d132-47a6-bd0c-f42f7594de33': 'Corte de pelo premium',
  'af8edd41-53e2-4099-b085-66fd684f97a8': 'Corte y barba premium',
  '3ea39fec-77c2-4d42-a1db-aa8ada3083f0': 'Arreglo de barba',
  '1c140076-6260-451f-8e07-74bae0e94361': 'Corte jubilado',
  '364eaa22-3732-4843-abbb-b06d937c16ea': 'Corte a tijera corto',
  'e4b819c4-f81b-450c-8eb3-bbdce1eb4543': 'Corte a tijera clásico (M)',
  '98764bec-46f0-434e-b5a0-d99efea78824': 'Corte a tijera largo (L)',
  '78054898-30a7-4898-a867-51f68a59b1c2': 'Corte a tijera extra largo (XL)',
  '22bbddc6-e47f-4ee3-9ab2-bebb2d9a13ce': 'Limpieza facial + corte',
  'f5c2ea6c-4888-4b01-aa46-6af27979b92a': 'Limpieza facial + corte y barba',
  // Argüelles
  '5a3b79f1-a977-44a6-b2ad-a491ed56d405': 'Corte y degradado a máquina',
  '8206d001-5dff-41e1-9662-641a93318990': 'Cejas + corte y degradado',
  '828e15ba-b2a2-401c-9156-5f1967eaa4dd': 'Corte a tijera + taper (mullet, warrior, modcut)',
  '8647d980-f38f-4336-9c18-c9144325a455': 'Corte y degradado + barba',
  'be73e035-d69c-4b80-8577-c46e4a40cf1d': 'Corte a tijera y barba',
  '42a43644-9504-456c-babb-0d005d512af0': 'Asesoramiento y corte',
  '804abca9-4d88-4b49-b360-fdb3b8bb242a': 'Corte de pelo premium',
  '0c3a526d-c8ad-4d8d-ade0-d9ecf8516dd7': 'Corte y barba premium',
  '206c7a34-433d-4f54-8803-927e010d23a6': 'Arreglo de barba',
  'eef4180f-3f08-40a7-8a72-782e13bea206': 'Corte a tijera corto',
  'f2164712-4b2b-4343-9198-ae3b585aec66': 'Corte a tijera clásico (M)',
  '3e33df98-0f9d-4eec-8602-5ddb20622a3d': 'Corte a tijera largo (L)',
  'ea7e0600-3beb-49c8-83c5-73b34e298670': 'Corte a tijera extra largo (XL)',
  'faad9982-d736-4188-8d45-257cf950063b': 'Limpieza facial + corte',
  '705310ac-5e2d-483e-97bb-175a11d90cc4': 'Limpieza facial + corte y barba',
  '7e390455-18fd-4ca2-8327-18386bd65e9a': 'Corte jubilado',
  'aa6dd71d-17b4-40f6-923c-6c478b3e396d': 'Barba + cejas',
}

const DESDE = /\s+desde\s*$/i

export function limpiarNombre(nombre: string): string {
  const s = nombre.replace(DESDE, '').trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*\+\s*/g, ' + ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*\(\s*/g, ' (')
    .replace(/\s*\)/g, ')')
  return s.charAt(0).toLocaleUpperCase('es') + s.slice(1)
}

export function aServiciosPublicos(lista: YServicio[]): ServicioPublico[] {
  const ordenados = [...lista].sort((a, b) => a.order - b.order)
  const separador = ordenados.find(s => /extras/i.test(s.name))
  return ordenados
    .filter(s => s.isPublic && !s.isDeleted && (!separador || s.order < separador.order))
    .map(s => ({
      id: s.uuid,
      nombre: NOMBRES[s.uuid] ?? limpiarNombre(s.name),
      precio: s.price + (s.decimal ?? 0) / 100,
      desde: DESDE.test(s.name),
      duracion: s.defaultDuration,
    }))
}

export function serviciosDeSede(commerceUuid: string): Promise<YServicio[]> {
  return yeasy<YServicio[]>('/services/clientweb', { query: { commerce: commerceUuid } })
}

export async function buscarServicio(commerceUuid: string, id: string): Promise<YServicio> {
  const lista = await serviciosDeSede(commerceUuid)
  const visible = aServiciosPublicos(lista).some(s => s.id === id)
  const servicio = lista.find(s => s.uuid === id)
  if (!visible || !servicio) throw new ErrorReserva('DATOS_INVALIDOS', 422, ['servicio'])
  return servicio
}
