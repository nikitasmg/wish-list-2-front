import { Pencil } from 'lucide-react'
import * as React from 'react'
import { Container, EXAMPLE, ExampleBadge, Eyebrow, MiniCard, MiniLabel, Pill, PrimaryLink, SecondaryLink } from './landing-ui'

/** «С телефона»: конструктор — на компьютере, правка — где угодно. */
export function PhoneSection() {
  return (
    <section className="py-20 md:py-28">
      <Container className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-16">
        <div className="flex flex-col gap-5">
          <Eyebrow>С телефона</Eyebrow>
          <h2 className="font-unbounded text-title-lg font-extrabold md:text-display-md">Поправить текст можно и в метро</h2>
          <p className="text-lead leading-relaxed text-muted-foreground">
            Конструктор живёт на компьютере, а с телефона правятся тексты, порядок блоков, тема и подарки. Гостям страница всегда открывается как надо — ряды сами встают друг под другом.
          </p>
          <div className="hidden flex-wrap gap-2.5 md:flex">
            {['Тексты и порядок', 'Тема', 'Подарки шторкой'].map(t => <span key={t} className="rounded-full border px-3 py-1.5 text-label font-semibold">{t}</span>)}
          </div>
        </div>

        <div className={`relative flex justify-center gap-5 pt-9 ${EXAMPLE}`} aria-hidden>
          <ExampleBadge className="absolute left-1/2 top-0 -translate-x-1/2">Пример редактора</ExampleBadge>
          <div className="flex h-[500px] w-[236px] flex-col gap-2.5 rounded-sheet border-8 border-border bg-background p-4 text-micro">
            <b className="text-body-sm">Маше — 30!</b>
            <div className="flex rounded-control-lg border p-0.5 font-bold">
              <span className="flex h-6 flex-1 items-center justify-center rounded-control bg-brand-violet text-white">Страница</span>
              <span className="flex h-6 flex-1 items-center justify-center text-muted-foreground">Подарки</span>
              <span className="flex h-6 flex-1 items-center justify-center text-muted-foreground">Тема</span>
            </div>
            <div className="rounded-control-lg border p-2.5"><span className="text-muted-foreground">Обложка</span><div className="text-label font-bold">Маше — 30!</div></div>
            <div className="flex flex-col gap-1.5 rounded-control-lg border border-primary p-2.5">
              <span className="text-muted-foreground">Текст</span><b className="text-label">Привет, это Маша</b>
              <div className="h-14 rounded-control-lg border p-1.5 text-foreground/80">Мне исполняется тридцать…</div>
              <div className="flex items-center justify-between"><span>Показывать</span><span className="h-3.5 w-6 rounded-full bg-primary" /></div>
            </div>
            <div className="flex items-center justify-between rounded-control-lg border p-2.5"><span><span className="block text-muted-foreground">Место</span><b className="text-label">Лофт «Веранда»</b></span><Pencil size={14} className="text-muted-foreground" /></div>
            <div className="mt-auto flex h-9 items-center justify-center rounded-control bg-gradient-to-r from-brand-sky to-brand-violet text-label font-bold text-white">Поделиться</div>
          </div>
          <div className="demo-scheme wishlist-page look-font-accent mt-16 hidden h-[500px] w-[236px] flex-col gap-2.5 rounded-sheet border-8 border-border bg-background p-4 text-foreground sm:flex">
            <span className="text-center text-micro text-primary">суббота, 18 октября</span>
            <span className="heading text-center text-title font-extrabold">Тёме — семь!</span>
            <MiniCard className="p-2.5"><MiniLabel>Интересы</MiniLabel><div className="flex flex-wrap gap-1"><Pill>Космос</Pill><Pill>Футбол</Pill></div></MiniCard>
            <MiniCard className="p-2.5"><MiniLabel>Размеры</MiniLabel><b>128 · 30</b></MiniCard>
            <MiniCard className="p-2.5"><div className="flex h-[70px] items-center justify-center rounded-control-lg bg-secondary font-extrabold text-primary">★</div><span className="text-caption font-bold">Раскопки динозавра</span><span className="flex h-7 items-center justify-center rounded-control-lg bg-primary text-micro font-bold text-primary-foreground">Забронировать</span></MiniCard>
          </div>
        </div>
      </Container>
    </section>
  )
}

/** Финальный призыв; заголовок свой у каждой страницы. */
export function CtaSection({ title = <>Праздник уже скоро.<br />Намекните заранее</> }: { title?: React.ReactNode }) {
  return (
    <section className="pb-20 md:pb-28">
      <Container>
        <div className="relative flex flex-col items-start gap-5 overflow-hidden rounded-sheet border bg-hero-night px-6 py-9 text-white md:items-center md:gap-6 md:py-20 md:text-center">
          <div className="pointer-events-none absolute inset-0 bg-dots bg-[length:34px_34px]" aria-hidden />
          <h2 className="relative font-unbounded text-title-lg font-extrabold md:text-display-md">{title}</h2>
          <p className="relative text-white/75 md:text-lead">Бесплатно. Гостям ничего устанавливать не нужно.</p>
          <div className="relative flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <PrimaryLink href="/wishlist/create" className="bg-none bg-white text-brand-night">Собрать страницу</PrimaryLink>
            <SecondaryLink href="/wishlist-for" className="hidden border-white/20 bg-black/30 text-white sm:inline-flex">Смотреть шаблоны</SecondaryLink>
          </div>
        </div>
      </Container>
    </section>
  )
}
