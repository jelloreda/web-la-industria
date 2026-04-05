import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MarqueeProps {
  children: ReactNode
  className?: string
  duration?: number
  pauseOnHover?: boolean
}

export function Marquee({
  children,
  className,
  duration = 35,
  pauseOnHover = true,
}: MarqueeProps) {
  return (
    <div
      className={cn(
        'overflow-hidden',
        '[mask-image:linear-gradient(to_right,transparent,white_8%,white_92%,transparent)]',
        className,
      )}
    >
      <div
        className={cn(
          'flex w-max gap-4',
          pauseOnHover && '[&:hover]:[animation-play-state:paused]',
        )}
        style={{ animation: `marquee ${duration}s linear infinite` }}
      >
        {children}
        {children}
      </div>
    </div>
  )
}
