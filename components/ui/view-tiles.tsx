'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

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
              'flex h-14 flex-col items-center justify-center gap-1 rounded-control-lg text-micro font-semibold transition-colors duration-fast',
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
