'use client'

import { cn } from '@/lib/utils'

/**
 * Выбор из двух-трёх вариантов. В макете это сегменты, а не выпадающий
 * список: варианты видны сразу, и до них один щелчок, а не два.
 *
 * Скругления вложены: контейнер rounded-control (10) с отступом 2 —
 * сегменты rounded-tag (8).
 */
export function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T
  options: readonly (readonly [T, string])[]
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-0.5 rounded-control border border-border p-0.5">
      {options.map(([option, name]) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn(
            'h-control-sm flex-1 rounded-tag px-2 text-label font-semibold transition-colors duration-fast',
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
