import * as React from 'react'
import { cn } from '@/lib/utils'

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'inline-flex items-center border border-cream/20 px-3 py-1 text-[9px] font-jost font-bold uppercase tracking-[0.3em] text-arena',
        className,
      )}
      {...props}
    />
  )
}
