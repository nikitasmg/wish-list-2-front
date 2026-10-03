import { Pencil } from 'lucide-react'
import * as React from 'react'
import { Container, Eyebrow, MiniCard, MiniLabel, Pill, PrimaryLink, SecondaryLink } from './landing-ui'

/** «С телефона»: конструктор — на компьютере, правка — где угодно. */
export function PhoneSection() {
  return (
    <section className="py-20 md:py-28">
      <Container className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-16">
        <div className="flex flex-col gap-5">
          <Eyebrow>С телефона</Eyebrow>
          <h2 className="font-unbounded text-[30px] font-extrabold leading-[1.05] tracking-[-0.04em] md:text-[52px]">Поправить текст можно и в метро</h2>
          <p className="text-base leading-relaxed text-muted-foreground md:text-[19px]">
            Конструктор живёт на компьютере, а с телефона правятся тексты, порядок блоков, тема и подарки. Гостям страница всегда открывается как надо — ряды сами встают друг под другом.
          </p>
          <div className="hidden flex-wrap gap-2.5 md:flex">
            {['Тексты и порядок', 'Тема', 'Подарки шторкой'].map(t => <span key={t} className="rounded-full border px-3 py-1.5 text-[13px] font-semibold">{t}</span>)}
          </div>
        </div>

        <div className="flex justify-center gap-5" aria-hidden>
          <div className="flex h-[500px] w-[236px] flex-col gap-2.5 rounded-[40px] border-8 border-border bg-background p-4 text-[11px]">
            <b className="text-sm">Маше — 30!</b>
            <div className="flex rounded-lg border p-0.5 font-bold">
              <span className="flex h-6 flex-1 items-center justify-center rounded-md bg-[#7B5CF0] text-white">Страница</span>
              <span className="flex h-6 flex-1 items-center justify-center text-muted-foreground">Подарки</span>
              <span className="flex h-6 flex-1 items-center justify-center text-muted-foreground">Тема</span>
            </div>
            <div className="rounded-xl border p-2.5"><span className="text-muted-foreground">Обложка</span><div className="text-[13px] font-bold">Маше — 30!</div></div>
            <div className="flex flex-col gap-1.5 rounded-xl border border-primary p-2.5">
              <span className="text-muted-foreground">Текст</span><b className="text-[13px]">Привет, это Маша</b>
              <div className="h-14 rounded-lg border p-1.5 text-foreground/80">Мне исполняется тридцать…</div>
              <div className="flex items-center justify-between"><span>Показывать</span><span className="h-3.5 w-6 rounded-full bg-primary" /></div>
            </div>
            <div className="flex items-center justify-between rounded-xl border p-2.5"><span><span className="block text-muted-foreground">Место</span><b className="text-[13px]">Лофт «Веранда»</b></span><Pencil size={14} className="text-muted-foreground" /></div>
            <div className="mt-auto flex h-9 items-center justify-center rounded-xl bg-gradient-to-r from-[#17B6D6] to-[#7B5CF0] text-[13px] font-bold text-white">Поделиться</div>
          </div>
          <div className="demo-scheme wishlist-page look-font-accent mt-16 hidden h-[500px] w-[236px] flex-col gap-2.5 rounded-[40px] border-8 border-border bg-background p-4 text-foreground sm:flex">
            <span className="text-center text-[10px] text-primary">суббота, 18 октября</span>
            <span className="heading text-center text-[22px] font-extrabold">Тёме — семь!</span>
            <MiniCard className="p-2.5"><MiniLabel>Интересы</MiniLabel><div className="flex flex-wrap gap-1"><Pill>Космос</Pill><Pill>Футбол</Pill></div></MiniCard>
            <MiniCard className="p-2.5"><MiniLabel>Размеры</MiniLabel><b>128 · 30</b></MiniCard>
            <MiniCard className="p-2.5"><div className="flex h-[70px] items-center justify-center rounded-lg bg-secondary font-extrabold text-primary">★</div><span className="text-xs font-bold">Раскопки динозавра</span><span className="flex h-7 items-center justify-center rounded-lg bg-primary text-[11px] font-bold text-primary-foreground">Забронировать</span></MiniCard>
          </div>
        </div>
      </Container>
    </section>
  )
}

export function CtaSection() {
  return (
    <section className="pb-20 md:pb-28">
      <Container>
        <div className="relative flex flex-col items-start gap-5 overflow-hidden rounded-[28px] border bg-gradient-to-br from-[#0F3B4A] to-[#2A1F5C] px-6 py-9 text-white md:items-center md:gap-6 md:rounded-[32px] md:py-20 md:text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.12)_1.4px,transparent_2px)] [background-size:34px_34px]" aria-hidden />
          <h2 className="relative font-unbounded text-[32px] font-extrabold leading-[1.05] tracking-[-0.04em] md:text-[58px]">Праздник уже скоро.<br />Намекните заранее</h2>
          <p className="relative text-white/75 md:text-[19px]">Бесплатно. Гостям ничего устанавливать не нужно.</p>
          <div className="relative flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <PrimaryLink href="/wishlist/create" className="bg-none bg-white text-[#070B16]">Собрать страницу</PrimaryLink>
            <SecondaryLink href="/wishlist-for/birthday" className="hidden border-white/20 bg-black/30 text-white sm:inline-flex">Смотреть пример</SecondaryLink>
          </div>
        </div>
      </Container>
    </section>
  )
}
