import { Check, Filter, Gift, ImagePlus, Lock, Star } from 'lucide-react'
import * as React from 'react'
import { Container, Eyebrow } from './landing-ui'

function Cover({ letter, className = 'h-[120px]', main }: { letter: string; className?: string; main?: boolean }) {
  return (
    <div className={`relative flex items-center justify-center bg-secondary font-unbounded text-5xl font-extrabold text-primary ${className}`}>
      {letter}
      {main && <span className="absolute left-3.5 top-3.5 flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 font-manrope text-xs font-extrabold text-primary-foreground"><Star size={11} fill="currentColor" />Главная мечта</span>}
    </div>
  )
}

/**
 * Вишлист глазами гостей: форма «Как вас подписать?», «Вы дарите», чужая
 * бронь с именем, «Уже подарено» и благодарность после брони.
 */
export function GiftsShowcase() {
  return (
    <section className="py-20 md:border-y md:bg-muted/30 md:py-28">
      <Container className="grid items-center gap-10 lg:grid-cols-[440px_minmax(0,1fr)] lg:gap-16">
        <div className="flex flex-col gap-5">
          <Eyebrow>Вишлист</Eyebrow>
          <h2 className="font-unbounded text-[30px] font-extrabold leading-[1.05] tracking-[-0.04em] md:text-[52px]">Бронь без регистрации. Сюрприз — сюрприз</h2>
          <p className="text-base leading-relaxed text-muted-foreground md:text-[19px]">
            Гость жмёт «Забронировать», подписывается как хочет — или анонимно. Другие гости видят «Дарит Аня», а вы — только что подарок занят.
          </p>
          <ul className="hidden flex-col gap-3 md:flex">
            <li className="flex items-center gap-2.5"><Star size={16} className="text-[#FFD166]" fill="currentColor" aria-hidden />Главная мечта — первой и крупнее</li>
            <li className="flex items-center gap-2.5"><Filter size={16} className="text-primary" aria-hidden />Фильтр: свободные, заняты, подарено</li>
            <li className="flex items-center gap-2.5"><ImagePlus size={16} className="text-primary" aria-hidden />Фото перетаскиванием или Ctrl + V</li>
          </ul>
        </div>

        <div className="midnight wishlist-page look-font-accent grid gap-3.5 rounded-3xl bg-background p-4 text-foreground sm:grid-cols-[1.4fr_1fr_1fr] md:p-5" aria-hidden>
          <div className="flex flex-col overflow-hidden rounded-[18px] border bg-card sm:row-span-2">
            <Cover letter="Н" className="h-[150px] sm:h-auto sm:min-h-[220px] sm:flex-1" main />
            <div className="flex flex-col gap-1.5 p-3.5">
              <span className="heading text-lg font-bold">Набор «Раскопки динозавра»</span>
              <span className="font-bold text-primary">1 900 ₽</span>
              <span className="mt-1 text-xs font-bold">Как вас подписать?</span>
              <span className="flex h-9 items-center rounded-lg border bg-background px-2.5 text-[13px] text-muted-foreground">Аня</span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-3.5 w-3.5 rounded border" />Анонимно</span>
              <span className="flex h-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">Готово</span>
            </div>
          </div>
          <div className="hidden flex-col overflow-hidden rounded-[18px] border bg-card sm:flex">
            <Cover letter="Д" />
            <div className="flex flex-col gap-1.5 p-3.5"><b>Детский телескоп</b><span className="text-sm font-bold text-primary">5 900 ₽</span><span className="flex h-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">Забронировать</span></div>
          </div>
          <div className="flex flex-col overflow-hidden rounded-[18px] border border-primary/60 bg-card">
            <Cover letter="К" className="hidden h-[120px] sm:flex" />
            <div className="flex flex-col gap-1.5 p-3.5"><b>Конструктор «Вулкан»</b><span className="text-sm font-bold text-primary">3 490 ₽</span>
              <span className="flex h-10 items-center justify-between rounded-xl border border-primary px-3 text-[13px] font-bold text-primary"><span className="flex items-center gap-1"><Check size={14} />Вы дарите</span><span className="text-xs font-semibold text-muted-foreground">Отменить</span></span></div>
          </div>
          <div className="flex flex-col overflow-hidden rounded-[18px] border bg-card opacity-55">
            <Cover letter="М" className="hidden h-[120px] sm:flex" />
            <div className="flex flex-col gap-1.5 p-3.5"><b>Футбольный мяч</b><span className="text-sm text-muted-foreground">1 900 ₽</span><span className="flex h-10 items-center gap-1.5 text-[13px] text-muted-foreground"><Lock size={13} />Дарит Лёша</span></div>
          </div>
          <div className="hidden flex-col overflow-hidden rounded-[18px] border bg-card opacity-55 sm:flex">
            <Cover letter="Л" />
            <div className="flex flex-col gap-1.5 p-3.5"><b>Лего-поезд</b><span className="text-sm text-muted-foreground">6 200 ₽</span><span className="flex h-10 items-center gap-1.5 text-[13px] text-muted-foreground"><Gift size={13} />Уже подарено</span></div>
          </div>
          <div className="flex items-center gap-3.5 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm sm:col-span-3">
            <Gift size={22} className="shrink-0 text-primary" />
            <span className="flex-1"><b>Ура! Вы дарите «Конструктор Вулкан».</b> Тёма не узнает, кто это, — сюрприз сохранится.</span>
            <span className="hidden rounded-lg bg-primary px-3.5 py-1.5 font-bold text-primary-foreground sm:inline">Отлично</span>
          </div>
        </div>
      </Container>
    </section>
  )
}
