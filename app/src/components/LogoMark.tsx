import logoFull from '@/assets/logo-full.png'
import logoIcon from '@/assets/logo-icon.png'

interface LogoMarkProps {
  className?: string
  showText?: boolean   // true = full logo (icon+text), false = icon only
  iconSize?: number    // controls height in px
}

export function LogoMark({
  className,
  showText = true,
  iconSize = 56,
}: LogoMarkProps) {
  const src = showText ? logoFull : logoIcon

  // Full logo: iconSize = width, height auto (preserves real aspect ratio)
  // Icon only: iconSize = both width and height (roughly square)
  const style = showText
    ? { width: iconSize, height: 'auto' }
    : { width: iconSize, height: iconSize, objectFit: 'contain' as const }

  return (
    <img
      src={src}
      alt="La Industria"
      className={className}
      style={style}
      draggable={false}
    />
  )
}
