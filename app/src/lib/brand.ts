export const BOOKING_URL   = 'https://cut.yeasyapp.com/J0W7kF'
export const WHATSAPP_URL  = 'https://wa.me/34627015904'
export const INSTAGRAM   = '@laindustria.barber'
export const IG_URL      = 'https://www.instagram.com/laindustria.barber'
export const MAPS_EMBED  = 'https://maps.google.com/maps?q=Avenida+Reina+Victoria+41+Madrid&z=16&output=embed'
export const MAPS_URL    = 'https://maps.app.goo.gl/DWMwgH6QEkesm1Rp8'
export const PHONE       = '+34 627 015 904'
export const ADDRESS     = 'Avenida Reina Victoria 41, Madrid'
export const HOURS       = [
  { days: 'Lunes – Viernes', time: '10:00 – 21:00' },
  { days: 'Sábado',          time: '11:00 – 16:00' },
  { days: 'Domingo',         time: 'Cerrado' },
]

export const SERVICE_BOOKING_URLS: Record<string, string> = {
  corte_standard: 'https://yeasy.io/commerce/6f554a4a-15ea-4752-9ea5-985791a6c972/booking?params=%7B%22service%22%3A%5B%7B%22uuid%22%3A%225029b0af-bd81-424d-bb85-8043fae859ea%22%2C%22name%22%3A%22Corte%20y%20Degradado%20a%20Maquina%22%2C%22price%22%3A16%2C%22defaultDuration%22%3A30%2C%22isPublic%22%3Atrue%7D%5D%2C%22commerce%22%3A%7B%22uuid%22%3A%226f554a4a-15ea-4752-9ea5-985791a6c972%22%7D%7D',
  corte_premium: 'https://yeasy.io/commerce/6f554a4a-15ea-4752-9ea5-985791a6c972/booking?params=%7B%22service%22%3A%5B%7B%22uuid%22%3A%2272bef3d5-d132-47a6-bd0c-f42f7594de33%22%2C%22name%22%3A%22Corte%20de%20pelo%20premium%22%2C%22price%22%3A18%2C%22defaultDuration%22%3A40%2C%22isPublic%22%3Atrue%7D%5D%2C%22commerce%22%3A%7B%22uuid%22%3A%226f554a4a-15ea-4752-9ea5-985791a6c972%22%7D%7D',
  corte_tijera: 'https://yeasy.io/commerce/6f554a4a-15ea-4752-9ea5-985791a6c972/booking?params=%7B%22service%22%3A%5B%7B%22uuid%22%3A%22364eaa22-3732-4843-abbb-b06d937c16ea%22%2C%22name%22%3A%22Corte%20a%20Tijera%20corto%22%2C%22price%22%3A20%2C%22defaultDuration%22%3A30%2C%22isPublic%22%3Atrue%7D%5D%2C%22commerce%22%3A%7B%22uuid%22%3A%226f554a4a-15ea-4752-9ea5-985791a6c972%22%7D%7D',
  corte_barba_standard: 'https://yeasy.io/commerce/6f554a4a-15ea-4752-9ea5-985791a6c972/booking?params=%7B%22service%22%3A%5B%7B%22uuid%22%3A%22e9621d70-a956-4b8f-bb80-dd2a1a816f6a%22%2C%22name%22%3A%22Corte%20y%20Degradado%20%2B%20Barba%22%2C%22price%22%3A25%2C%22defaultDuration%22%3A60%2C%22isPublic%22%3Atrue%7D%5D%2C%22commerce%22%3A%7B%22uuid%22%3A%226f554a4a-15ea-4752-9ea5-985791a6c972%22%7D%7D',
  corte_barba_premium: 'https://yeasy.io/commerce/6f554a4a-15ea-4752-9ea5-985791a6c972/booking?params=%7B%22service%22%3A%5B%7B%22uuid%22%3A%22af8edd41-53e2-4099-b085-66fd684f97a8%22%2C%22name%22%3A%22Corte%20y%20barba%20premium%22%2C%22price%22%3A27%2C%22defaultDuration%22%3A60%2C%22isPublic%22%3Atrue%7D%5D%2C%22commerce%22%3A%7B%22uuid%22%3A%226f554a4a-15ea-4752-9ea5-985791a6c972%22%7D%7D',
  corte_tijera_barba: 'https://yeasy.io/commerce/6f554a4a-15ea-4752-9ea5-985791a6c972/booking?params=%7B%22service%22%3A%5B%7B%22uuid%22%3A%2288a96e08-1721-413d-855d-e8349ffb4d6a%22%2C%22name%22%3A%22Corte%20Tijera%20y%20Barba%20desde%22%2C%22price%22%3A27%2C%22defaultDuration%22%3A60%2C%22isPublic%22%3Atrue%7D%5D%2C%22commerce%22%3A%7B%22uuid%22%3A%226f554a4a-15ea-4752-9ea5-985791a6c972%22%7D%7D',
  arreglo_barba: 'https://yeasy.io/commerce/6f554a4a-15ea-4752-9ea5-985791a6c972/booking?params=%7B%22service%22%3A%5B%7B%22uuid%22%3A%223ea39fec-77c2-4d42-a1db-aa8ada3083f0%22%2C%22name%22%3A%22Arreglo%20De%20Barba%22%2C%22price%22%3A15%2C%22defaultDuration%22%3A30%2C%22isPublic%22%3Atrue%7D%5D%2C%22commerce%22%3A%7B%22uuid%22%3A%226f554a4a-15ea-4752-9ea5-985791a6c972%22%7D%7D',
  corte_jubilado: 'https://yeasy.io/commerce/6f554a4a-15ea-4752-9ea5-985791a6c972/booking?params=%7B%22service%22%3A%5B%7B%22uuid%22%3A%221c140076-6260-451f-8e07-74bae0e94361%22%2C%22name%22%3A%22Corte%20pelo%20jubilado%22%2C%22price%22%3A12%2C%22defaultDuration%22%3A15%2C%22isPublic%22%3Atrue%7D%5D%2C%22commerce%22%3A%7B%22uuid%22%3A%226f554a4a-15ea-4752-9ea5-985791a6c972%22%7D%7D',
}
