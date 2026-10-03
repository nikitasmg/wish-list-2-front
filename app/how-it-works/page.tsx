import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { JsonLd } from '@/components/json-ld'
import { Container, Eyebrow, PrimaryLink, SecondaryLink } from '@/app/(landing)/components/landing-ui'
import { CtaSection } from '@/app/(landing)/components/cta-section'
import {
  BlockPanelMock, BlocksMock, CheckItem, GiftFormMock, ResponsesMock, ShareMock, TemplatePickerMock,
} from '@/app/how-it-works/components/step-mocks'
import { cn } from '@/lib/utils'
import { ArrowRight, CalendarDays, Check, ChevronDown, Gift, Monitor } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import * as React from 'react'

export const metadata: Metadata = {
  title: 'Как это работает — от шаблона до ссылки за один вечер',
  description: 'Как собрать страницу праздника с вишлистом: выберите шаблон, впишите своё, добавьте подарки и отправьте ссылку. Гостям — без регистрации.',
  alternates: {
    canonical: 'https://prosto-namekni.ru/how-it-works',
  },
  openGraph: {
    type: 'article',
    title: 'Как это работает — Просто намекни',
    description: 'Шесть шагов от шаблона до ссылки: программа, место, ответ гостя и вишлист на одной странице',
    url: 'https://prosto-namekni.ru/how-it-works',
  },
}

type Step = {
  id: string
  title: string
  short: string
  time: string
  meta: string
  lead: string
  points: string[]
  mock: React.ReactNode
  note?: React.ReactNode
}

const STEPS: Step[] = [
  {
    id: 's1', short: 'Выберите шаблон', time: '1 мин', meta: 'около минуты',
    title: 'Выберите шаблон под повод',
    lead: 'Восемь готовых страниц: детский и взрослый день рождения, свадьба, юбилей, гендер-пати, вечеринка. В каждой уже есть блоки, тексты-подсказки и цветовая схема.',
    points: ['Впишите, для кого праздник, и дату — шаблон подставит их сам', 'На компьютере можно начать и с чистого листа'],
    mock: <TemplatePickerMock />,
  },
  {
    id: 's2', short: 'Впишите своё', time: '3 мин', meta: 'пара минут',
    title: 'Впишите своё — страница рядом',
    lead: 'Выделите блок — справа откроются его поля: заголовок, пункты программы, адрес, дата. Страница рядом сразу показывает, как это увидят гости.',
    points: ['Всё сохраняется само, любую правку отменит Ctrl + Z', 'Лишний блок можно скрыть — он не пропадёт'],
    mock: <BlockPanelMock />,
  },
  {
    id: 's3', short: 'Соберите из блоков', time: 'по желанию', meta: 'по желанию',
    title: 'Добавьте блоки и соберите ряды',
    lead: 'Наведите между блоками — появится «+». Программа, дресс-код, голосование, плейлист — 14 видов. Тяните блок к краю соседа, и они встанут в один ряд.',
    points: ['Шрифт заголовков, узор фона и схема — в «Оформлении»', 'Любой блок можно спрятать до даты праздника'],
    note: (
      <p className="flex items-start gap-2.5 self-start rounded-xl border border-[#7B5CF0]/35 bg-[#7B5CF0]/10 px-3.5 py-2.5 text-sm text-[#5B3FD0] dark:text-[#C9C2FF]">
        <Monitor size={16} className="mt-0.5 shrink-0" aria-hidden />
        Конструктор — на компьютере. С телефона правятся тексты, порядок блоков, тема и подарки
      </p>
    ),
    // На телефоне конструктор не открывается — и показывать его там незачем.
    mock: <div className="hidden md:block"><BlocksMock /></div>,
  },
  {
    id: 's4', short: 'Добавьте подарки', time: '10 мин', meta: 'минут десять',
    title: 'Добавьте подарки — и одну главную мечту',
    lead: 'Название, цена, ссылка на магазин и фото. Главную мечту гости увидят первой и крупнее остальных.',
    points: ['Фото — перетаскиванием или вставкой из буфера', 'Порядок подарков меняется перетаскиванием', 'Отметьте «Уже подарено» — гости это увидят'],
    mock: <GiftFormMock />,
  },
  {
    id: 's5', short: 'Отправьте ссылку', time: '10 сек', meta: 'десять секунд',
    title: 'Отправьте одну ссылку',
    lead: 'В чат класса, семейную группу или лично. Гостям ничего не нужно устанавливать и регистрироваться — страница просто открывается.',
    points: ['Короткая ссылка, на телефоне — «Поделиться» в любой мессенджер', 'Перед отправкой посмотрите страницу глазами гостя'],
    mock: <ShareMock />,
  },
  {
    id: 's6', short: 'Следите за ответами', time: 'до праздника', meta: 'до самого праздника',
    title: 'Следите за ответами, а не за подарками',
    lead: 'Кто придёт, с кем и сколько будет детей — видно сразу. А подарки вы увидите только как «занято»: кто что дарит, узнаете на празднике.',
    points: ['Срок ответа — гости увидят, до какого числа решить', 'Страницу можно править и после отправки — ссылка не меняется'],
    mock: <ResponsesMock />,
  },
]

