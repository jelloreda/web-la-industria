import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TypewriterProps {
  text: string
  speed?: number
  delay?: number
  className?: string
}

export function Typewriter({ text, speed = 55, delay = 800, className }: TypewriterProps) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone]           = useState(false)

  useEffect(() => {
    let i = 0
    setDisplayed('')
    setDone(false)
    const start = setTimeout(() => {
      const iv = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1))
          i++
        } else {
          setDone(true)
          clearInterval(iv)
        }
      }, speed)
      return () => clearInterval(iv)
    }, delay)
    return () => clearTimeout(start)
  }, [text, speed, delay])

  return (
    <span className={className}>
      {displayed}
      {!done && (
        <span className="animate-pulse ml-0.5 text-gray-stone">|</span>
      )}
    </span>
  )
}
