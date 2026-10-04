'use client'

import { CUSTOM_ACCENTS, CUSTOM_BASES, CUSTOM_SCHEME, colorSchema, normalizeScheme } from '@/shared/constants'
import { deriveSchemeStyle } from '@/shared/derive-scheme'
import { CustomScheme } from '@/shared/types'
import { cn } from '@/lib/utils'
import * as React from 'react'

type Props = {
  value: string
  onChange: (value: string) => void
  /** Своя схема: показываем настройку и превью, когда выбрано «Своя». */
  customScheme?: CustomScheme
  onCustomChange?: (scheme: CustomScheme) => void
  /** Узкая панель конструктора: схемы — кружками в ряд, имя выбранной — в заголовке. */
  compact?: boolean
}

const DEFAULT_CUSTOM: CustomScheme = { base: 'dark', accent: CUSTOM_ACCENTS[0].dark }

export const ColorsSelect = ({ value, onChange, customScheme, onCustomChange, compact }: Props) => {
  const current = normalizeScheme(value)
  const custom = customScheme ?? DEFAULT_CUSTOM
  const editable = Boolean(onCustomChange)

  if (compact) {
    const currentName = current === CUSTOM_SCHEME ? 'Своя' : colorSchema.find(s => s.value === current)?.name
    return (
      <section aria-label="Цветовая схема" className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-caption font-semibold text-muted-foreground">Цветовая схема</span>
          <span className="text-body-sm font-semibold">{currentName}</span>
        </div>
        <div role="group" aria-label="Схемы" className="flex flex-wrap gap-2">
          {colorSchema.map(scheme => (
            <button
              key={scheme.value}
              type="button"
              aria-pressed={current === scheme.value}
              aria-label={`${scheme.name}, ${scheme.kind === 'dark' ? 'тёмная' : 'светлая'}`}
              title={scheme.name}
              onClick={() => onChange(scheme.value)}
              className={cn('relative h-9 w-9 overflow-hidden rounded-full border-2 transition-transform hover:scale-110', current === scheme.value ? 'border-primary' : 'border-border')}
              style={{ backgroundColor: scheme.colors[0] }}
            >
              <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full" style={{ backgroundColor: scheme.colors[1] }} />
            </button>
          ))}
          {editable && (
            <button
              type="button"
              aria-pressed={current === CUSTOM_SCHEME}
              aria-label="Своя схема"
              title="Своя схема"
              onClick={() => onChange(CUSTOM_SCHEME)}
              className={cn('flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed text-muted-foreground', current === CUSTOM_SCHEME ? 'border-primary text-primary' : 'border-border')}
            >
              +
            </button>
          )}
        </div>
        {editable && current === CUSTOM_SCHEME && <CustomSchemeEditor scheme={custom} onChange={onCustomChange!} />}
      </section>
    )
  }

  return (
    <section aria-label="Цветовая схема" className="space-y-3">
      <p className="text-body-sm font-medium">Цветовая схема</p>
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {colorSchema.map(scheme => (
              <SchemeSwatch
                key={scheme.value}
                name={scheme.name}
                hint={scheme.kind === 'dark' ? 'тёмная' : 'светлая'}
                colors={scheme.colors as unknown as string[]}
                selected={current === scheme.value}
                onClick={() => onChange(scheme.value)}
              />
            ))}

            {editable && (
              <SchemeSwatch
                name="Своя"
                hint="акцент на выбор"
                colors={[CUSTOM_BASES[custom.base === 'dark' ? 'dark' : 'light'], custom.accent]}
                selected={current === CUSTOM_SCHEME}
                dashed
                onClick={() => onChange(CUSTOM_SCHEME)}
              />
            )}
          </div>

          {editable && current === CUSTOM_SCHEME && (
            <CustomSchemeEditor scheme={custom} onChange={onCustomChange!} />
          )}
        </div>
    </section>
  )
}

function SchemeSwatch({
  name, hint, colors, selected, dashed, onClick,
}: {
  name: string
  hint: string
  colors: string[]
  selected: boolean
  dashed?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex items-center gap-3 rounded-control-lg border p-2.5 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        dashed && 'border-dashed',
        selected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/50',
      )}
    >
      <span className="flex shrink-0">
        {colors.map((color, index) => (
          <span
            key={color + index}
            className={cn('w-5 h-5 rounded-full border border-border', index > 0 && '-ml-1.5')}
            style={{ backgroundColor: color }}
          />
        ))}
      </span>
      <span className="min-w-0">
        <span className="block text-body-sm font-semibold truncate">{name}</span>
        <span className="block text-caption text-muted-foreground truncate">{hint}</span>
      </span>
    </button>
  )
}

/**
 * Человек выбирает базу и акцент, остальные цвета выводит deriveSchemeStyle —
 * та же функция, что красит страницу гостя. Поэтому превью здесь показывает
 * ровно то, что увидят гости, а не приблизительную картинку.
 */
function CustomSchemeEditor({
  scheme, onChange,
}: {
  scheme: CustomScheme
  onChange: (scheme: CustomScheme) => void
}) {
  const setBase = (base: CustomScheme['base']) => {
    // Акцент меняем вместе с базой: светлые оттенки нечитаемы на белом,
    // поэтому у каждого цвета своя пара «для тёмной» / «для светлой».
    const pair = CUSTOM_ACCENTS.find(a => a.dark === scheme.accent || a.light === scheme.accent)
    onChange({ base, accent: pair ? pair[base] : CUSTOM_ACCENTS[0][base] })
  }

  return (
    <div className="rounded-control-lg border border-border p-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-body-sm font-semibold">Своя схема</span>
        <div className="inline-flex gap-1 p-0.5 rounded-control-lg border border-border">
          {(['dark', 'light'] as const).map(base => (
            <button
              key={base}
              type="button"
              onClick={() => setBase(base)}
              aria-pressed={scheme.base === base}
              className={cn(
                'h-7 px-2.5 rounded-control text-caption font-semibold',
                scheme.base === base ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground',
              )}
            >
              {base === 'dark' ? 'Тёмная' : 'Светлая'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CUSTOM_ACCENTS.map(accent => {
          const hex = accent[scheme.base]
          return (
            <button
              key={accent.name}
              type="button"
              aria-label={accent.name}
              aria-pressed={scheme.accent === hex}
              onClick={() => onChange({ ...scheme, accent: hex })}
              className={cn(
                'w-7 h-7 rounded-full border transition-shadow',
                scheme.accent === hex
                  ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground'
                  : 'border-border',
              )}
              style={{ backgroundColor: hex }}
            />
          )
        })}
      </div>

      <p className="text-caption text-muted-foreground">Выберите акцент — остальное подберём</p>

      <div
        className="rounded-control-lg border p-3 space-y-2"
        style={deriveSchemeStyle(scheme)}
      >
        <div className="bg-background text-foreground rounded-control-lg p-3 space-y-2">
          <div className="text-caption text-muted-foreground">14 ноября · 19:00</div>
          <div className="text-title-xs font-extrabold">
            Маше — <span className="text-primary">30!</span>
          </div>
          <div className="bg-card border border-border rounded-control-lg p-2 flex items-center gap-2">
            <span className="w-7 h-7 rounded-xs bg-muted shrink-0" />
            <span className="flex-1 min-w-0">
              <span className="block text-caption font-bold truncate">Лампа-гриб</span>
              <span className="block text-micro font-semibold text-primary">6 200 ₽</span>
            </span>
            <span className="h-6 px-2 rounded-xs bg-primary text-primary-foreground text-micro font-bold inline-flex items-center">
              Беру
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