const FAQ = [
  { q: 'Это правда бесплатно?', a: 'Да. Шаблоны, конструктор, вишлист, ответы гостей — всё бесплатно, без пробного периода и ограничений по числу гостей.' },
  { q: 'Гостям нужно регистрироваться?', a: 'Нет. Гость открывает ссылку, отвечает на приглашение и бронирует подарок — без аккаунта и приложения. Имя он пишет сам или бронирует анонимно.' },
  { q: 'Я узнаю, кто что дарит?', a: 'Нет — в этом и смысл. Вы видите только, что подарок занят. Гости видят имя того, кто дарит, чтобы не купить то же самое.' },
  { q: 'Можно собрать страницу с телефона?', a: 'С телефона можно создать страницу из шаблона, поправить тексты, порядок блоков, тему и подарки. Конструктор с рядами и новыми блоками открывается на компьютере.' },
  { q: 'Как спрятать блок до праздника?', a: 'У любого блока есть настройка «Секрет до даты»: до праздника гости увидят замок с таймером, а в нужный день блок откроется сам.' },
  { q: 'Можно поменять страницу после отправки?', a: 'Да, правьте сколько угодно: ссылка остаётся той же, гости сразу увидят новую версию. Брони и ответы сохранятся.' },
]

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-background font-manrope text-foreground">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: 'Как собрать страницу праздника с вишлистом',
        description: 'Шесть шагов от шаблона до ссылки на Просто намекни',
        step: STEPS.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.title, text: s.lead })),
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      }} />
      <Header />
      <main>
        <Hero />
        {STEPS.map((step, i) => <StepSection key={step.id} step={step} index={i} />)}
        <GuestsSection />
        <FaqSection />
        <CtaSection title={<>Начните с шаблона —<br />остальное по ходу</>} />
      </main>
      <Footer />
    </div>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(hsl(var(--primary)/0.14)_1.4px,transparent_2px)] [background-size:46px_46px]">
      <div className="pointer-events-none absolute -left-52 top-10 h-[640px] w-[640px] rounded-full bg-[radial-gradient(closest-side,rgba(23,182,214,0.16),transparent)]" aria-hidden />
      <div className="pointer-events-none absolute -right-32 -top-10 h-[700px] w-[700px] rounded-full bg-[radial-gradient(closest-side,rgba(123,92,240,0.2),transparent)]" aria-hidden />
      <Container className="relative grid items-center gap-10 pb-16 pt-8 md:pb-24 md:pt-16 lg:grid-cols-[minmax(0,600px)_minmax(0,1fr)] lg:gap-[72px]">
        <div className="flex flex-col gap-6 md:gap-7">
          <span className="inline-flex h-8 items-center gap-2 self-start rounded-full border px-3 text-xs font-semibold text-foreground/80 md:text-[13px]">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Как это работает
          </span>
          <h1 className="font-unbounded text-[36px] font-extrabold leading-[1.02] tracking-[-0.05em] md:text-[56px] xl:text-[62px]">
            От шаблона до ссылки <span className="text-primary">за&nbsp;один вечер</span>
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground md:text-xl">
            Шесть шагов — и у праздника есть своя страница: программа, место, ответ гостя и вишлист, где подарки не повторяются.
          </p>
          <div className="hidden flex-col gap-3 sm:flex sm:flex-row">
            <PrimaryLink href="/wishlist/create">Собрать страницу<ArrowRight size={18} aria-hidden /></PrimaryLink>
            <SecondaryLink href="/wishlist-for">Смотреть шаблоны</SecondaryLink>
          </div>
        </div>

        <nav aria-label="Шаги" className="flex flex-col gap-1 rounded-3xl border bg-card p-2 shadow-[0_40px_100px_rgba(0,0,0,0.12)] dark:shadow-[0_40px_100px_rgba(0,0,0,0.4)] md:p-6">
          <div className="hidden items-center justify-between px-2.5 pb-3.5 text-[13px] font-bold md:flex">
            <span className="text-muted-foreground">Весь путь</span><span className="text-primary">≈ 15 минут</span>
          </div>
          {STEPS.map((s, i) => (
            <a key={s.id} href={`#${s.id}`} className="group flex items-center gap-3.5 rounded-[14px] px-2.5 py-2.5 transition-colors hover:bg-muted md:py-3">
              <span className="w-[30px] font-unbounded text-[13px] font-extrabold text-muted-foreground group-hover:text-primary md:w-[34px] md:text-[15px]">{String(i + 1).padStart(2, '0')}</span>
              <span className="flex-1 text-[15px] font-bold md:text-base">{s.short}</span>
              <span className="text-xs text-muted-foreground md:text-[13px]">{s.time}</span>
            </a>
          ))}
        </nav>
        <PrimaryLink href="/wishlist/create" className="sm:hidden">Собрать страницу<ArrowRight size={18} aria-hidden /></PrimaryLink>
      </Container>
    </section>
  )
}

