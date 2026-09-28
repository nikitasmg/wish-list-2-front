'use client'

import { Present } from '@/shared/types'
import { cn } from '@/lib/utils'
import * as React from 'react'

export type PresentFilter = 'all' | 'free' | 'taken'

/**
 * Фильтр подарков над списком.
 *
 * Без «Подарено» — статуса «уже подарено» в модели нет, а рисовать вкладку,
 * которая всегда пуста, хуже, чем не рисовать её вовсе.
 */
export function filterPresents(presents: Present[], filter: PresentFilter): Present[] {
  if (filter === 'free') return presents.filter(p => !p.reserved)
  if (filter === 'taken') return presents.filter(p => p.reserved)
  return presents
}

type Props = {
  presents: Present[]
  value: PresentFilter
  onChange: (value: PresentFilter) => void
}

export function PresentsFilter({ presents, value, onChange }: Props) {
  const counts = {
    all: presents.length,
    free: presents.filter(p => !p.reserved).length,
    taken: presents.filter(p => p.reserved).length,
  }

  // Один подарок фильтровать не по чему.
  if (presents.length < 2) return null

  const tabs: { id: PresentFilter; label: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'free', label: 'Свободные' },
    { id: 'taken', label: 'Заняты' },
  ]

  return (
    <div className="inline-flex gap-1 p-1 rounded-xl border border-border/60">
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          aria-pressed={value === tab.id}
          className={cn(
            'h-9 px-3.5 rounded-lg text-sm font-semibold transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            value === tab.id
              ? 'bg-secondary text-secondary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.label} <span className="text-muted-foreground/70 tabular-nums">{counts[tab.id]}</span>
        </button>
      ))}
    </div>
  )
}
