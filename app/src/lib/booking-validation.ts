export const PREFIJOS = [
  { code: '+34', label: 'ES +34' }, { code: '+351', label: 'PT +351' }, { code: '+33', label: 'FR +33' },
  { code: '+39', label: 'IT +39' }, { code: '+44', label: 'UK +44' }, { code: '+49', label: 'DE +49' },
  { code: '+1', label: 'US +1' }, { code: '+52', label: 'MX +52' }, { code: '+57', label: 'CO +57' },
  { code: '+58', label: 'VE +58' }, { code: '+54', label: 'AR +54' },
]

export function telefonoValido(prefijo: string, numero: string): boolean {
  const limpio = numero.replace(/[\s.\-()]/g, '')
  return prefijo === '+34' ? /^[6789]\d{8}$/.test(limpio) : /^\d{6,12}$/.test(limpio)
}

export function nombreValido(nombre: string): boolean {
  const n = nombre.trim()
  return n.length <= 60 && n.split(/\s+/).filter(Boolean).length >= 2
}