function StepSection({ step, index }: { step: Step; index: number }) {
  // Текст и мокап чередуются по сторонам; на телефоне текст всегда сверху.
  const flip = index % 2 === 1
  return (
    <section id={step.id} className={cn('scroll-mt-20 py-14 md:py-24', index % 2 === 0 && 'border-y bg-muted/30')}>
      <Container className={cn('grid items-center gap-8 lg:gap-[72px]', flip ? 'lg:grid-cols-[minmax(0,1fr)_460px]' : 'lg:grid-cols-[460px_minmax(0,1fr)]')}>
        <div className={cn('flex flex-col gap-4 md:gap-5', flip && 'lg:order-2')}>
          <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-4">
            <span className="bg-gradient-to-r from-[#17B6D6] to-[#7B5CF0] bg-clip-text font-unbounded text-[44px] font-extrabold leading-[0.9] tracking-[-0.05em] text-transparent md:text-[84px]">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="text-xs font-bold text-muted-foreground md:text-[13px]"><b className="text-primary">Шаг {index + 1}</b> · {step.meta}</span>
          </div>
          <h2 className="font-unbounded text-[26px] font-extrabold leading-[1.06] tracking-[-0.04em] md:text-[44px]">{step.title}</h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground md:text-lg">{step.lead}</p>
          <ul className="flex flex-col gap-3">{step.points.map(p => <CheckItem key={p}>{p}</CheckItem>)}</ul>
          {step.note}
        </div>
        <div className={cn('min-w-0', flip && 'lg:order-1')}>{step.mock}</div>
      </Container>
    </section>
  )
}

