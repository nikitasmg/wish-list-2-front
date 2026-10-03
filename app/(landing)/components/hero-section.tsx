import { ArrowRight, Check, Eye, Lock, Star } from 'lucide-react'
import * as React from 'react'
import { Container, MiniCard, MiniLabel, MiniTitle, Pill, PrimaryLink, SecondaryLink } from './landing-ui'

/**
 * Первый экран: обещание и живая страница праздника рядом. Плашки вокруг
 * превью — то, чего раньше не было: ответы гостей, главная мечта, тайна брони
 * и дресс-код с названиями цветов.
 */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(hsl(var(--primary)/0.14)_1.4px,transparent_2px)] [background-size:40px_40px]">
      <div className="pointer-events-none absolute -left-52 top-20 h-[700px] w-[700px] rounded-full bg-[radial-gradient(closest-side,rgba(23,182,214,0.16),transparent)]" aria-hidden />
      <div className="pointer-events-none absolute -right-32 top-0 h-[760px] w-[760px] rounded-full bg-[radial-gradient(closest-side,rgba(123,92,240,0.2),transparent)]" aria-hidden />

      <Container className="relative grid items-center gap-12 pb-16 pt-8 md:pb-24 md:pt-16 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:gap-14">
        <div className="flex flex-col gap-6 md:gap-7">
          <span className="inline-flex h-8 items-center gap-2 self-start rounded-full border px-3 text-xs font-semibold text-foreground/80 md:text-[13px]">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Вишлист и приглашение — одна страница
          </span>
          <h1 className="font-unbounded text-[40px] font-extrabold leading-[1] tracking-[-0.05em] md:text-[56px] md:leading-[1.02] xl:text-[60px]">
            Соберите страницу праздника <span className="text-primary">и&nbsp;просто намекните</span>
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground md:text-xl">
            Программа, место, дресс-код, ответ гостя и вишлист с бронью без регистрации. Из готового шаблона за пару минут — или своими блоками.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <PrimaryLink href="/wishlist/create">Собрать страницу<ArrowRight size={18} aria-hidden /></PrimaryLink>
            <SecondaryLink href="/wishlist-for"><Eye size={18} aria-hidden />Смотреть шаблоны</SecondaryLink>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {['Бесплатно', 'Гостям без регистрации', 'Сюрприз остаётся сюрпризом'].map(text => (
              <li key={text} className="flex items-center gap-1.5"><Check size={16} className="text-primary" aria-hidden />{text}</li>
            ))}
          </ul>
        </div>

        <HeroPreview />
      </Container>
    </section>
  )
}

function Tag({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div className={`absolute z-10 hidden items-center gap-2 whitespace-nowrap rounded-xl border bg-popover px-3.5 py-2 text-sm font-semibold text-popover-foreground shadow-2xl sm:flex ${className}`}>
      {children}
    </div>
  )
}

/** Страница «Тёме — семь!» в схеме «Полночь» — та же, что у гостей. */
function HeroPreview() {
  return (
    <div className="relative mx-auto h-[600px] w-full max-w-[600px] sm:h-[690px]" aria-hidden>
      <div className="demo-scheme wishlist-page look-font-accent look-pattern-stars absolute inset-x-0 top-0 mx-auto h-[590px] w-full max-w-[520px] overflow-hidden rounded-[22px] border bg-background text-foreground shadow-[0_40px_100px_rgba(0,0,0,0.45)] sm:h-[660px]">
        <div className="flex h-9 items-center gap-1.5 border-b bg-card px-3.5">
          <span className="h-2.5 w-2.5 rounded-full bg-border" /><span className="h-2.5 w-2.5 rounded-full bg-border" /><span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="ml-3 text-[11px] text-muted-foreground">prosto-namekni.ru/s/teme-7</span>
        </div>
        <div className="flex flex-col items-center gap-2 px-6 pt-7 text-center">
          <span className="text-xs font-semibold text-primary">суббота, 18 октября · 12:00</span>
          <span className="heading text-[72px] font-extrabold leading-[0.9] text-primary">7</span>
          <span className="heading text-[30px] font-extrabold tracking-tight">Тёме — семь!</span>
          <div className="mt-1 flex gap-5">
            {[['14', 'дней'], ['20', 'часов'], ['32', 'минуты']].map(([v, l]) => (
              <div key={l}><div className="heading text-[22px] font-extrabold">{v}</div><MiniLabel>{l}</MiniLabel></div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-[2fr_1fr] gap-2.5 px-5 pt-5">
          <MiniCard><MiniLabel>Интересы</MiniLabel><MiniTitle>Что Тёма любит</MiniTitle><div className="flex flex-wrap gap-1.5"><Pill>Динозавры</Pill><Pill>Космос</Pill><Pill>Футбол</Pill></div></MiniCard>
          <MiniCard><MiniLabel>Размеры</MiniLabel><MiniTitle>128 · 30</MiniTitle><MiniLabel>рост · обувь</MiniLabel></MiniCard>
        </div>
        <div className="grid grid-cols-3 gap-2.5 px-5 pt-2.5">
          <MiniCard className="p-2.5"><div className="flex h-14 items-center justify-center rounded-lg bg-secondary text-primary"><Star size={18} fill="currentColor" /></div><span className="text-xs font-bold">Раскопки</span><span className="flex h-7 items-center justify-center rounded-lg bg-primary text-[11px] font-bold text-primary-foreground">Забронировать</span></MiniCard>
          <MiniCard className="p-2.5"><div className="h-14 rounded-lg bg-secondary" /><span className="text-xs font-bold">Телескоп</span><span className="flex h-7 items-center justify-center gap-1 rounded-lg border border-primary text-[11px] font-bold text-primary"><Check size={12} />Вы дарите</span></MiniCard>
          <MiniCard className="p-2.5 opacity-55"><div className="h-14 rounded-lg bg-secondary" /><span className="text-xs font-bold">Вулкан</span><span className="flex h-7 items-center justify-center text-[11px] text-muted-foreground">Дарит Аня</span></MiniCard>
        </div>
      </div>
      <Tag className="-right-4 top-[14px]"><Star size={15} className="text-[#FFD166]" fill="currentColor" />Главная мечта — первой</Tag>
      <Tag className="-left-6 top-[636px]"><Check size={16} className="text-primary" />Ответили 12 гостей · 3 ребёнка</Tag>
      <Tag className="-right-6 top-[636px]"><Lock size={15} className="text-[#F472B6]" />Маша не узнает, кто что дарит</Tag>
    </div>
  )
}
