import Link from 'next/link'
import * as React from 'react'
import { CUSTOM_ACCENTS } from '@/shared/constants'
import { Container, Eyebrow } from './landing-ui'

export type TemplateCard = { name: string; scheme: string; className: string; cover: React.ReactNode }

/** Обложки — в схеме и шрифте самого шаблона, как на экране выбора. */
export const TEMPLATES: TemplateCard[] = [
  { name: 'ДР мальчика', scheme: 'Полночь', className: 'midnight look-pattern-stars', cover: <><span className="font-unbounded text-display-md font-extrabold leading-none text-primary">7</span><span className="font-unbounded text-title-xs font-extrabold">Тёме — семь!</span></> },
  { name: 'ДР девочки', scheme: 'Пудра', className: 'powder', cover: <><span className="h-16 w-16 rounded-full border-[5px] border-card bg-secondary" /><span className="text-title-xs font-bold" style={{ fontFamily: 'var(--font-comfortaa)' }}>Соне <span className="text-primary">5 лет</span></span></> },
  { name: 'Свадьба', scheme: 'Лён', className: 'linen', cover: <><span className="h-[84px] w-[70px] rounded-b-control-lg rounded-t-full bg-secondary" /><span className="text-title font-bold" style={{ fontFamily: 'var(--font-cormorant)' }}>Аня и Лев</span></> },
  { name: 'Юбилей', scheme: 'Малахит', className: 'malachite look-pattern-lines', cover: <><span className="text-display font-bold leading-none text-primary" style={{ fontFamily: 'var(--font-playfair)' }}>60</span><span className="text-lead" style={{ fontFamily: 'var(--font-playfair)' }}>Сергей Петрович</span></> },
  { name: 'ДР мужчины', scheme: 'Графит', className: 'graphite look-pattern-lines', cover: <span className="text-display-sm font-semibold uppercase leading-none" style={{ fontFamily: 'var(--font-oswald)' }}>Диме <span className="text-primary">35</span></span> },
  { name: 'ДР девушки', scheme: 'Лаванда', className: 'lavender look-pattern-stars', cover: <span className="text-title-lg font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>Ане — <span className="text-primary">28</span></span> },
  { name: 'Гендер-пати', scheme: 'Пастель', className: 'pastel look-pattern-confetti', cover: <span className="text-title-lg font-bold" style={{ fontFamily: 'var(--font-comfortaa)' }}><span style={{ color: CUSTOM_ACCENTS[2].light }}>?</span> или <span className="text-primary">?</span></span> },
  { name: 'Вечеринка', scheme: 'Лагуна', className: 'lagoon look-pattern-confetti', cover: <span className="text-title-lg font-semibold uppercase" style={{ fontFamily: 'var(--font-oswald)' }}>Тусим <span className="text-primary">до утра</span></span> },
]

export function TemplatesSection() {
  return (
    <section className="border-y bg-muted/30 py-20 md:py-28">
      <Container className="space-y-10">
        <div className="flex items-end justify-between gap-6">
          <div className="space-y-4">
            <Eyebrow>Шаблоны</Eyebrow>
            <h2 className="font-unbounded text-title-lg font-extrabold md:text-display-md">Готовая страница под повод</h2>
          </div>
          <Link href="/wishlist-for" className="hidden whitespace-nowrap text-title-xs font-bold text-primary hover:underline md:inline">Все шаблоны →</Link>
        </div>
        <div className="-mx-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:scroll-px-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
          {TEMPLATES.map(t => (
            <Link key={t.name} href="/wishlist-for" className="w-[160px] shrink-0 snap-start overflow-hidden rounded-card border transition-transform hover:-translate-y-1 md:w-auto">
              <div className={`${t.className} flex h-[124px] flex-col items-center justify-center gap-1 bg-background px-4 text-center text-foreground md:h-[180px]`}>{t.cover}</div>
              <div className="flex items-center justify-between bg-card px-4 py-3.5 text-body-sm">
                <b>{t.name}</b><span className="hidden text-muted-foreground md:inline">{t.scheme}</span>
              </div>
            </Link>
          ))}
        </div>
        <Link href="/wishlist-for" className="flex h-14 items-center justify-center rounded-card border bg-card font-semibold md:hidden">Все 8 шаблонов</Link>
      </Container>
    </section>
  )
}
