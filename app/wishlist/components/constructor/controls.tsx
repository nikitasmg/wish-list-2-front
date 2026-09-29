'use client'

import { cn } from '@/lib/utils'
import * as React from 'react'

/**
 * Мелкие элементы панели настроек.
 *
 * В макете выбор из двух-трёх вариантов — это сегменты и тумблеры, а не
 * выпадающий список: варианты видны сразу, и до них один щелчок, а не два.
 */

export function Field({ label, children, hint }: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T
  options: readonly (readonly [T, string])[]
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-0.5 rounded-xl border p-[3px]">
      {options.map(([option, name]) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn(
            'h-8 flex-1 rounded-lg px-2 text-[13px] font-semibold transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            value === option ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {name}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange, label }: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          checked ? 'bg-primary' : 'bg-muted',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 block h-4 w-4 rounded-full bg-background shadow transition-all',
            checked ? 'left-[18px]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  )
}

/** Плитки видов: иконка плюс подпись — по ним видно, чем виды отличаются. */
export function ViewTiles({ value, options, onChange, icon }: {
  value: string
  options: readonly (readonly [string, string])[]
  onChange: (value: string) => void
  icon: (view: string) => React.ComponentType<{ size?: number; className?: string }>
}) {
  return (
    <div
      role="group"
      aria-label="Вид блока"
      className={cn('grid gap-1.5', options.length > 4 ? 'grid-cols-3' : 'grid-cols-2')}
    >
      {options.map(([option, name]) => {
        const Icon = icon(option)
        const active = value === option
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={cn(
              'flex h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'bg-accent text-foreground ring-2 ring-primary'
                : 'bg-muted/50 text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon size={18} aria-hidden />
            <span className="max-w-full truncate px-1">{name}</span>
          </button>
        )
      })}
    </div>
  )
}
