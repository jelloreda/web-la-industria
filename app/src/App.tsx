import { Analytics } from '@vercel/analytics/react'
import { Nav }      from './components/Nav'
import { Hero }     from './components/Hero'
import { Services } from './components/Services'
import { Team }     from './components/Team'
import { Booking }  from './components/Booking'
import { Contact }  from './components/Contact'
import { BookingProvider } from './components/booking/BookingProvider'

export default function App() {
  return (
    <BookingProvider>
      <Nav />
      <main>
        <Hero />
        <Services />
        <Team />
        <Booking />
        <Contact />
      </main>
      <Analytics />
    </BookingProvider>
  )
}
