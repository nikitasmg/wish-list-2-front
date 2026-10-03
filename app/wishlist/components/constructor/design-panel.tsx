'use client'

import { ColorsSelect } from '@/app/wishlist/components/colors-select'
import { cn } from '@/lib/utils'
import { HEADING_FONTS, PATTERNS, backgroundPattern, headingFont } from '@/shared/look'
import { BackgroundPattern, Wishlist } from '@/shared/types'
import * as React from 'react'
import { Toggle } from './controls'

type Settings = Wishlist['settings']

/**
 * «Оформление»: схема, шрифт заголовков, узор фона и «живость» — главная
 * мечта крупно, конфетти при брони, живой таймер. Всё это — настройки
 * страницы целиком, а не блока.
 */
export function DesignPanel({ settings, onChange }: { settings: Settings; onChange: (settings: Settings, key?: string) => void }) {
  const font = headingFont(settings)
  const pattern = backgroundPattern(settings)
  return (
    <div className="space-y-6 p-5">
      <ColorsSelect
        compact
        value={settings.colorScheme}
        customScheme={settings.customScheme}
        onChange={colorScheme => onChange({
          ...settings,
          colorScheme,
          ...(colorScheme === 'custom' && !settings.customScheme ? { customScheme: { base: 'dark' as const, accent: '#FF8A65' } } : {}),
        })}
        onCustomChange={customScheme => onChange({ ...settings, customScheme }, 'customScheme')}
      />

      <section className="space-y-2.5">
        <h3 className="text-xs font-semibold text-muted-foreground">Шрифт заголовков</h3>
        <div role="group" aria-label="Шрифт заголовков" className="grid grid-cols-2 gap-1.5">
          {HEADING_FONTS.map(option => (
            <button
              key={option.value}
              type="button"
              aria-pressed={font === option.value}
              onClick={() => onChange({ ...settings, headingFont: option.value })}
              className={cn(
                'flex h-12 items-center gap-2.5 rounded-xl px-3 text-left text-xs font-semibold transition-colors',
                font === option.value ? 'bg-accent text-foreground ring-2 ring-primary' : 'bg-muted/50 text-muted-foreground hover:text-foreground',
              )}
            >
              <span className="text-xl leading-none text-foreground" style={{ fontFamily: option.family, fontWeight: 700 }} aria-hidden>Аа</span>
              {option.name}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2.5">
        <h3 className="text-xs font-semibold text-muted-foreground">Узор фона</h3>
        <div role="group" aria-label="Узор фона" className="grid grid-cols-4 gap-1.5">
          {PATTERNS.map(option => (
            <button
              key={option.value}
              type="button"
              aria-pressed={pattern === option.value}
              onClick={() => onChange({ ...settings, pattern: option.value as BackgroundPattern })}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl p-1.5 text-[11px] font-semibold transition-colors',
                pattern === option.value ? 'bg-accent text-foreground ring-2 ring-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span className={cn('block h-10 w-full rounded-lg border bg-background', `look-pattern-${option.value}`)} aria-hidden />
              {option.name}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground">Живость</h3>
        <Toggle label="Главная мечта крупно" checked={Boolean(settings.mainDreamLarge)} onChange={mainDreamLarge => onChange({ ...settings, mainDreamLarge })} />
        <Toggle label="Конфетти при брони" checked={Boolean(settings.confettiOnReserve)} onChange={confettiOnReserve => onChange({ ...settings, confettiOnReserve })} />
        <Toggle label="Живой таймер до праздника" checked={Boolean(settings.liveTimer)} onChange={liveTimer => onChange({ ...settings, liveTimer })} />
      </section>
    </div>
  )
}
