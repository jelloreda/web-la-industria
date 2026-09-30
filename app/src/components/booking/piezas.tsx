import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const TEXTO_ERROR_CARGA = 'No hemos podido cargar la agenda. Inténtalo de nuevo en unos minutos o escríbenos por WhatsApp.'
export const TEXTO_ERROR_RESERVA = 'No hemos podido completar la reserva. Inténtalo de nuevo en unos minutos o escríbenos por WhatsApp.'

export function Cuerpo({ children }: { children: ReactNode }) {
  return <div className="grow overflow-y-auto p-5">{children}</div>
}

export function Etiqueta({ children }: { children: ReactNode }) {
  return <span className="font-work-sans font-medium text-[9px] uppercase tracking-[0.4em] text-arena">{children}</span>
}

export function Pie({ nota, children }: { nota?: string; children: ReactNode }) {
  return (
    <div className="shrink-0 flex flex-col gap-2.5 px-5 pt-3.5 pb-6 border-t border-[#4a4948] bg-carbon">
      {nota && <p className="text-center font-work-sans text-xs text-arena">{nota}</p>}
      {children}
    </div>
  )
}

export function BotonPrincipal({ className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      {...props}
      className={cn(
        'min-h-[52px] w-full bg-cream text-carbon hover:bg-cream-bg font-work-sans font-bold text-[13px] uppercase tracking-[0.25em] transition-colors disabled:opacity-45 disabled:cursor-not-allowed',
        className,
      )}
    />
  )
}

export function Esqueleto({ className }: { className?: string }) {
  return <div aria-hidden className={cn('bg-dark2 animate-pulse', className)} />
}

export function AvisoError({ texto, onReintentar, whatsappUrl }: { texto: string; onReintentar?: () => void; whatsappUrl: string }) {
  return (
    <div role="alert" className="flex flex-col gap-3 p-4 border border-cream/40">
      <p className="font-work-sans text-[13px] leading-relaxed text-cream">{texto}</p>
      <div className="flex flex-wrap items-center gap-5">
        {onReintentar && (
          <button type="button" onClick={onReintentar} className="min-h-11 px-4 bg-cream text-carbon font-work-sans font-bold text-[11px] uppercase tracking-[0.25em]">
            Reintentar
          </button>
        )}
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="font-work-sans text-xs text-cream underline underline-offset-4">
          Escríbenos por WhatsApp
        </a>
      </div>
    </div>
  )
}

export function Resumen({ filas, children }: { filas: Array<[string, string]>; children?: ReactNode }) {
  return (
    <div className="flex flex-col bg-dark2">
      <dl>
        {filas.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-3 border-b border-[#4a4948] last:border-b-0">
            <dt className="pt-0.5 font-work-sans font-bold text-[9px] uppercase tracking-[0.25em] text-arena">{k}</dt>
            <dd className="font-work-sans text-[13px] text-right text-cream">{v}</dd>
          </div>
        ))}
      </dl>
      {children}
    </div>
  )
}
