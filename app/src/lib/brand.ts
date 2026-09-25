export const INSTAGRAM   = '@laindustria.barber'
export const IG_URL      = 'https://www.instagram.com/laindustria.barber'

// Campaña "dos sedes" en el hero. Poner a false a finales de octubre 2026
// para volver al hero original.
export const CAMPAIGN_ACTIVE = true

const HOURS = [
  { days: 'Lunes – Viernes', time: '10:00 – 21:00' },
  { days: 'Sábado',          time: '11:00 – 16:00' },
  { days: 'Domingo',         time: 'Cerrado' },
]

export interface Location {
  id: string
  name: string
  isNew?: boolean
  address: string
  shortAddress: string
  bookingUrl: string
  mapsUrl: string
  mapsEmbed: string
  phone: string
  whatsappUrl: string
  hours: typeof HOURS
  barbers: string[]
}

export const LOCATIONS: Location[] = [
  {
    id: 'guzman-el-bueno',
    name: 'Guzmán el Bueno',
    address: 'Avenida Reina Victoria 41, Madrid',
    shortAddress: 'Av. Reina Victoria 41',
    bookingUrl: 'https://cut.yeasyapp.com/J0W7kF',
    mapsUrl: 'https://maps.app.goo.gl/DWMwgH6QEkesm1Rp8',
    mapsEmbed: 'https://maps.google.com/maps?q=Avenida+Reina+Victoria+41+Madrid&z=16&output=embed',
    phone: '+34 627 015 904',
    whatsappUrl: 'https://wa.me/34627015904',
    hours: HOURS,
    barbers: ['Sanmil', 'Carlos', 'Mateo', 'Wuill'],
  },
  {
    id: 'arguelles',
    name: 'Argüelles',
    isNew: true,
    address: 'Calle de Altamirano 3, Madrid',
    shortAddress: 'Calle de Altamirano 3',
    bookingUrl: 'https://cut.yeasyapp.com/bVr605',
    mapsUrl: 'https://maps.app.goo.gl/Atg7E25B1QEBkXK5A',
    mapsEmbed: 'https://maps.google.com/maps?q=Calle+de+Altamirano+3+28008+Madrid&z=16&output=embed',
    phone: '+34 627 015 904',
    whatsappUrl: 'https://wa.me/34627015904',
    hours: HOURS,
    barbers: ['Luz', 'David', 'Edgar'],
  },
]

/** "Sanmil, Carlos, Mateo y Wuill" */
export function joinNames(names: string[]) {
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}
