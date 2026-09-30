import { separarNombre } from './nombres'
import { userUuid, type SedeYeasy } from './sedes'
import { mismoTelefono } from './telefono'
import { yeasy, type YCliente } from './yeasy'

export async function buscarClientePorTelefono(commerceUuid: string, e164: string): Promise<YCliente | null> {
  const lista = await yeasy<YCliente[]>(`/customer/commerceAndCreatedBynewV2/${commerceUuid}`, { auth: true })
  return (Array.isArray(lista) ? lista : []).find(c => !c.isDeleted && mismoTelefono(e164, c.phone)) ?? null
}

export function crearCliente(sede: SedeYeasy, nombre: string, e164: string): Promise<YCliente> {
  const { name, lastname } = separarNombre(nombre)
  return yeasy<YCliente>('/customer/commerce', {
    method: 'POST',
    auth: true,
    body: { name, lastname, email: '', phone: e164, password: '', createdBy: userUuid(sede), createdByCommerce: true },
  })
}