const GUEST_CARDS = [
  {
    icon: Check, tone: 'bg-[#22C3E6]/15 text-[#0E9CBB] dark:text-[#22C3E6]',
    title: 'Отвечает на приглашение', text: 'Придёт ли, с кем, сколько детей, что из меню. Свои вопросы тоже можно задать.',
    demo: <div className="grid grid-cols-2 gap-2 text-[13px]"><span className="flex h-[38px] items-center justify-center rounded-[10px] bg-primary font-bold text-primary-foreground">Придём</span><span className="flex h-[38px] items-center justify-center rounded-[10px] border">Не сможем</span></div>,
  },
  {
    icon: Gift, tone: 'bg-[#7B5CF0]/15 text-[#6A4BE0] dark:text-[#A78BFA]',
    title: 'Бронирует подарок', text: 'Подписывается как хочет или анонимно. Другие гости видят «Дарит Аня» — и не купят то же самое.',
    demo: <span className="flex h-[38px] items-center justify-center gap-1.5 rounded-[10px] border border-primary text-[13px] font-bold text-primary"><Check size={14} />Вы дарите · отменить</span>,
  },
  {
    icon: CalendarDays, tone: 'bg-[#F472B6]/15 text-[#D0438F] dark:text-[#F472B6]',
    title: 'Не забывает про дату', text: 'Добавляет праздник в календарь одним нажатием и строит маршрут до места.',
    demo: <div className="grid grid-cols-2 gap-2 text-[13px]"><span className="flex h-[38px] items-center justify-center rounded-[10px] border">В календарь</span><span className="flex h-[38px] items-center justify-center rounded-[10px] border">Маршрут</span></div>,
  },
]

function GuestsSection() {
  return (
    <section className="border-y bg-muted/30 py-16 md:py-24">
      <Container className="space-y-8 md:space-y-11">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10">
          <div className="space-y-4">
            <Eyebrow>А что у гостей</Eyebrow>
            <h2 className="font-unbounded text-[26px] font-extrabold leading-[1.06] tracking-[-0.04em] md:text-[48px]">Гостю — три нажатия</h2>
          </div>
          <p className="max-w-[440px] text-[15px] leading-relaxed text-muted-foreground md:text-lg">Открыл ссылку, ответил на приглашение, забронировал подарок. Без аккаунта, пароля и приложения.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3 md:gap-5">
          {GUEST_CARDS.map(({ icon: Icon, tone, title, text, demo }) => (
            <article key={title} className="flex gap-3 rounded-[18px] border bg-card p-4 md:flex-col md:gap-3.5 md:rounded-[20px] md:p-[26px]">
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl md:h-11 md:w-11 md:rounded-[14px]', tone)}><Icon size={20} aria-hidden /></span>
              <div className="flex flex-1 flex-col gap-1 md:gap-3.5">
                <h3 className="text-[15px] font-extrabold md:text-[19px]">{title}</h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground md:text-[15px]">{text}</p>
                <div className="hidden md:block" aria-hidden>{demo}</div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}

function FaqSection() {
  return (
    <section className="py-16 md:py-28">
      <Container className="grid gap-8 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-20">
        <div className="flex flex-col gap-4">
          <Eyebrow>Вопросы</Eyebrow>
          <h2 className="font-unbounded text-[26px] font-extrabold leading-[1.06] tracking-[-0.04em] md:text-[48px]">Частые вопросы</h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground md:text-lg">
            Не нашли ответ — загляните в <Link href="/blog" className="font-semibold text-primary hover:underline">блог</Link>, там разбираем праздники по шагам.
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          {FAQ.map((f, i) => (
            <details key={f.q} open={i === 0} className="group rounded-[18px] border border-transparent border-b-border open:border-border open:bg-card">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 text-[15px] font-bold md:min-h-16 md:px-[22px] md:text-[17px] [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown size={18} className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground md:px-[22px] md:pb-5 md:text-[15px]">{f.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  )
}
