import { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  className?: string
}

export function ShimmerButton({ children, className, ...props }: ShimmerButtonProps) {
  return (
    <button
      className={cn(
        'relative overflow-hidden px-10 py-4',
        'font-work-sans font-bold text-sm uppercase tracking-[0.25em]',
        'bg-cream text-carbon',
        'transition-transform hover:scale-[1.02] active:scale-[0.98]',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 2.5s linear infinite',
        }}
      />
      <span className="relative z-10">{children}</span>
    </button>
  )
}
