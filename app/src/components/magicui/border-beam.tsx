import { cn } from '@/lib/utils'

interface BorderBeamProps {
  className?: string
  duration?: number
}

export function BorderBeam({ className, duration = 4 }: BorderBeamProps) {
  return (
    <span
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <span
        className="absolute inset-0"
        style={{
          padding: '1px',
          background: `conic-gradient(from var(--beam-angle, 0deg) at 50% 50%, transparent 0deg, #E9E4DB 60deg, #7F7F7D 120deg, transparent 180deg)`,
          animation: `beam-spin ${duration}s linear infinite`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          mask:       'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
    </span>
  )
}
