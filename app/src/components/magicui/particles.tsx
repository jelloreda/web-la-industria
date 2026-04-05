import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface Particle {
  x: number; y: number; vx: number; vy: number
  size: number; opacity: number
}

interface ParticlesProps {
  className?: string
  quantity?: number
  color?: string
}

export function Particles({ className, quantity = 60, color = '#7F7F7D' }: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf: number
    const particles: Particle[] = []

    function resize() {
      canvas!.width  = canvas!.offsetWidth
      canvas!.height = canvas!.offsetHeight
      particles.length = 0
      for (let i = 0; i < quantity; i++) {
        particles.push({
          x:       Math.random() * canvas!.width,
          y:       Math.random() * canvas!.height,
          vx:      (Math.random() - 0.5) * 0.25,
          vy:      (Math.random() - 0.5) * 0.25,
          size:    Math.random() * 1.5 + 0.3,
          opacity: Math.random() * 0.35 + 0.05,
        })
      }
    }

    function hexToRgb(hex: string) {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `${r},${g},${b}`
    }

    const rgb = hexToRgb(color)

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas!.width
        if (p.x > canvas!.width) p.x = 0
        if (p.y < 0) p.y = canvas!.height
        if (p.y > canvas!.height) p.y = 0
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${rgb},${p.opacity})`
        ctx!.fill()
      }
      raf = requestAnimationFrame(draw)
    }

    resize()
    draw()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [quantity, color])

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 w-full h-full pointer-events-none', className)}
    />
  )
}
