import { cn } from '@/lib/utils'
import { Eye } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

/**
 * Общие куски главной: ширина, подпись секции, заголовок и кнопки.
 *
 * Цвета — токены темы, поэтому главная живёт и в светлой, и в тёмной теме.
 * Фирменный градиент кнопок — нет: он одинаков в обеих темах, как в шапке
 * конструктора.
 */

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-[1200px] px-5 md:px-8', className)}>{children}</div>
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-eyebrow uppercase text-primary md:text-label">{children}</p>
}

export function SectionTitle({ eyebrow, title, lead, className }: {
  eyebrow: string
  title: React.ReactNode
  lead?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10', className)}>
      <div className="space-y-4">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="font-unbounded text-title-lg font-extrabold md:text-display-md">{title}</h2>
      </div>
      {lead && <p className="max-w-[440px] text-lead leading-relaxed text-muted-foreground">{lead}</p>}
    </div>
  )
}

export function PrimaryLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-14 items-center justify-center gap-2.5 rounded-card bg-gradient-to-r from-brand-sky to-brand-violet px-7 text-title-xs font-bold text-white',
        'transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
    >
      {children}
    </Link>
  )
}

export function SecondaryLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-14 items-center justify-center gap-2.5 rounded-card border bg-card px-6 text-title-xs font-semibold text-foreground',
        'hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {children}
    </Link>
  )
}

/**
 * Метка «Пример» на картинке-превью. Превью нарисованы живыми блоками, и без
 * метки кнопки в них хочется нажать. Сами превью — `EXAMPLE`: не ловят
 * указатель и не выделяются, курсор над ними обычный.
 */
export const EXAMPLE = 'pointer-events-none select-none'

export function ExampleBadge({ className, children = 'Пример' }: { className?: string; children?: React.ReactNode }) {
  return (
    <span
      className={cn(
        'pointer-events-none z-20 inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-border bg-background/85 px-2.5 text-micro font-bold uppercase tracking-wider text-muted-foreground backdrop-blur-sm',
        className,
      )}
    >
      <Eye size={12} aria-hidden />
      {children}
    </span>
  )
}

/** Мини-карточка блока внутри превью страницы — в цветах схемы превью. */
export function MiniCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('flex flex-col gap-2 rounded-card border bg-card p-3.5 text-card-foreground', className)}>{children}</div>
}

export function MiniLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-micro font-semibold text-muted-foreground">{children}</span>
}

export function MiniTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('heading text-body font-bold tracking-tight', className)}>{children}</span>
}

export function Pill({ children, strike }: { children: React.ReactNode; strike?: boolean }) {
  return <span className={cn('rounded-full border px-2.5 py-1 text-caption', strike && 'text-muted-foreground line-through')}>{children}</span>
}
