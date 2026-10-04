'use client'

import { cn } from '@/lib/utils'
import { colorSchema } from '@/shared/constants'
import { HEADING_FONTS, pageLook } from '@/shared/look'
import type { HeadingFont } from '@/shared/types'
import * as React from 'react'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Container, SectionTitle } from './landing-ui'

/**
 * «Оформление»: схема и шрифт переключаются прямо здесь, а превью красится
 * теми же классами, что страница гостя. Расхождения с настоящей страницей
 * быть не может — это она и есть.
 */
export function ThemesSection() {
  // Пока схему не выбрали, превью — в тон теме сайта: светлая «Пудра» или
  // тёмная «Полночь», как остальные примеры на главной.
  // Тему сервер не знает — до монтирования рисуем тёмную, иначе разметка
  // разошлась бы при гидрации.
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [picked, setScheme] = useState<string | null>(null)
  const scheme = picked ?? (mounted && resolvedTheme === 'light' ? 'powder' : 'midnight')
  const [font, setFont] = useState<HeadingFont>('accent')
  const look = pageLook({ colorScheme: scheme, showGiftAvailability: true, headingFont: font, pattern: 'stars' })

  return (
    <section className="py-20 md:py-28">
      <Container className="space-y-10 md:space-y-10">
        <SectionTitle
          eyebrow="Оформление"
          title={<>Девять схем, шесть шрифтов<br className="hidden md:block" /> и своя палитра</>}
          lead="Нажмите на схему — так страница будет выглядеть у гостей. Можно выбрать акцент и собрать свою."
        />
        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-7">
          <div role="group" aria-label="Цветовая схема" className="flex flex-wrap gap-2 lg:flex-col lg:flex-nowrap lg:gap-2.5 lg:rounded-sheet lg:border lg:bg-card lg:p-5">
            {colorSchema.map(item => {
              const on = item.value === scheme
              return (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={on}
                  aria-label={item.name}
                  onClick={() => setScheme(item.value)}
                  className={cn(
                    'relative flex items-center gap-3 rounded-full border-2 text-left font-bold transition-colors lg:h-[50px] lg:rounded-control-lg lg:border lg:px-3.5',
                    'h-12 w-12 justify-center lg:w-auto lg:justify-start',
                    on ? 'border-primary lg:bg-accent' : 'border-border hover:border-primary/50',
                  )}
                >
                  <span className="flex" aria-hidden>
                    <span className="h-[22px] w-[22px] rounded-full border" style={{ backgroundColor: item.colors[0] }} />
                    <span className="-ml-2 h-[22px] w-[22px] rounded-full" style={{ backgroundColor: item.colors[1] }} />
                  </span>
                  <span className="hidden flex-1 lg:inline">{item.name}</span>
                  <span className="hidden text-caption font-semibold text-muted-foreground lg:inline">{item.kind === 'dark' ? 'тёмная' : 'светлая'}</span>
                </button>
              )
            })}
          </div>

          <div className={cn(look.className, 'flex flex-col gap-5 rounded-sheet border bg-background p-6 text-foreground md:p-10')} style={look.style}>
            <span className="text-body-sm font-bold text-primary">День рождения · 14 ноября · 19:00</span>
            <div className="heading text-display-sm font-extrabold leading-none md:text-display-md">Маше — 30!</div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="hidden flex-col gap-2 rounded-card border bg-card p-5 text-card-foreground sm:flex">
                <span className="text-caption font-semibold text-muted-foreground">Место</span>
                <span className="heading text-title font-extrabold">Лофт «Веранда»</span>
                <span className="text-body-sm text-muted-foreground">ул. Малышева, 51</span>
              </div>
              <div className="flex flex-col gap-2.5 rounded-card border bg-card p-5 text-card-foreground">
                <span className="text-caption font-semibold text-muted-foreground">Вишлист</span>
                <span className="heading text-title font-extrabold">Лампа-гриб</span>
                <span className="font-bold text-primary">6 200 ₽</span>
                <span className="flex h-10 items-center justify-center rounded-control bg-primary text-body-sm font-bold text-primary-foreground">Забронировать</span>
              </div>
            </div>
            <div role="group" aria-label="Шрифт заголовков" className="flex flex-wrap gap-2">
              {HEADING_FONTS.map(item => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={font === item.value}
                  onClick={() => setFont(item.value)}
                  className={cn(
                    'flex h-11 items-center gap-2 rounded-control-lg border bg-card px-3.5 text-label font-semibold text-card-foreground',
                    font === item.value ? 'border-primary' : 'hover:border-primary/50',
                  )}
                >
                  <b className="text-lead" style={{ fontFamily: item.family }}>Аа</b>{item.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
