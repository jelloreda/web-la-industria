import { Analytics } from '@vercel/analytics/react'
import { Nav }      from './components/Nav'
import { Hero }     from './components/Hero'
import { Services } from './components/Services'
import { Team }     from './components/Team'
import { Booking }  from './components/Booking'
import { Gallery }  from './components/Gallery'
import { Contact }  from './components/Contact'

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Services />
        <Team />
        <Booking />
        <Gallery />
        <Contact />
      </main>
      <Analytics />
    </>
  )
}
