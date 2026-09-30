import { useState, useEffect } from 'react'
import { ArrowRight, Menu } from 'lucide-react'
import { LogoMark } from './LogoMark'
import { Button } from './ui/button'
import { Sheet, SheetTrigger, SheetContent, SheetClose, SheetTitle } from './ui/sheet'
import { cn } from '@/lib/utils'
import { CAMPAIGN_ACTIVE } from '@/lib/brand'
import { useBooking } from './booking/BookingProvider'

const links = [
  { label: 'Equipo',    href: '#equipo'    },
  { label: 'Sedes',     href: '#reservas'  },
  { label: 'Contacto',  href: '#contacto'  },
]

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const { open } = useBooking()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-dark2/90 backdrop-blur-md border-b border-white/5'
          : 'bg-transparent',
      )}
    >
      {CAMPAIGN_ACTIVE && (
        <a
          href="#reservas"
          className={cn(
            'flex items-center justify-center gap-3 sm:gap-4 bg-cream text-carbon font-work-sans text-[9px] sm:text-[10px] uppercase tracking-[0.25em] sm:tracking-[0.3em] overflow-hidden transition-all duration-300',
            scrolled ? 'h-0' : 'h-10',
          )}
        >
          <span className="font-bold">Nueva sede en Argüelles</span>
          <span aria-hidden className="block w-px h-3 bg-gray-stone" />
          <span className="font-medium">Ya abierta</span>
          <ArrowRight size={14} strokeWidth={1.8} className="hidden sm:block" />
        </a>
      )}
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#hero" className="flex items-center gap-3 group">
          <LogoMark showText={false} iconSize={32} />
          <span className="font-work-sans font-bold tracking-[0.2em] uppercase text-xs text-cream hidden sm:block">
            La Industria
          </span>
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <li key={l.href}>
              <a
                href={l.href}
                className="font-work-sans font-medium text-[10px] uppercase tracking-[0.3em] text-arena hover:text-cream transition-colors duration-200"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <Button variant="outline" size="sm" className="hidden md:inline-flex" onClick={() => open()}>
          Reservar
        </Button>

        {/* Mobile hamburger */}
        <Sheet>
          <SheetTrigger className="md:hidden text-arena hover:text-cream transition-colors" aria-label="Menú">
            <Menu size={20} />
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Menú de navegación</SheetTitle>
            <div className="mt-12 flex flex-col gap-8">
              {links.map(l => (
                <SheetClose asChild key={l.href}>
                  <a
                    href={l.href}
                    className="font-work-sans font-medium text-xs uppercase tracking-[0.35em] text-arena hover:text-cream transition-colors"
                  >
                    {l.label}
                  </a>
                </SheetClose>
              ))}
              <SheetClose asChild>
                <Button className="w-full mt-4" onClick={() => open()}>Reservar cita</Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}
