import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { LogoMark } from './LogoMark'
import { Button } from './ui/button'
import { Sheet, SheetTrigger, SheetContent, SheetClose } from './ui/sheet'
import { cn } from '@/lib/utils'
import { BOOKING_URL } from '@/lib/brand'

const links = [
  { label: 'Servicios', href: '#servicios' },
  { label: 'Equipo',    href: '#equipo'    },
  { label: 'Reservas',  href: '#reservas'  },
  { label: 'Reseñas',   href: '#resenas'   },
  { label: 'Contacto',  href: '#contacto'  },
]

export function Nav() {
  const [scrolled, setScrolled] = useState(false)

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
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:block"
        >
          <Button variant="outline" size="sm">Reservar</Button>
        </a>

        {/* Mobile hamburger */}
        <Sheet>
          <SheetTrigger className="md:hidden text-arena hover:text-cream transition-colors" aria-label="Menú">
            <Menu size={20} />
          </SheetTrigger>
          <SheetContent>
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
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4"
              >
                <Button className="w-full">Reservar cita</Button>
              </a>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}
