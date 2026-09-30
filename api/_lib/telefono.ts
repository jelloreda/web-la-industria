import { parsePhoneNumberFromString } from 'libphonenumber-js/max'

export const PREFIJOS = ['+34', '+351', '+33', '+39', '+44', '+49', '+1', '+52', '+57', '+58', '+54'] as const

export function soloCifras(t: string): string {
  return t.replace(/\D/g, '')
}

export function aE164(prefijo: string, numero: string): string | null {
  if (!(PREFIJOS as readonly string[]).includes(prefijo)) return null
  const limpio = numero.replace(/[\s.\-()]/g, '')
  if (!/^\d{6,12}$/.test(limpio)) return null
  if (prefijo === '+34' && !/^[6789]\d{8}$/.test(limpio)) return null
  const tel = parsePhoneNumberFromString(prefijo + limpio)
  return tel && tel.isValid() ? tel.number : null
}

export function mismoTelefono(e164: string, deYeasy?: string | null): boolean {
  return !!deYeasy && soloCifras(deYeasy) === soloCifras(e164)
}
