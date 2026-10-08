import { JsonLd } from '@/components/json-ld'
import { Button } from '@/components/ui/button'
import { MAIN_ORIGIN, SANTA_ORIGIN, santaHref } from '@/shared/santa-route'
import { Check, Gift, ListChecks } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { SampleEnvelope } from './components/sample-envelope'

const LANDING_URL = SANTA_ORIGIN ? `${SANTA_ORIGIN}/` : 'https://santa.prosto-namekni.ru/'

export const metadata: Metadata = {
  title: { absolute: 'Тайный Санта онлайн — жеребьёвка без бумажек | Просто намекни' },
  description:
    'Бесплатная онлайн-жеребьёвка Тайного Санты для офиса, семьи и друзей: комната по ссылке, пожелания и вишлисты, результат в Telegram или на почту, анонимный чат с подопечным.',
  alternates: { canonical: LANDING_URL },
  openGraph: {
    type: 'website',
    url: LANDING_URL,
    title: 'Тайный Санта онлайн — без бумажек в шапке',
    description: 'Соберите своих в комнату — мы тайно распределим, кто кому дарит, и сообщим каждому.',
    siteName: 'Просто намекни',
    locale: 'ru_RU',
  },
}

const STEPS = [
  { n: '01', tone: 'text-tone-pink', title: 'Создайте комнату', text: 'Название, бюджет и дата обмена. Жеребьёвку запустите сами или назначьте на день и час.' },
  { n: '02', tone: 'text-tone-gold', title: 'Позовите своих', text: 'Отправьте ссылку или QR-код. Каждый пишет имя, пожелания и выбирает, куда прислать результат: Telegram или почта.' },
  { n: '03', tone: 'text-success', title: 'Жеребьёвка', text: 'Пары складываются в один круг: каждый дарит одному и получает от другого. Себя не вытянуть.' },
  { n: '04', tone: 'text-tone-cyan', title: 'Узнайте подопечного', text: 'Придёт сообщение: кому вы дарите и что он любит. Уточнить размер можно в анонимном чате.' },
] as const

const FAQ = [
  {
    q: 'Это бесплатно?',
    a: 'Да. Комнаты, жеребьёвка, уведомления и анонимный чат бесплатны. В одной комнате — до 100 участников.',
  },
  {
    q: 'Участникам нужно регистрироваться?',
    a: 'Нет. Участник вступает по ссылке и получает личную ссылку на свою карточку. Аккаунт нужен только организатору.',
  },
  {
    q: 'Как участник узнает, кому дарит?',
    a: 'Каждый подключает Telegram-бота или подтверждает почту. Сразу после жеребьёвки туда придёт имя подопечного и его пожелания; то же видно в конверте по ссылке.',
  },
  {
    q: 'Организатор увидит пары?',
    a: 'Нет. Пары тайные для всех, включая организатора. Он видит только, кто готов к жеребьёвке и сколько подарков уже готово.',
  },
  {
    q: 'Можно задать подопечному вопрос?',
    a: 'Да, в анонимном чате на странице комнаты или ответом на сообщение бота. Подопечный не узнает, кто вы, пока не придёт время дарить.',
  },
  {
    q: 'Что если кто-то присоединится позже?',
    a: 'Пока жеребьёвки не было, вступить может любой по ссылке. После неё состав не меняется — организатор может перезапустить жеребьёвку, и все получат новых подопечных.',
  },
] as const

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Тайный Санта — Просто намекни',
    url: LANDING_URL,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Any',
    inLanguage: 'ru',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'RUB' },
    publisher: { '@type': 'Organization', name: 'Просто намекни', url: MAIN_ORIGIN },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  },
]

export default function SantaLanding() {
  return (
    <div className="space-y-20">
      {jsonLd.map(data => <JsonLd key={String(data['@type'])} data={data} />)}

      <section className="santa-snow -mx-4 grid items-center gap-12 px-4 py-16 md:-mx-16 md:grid-cols-2 md:px-16 md:py-24">
        <div className="space-y-7">
          <p className="text-eyebrow uppercase text-tone-gold">Новый год · офис · семья · друзья</p>
          <h1 className="text-display-sm md:text-display">
            Тайный Санта
            <br />
            <span className="text-primary">без бумажек</span>
            <br />
            в шапке
          </h1>
          <p className="max-w-xl text-body-lg text-muted-foreground">
            Соберите своих в комнату. Каждый напишет, что хочет получить, а мы тайно распределим пары
            и сообщим каждому, кому он дарит, — в Telegram или на почту.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="festive" size="xl">
              <Link href={santaHref('/rooms/new')}>
                <Gift aria-hidden />
                Создать комнату
              </Link>
            </Button>
            <Button asChild variant="secondary" size="xl">
              <a href="#how">Как это работает</a>
            </Button>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-body-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Check className="size-4 text-success" aria-hidden />Участникам не нужна регистрация</li>
            <li className="flex items-center gap-2"><Check className="size-4 text-success" aria-hidden />Никто не вытянет сам себя</li>
          </ul>
        </div>
        <SampleEnvelope />
      </section>

      <section id="how" className="scroll-mt-24 space-y-8" aria-labelledby="how-title">
        <h2 id="how-title" className="text-title-lg md:text-display-md">Четыре шага до праздника</h2>
        <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(step => (
            <li key={step.n} className="space-y-3 rounded-card border border-border bg-card p-7">
              <span className={`block text-display-sm ${step.tone}`}>{step.n}</span>
              <h3 className="text-title-sm">{step.title}</h3>
              <p className="text-body text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-6 rounded-sheet border border-border bg-card p-8 md:flex-row md:items-center md:gap-10 md:p-10">
        <span className="flex size-control-xl shrink-0 items-center justify-center rounded-card bg-tone-cyan/15 text-tone-cyan">
          <ListChecks className="size-7" aria-hidden />
        </span>
        <div className="flex-1 space-y-2">
          <h2 className="text-title">Уже есть вишлист в «Просто намекни»?</h2>
          <p className="text-body text-muted-foreground">
            Приложите его к пожеланиям — Санта увидит конкретные подарки и сможет тайно забронировать один из них.
          </p>
        </div>
        <Button asChild variant="secondary" size="lg">
          <a href={`${MAIN_ORIGIN}/wishlist`}>Мои вишлисты</a>
        </Button>
      </section>

      <section className="space-y-8" aria-labelledby="faq-title">
        <h2 id="faq-title" className="text-title-lg md:text-display-md">Вопросы</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {FAQ.map(item => (
            <details key={item.q} className="group rounded-card border border-border bg-card p-6">
              <summary className="cursor-pointer list-none text-title-xs marker:hidden">{item.q}</summary>
              <p className="mt-3 text-body text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center gap-6 py-10 text-center">
        <h2 className="text-title-lg md:text-display-md">Соберите своих до праздников</h2>
        <p className="max-w-xl text-body-lg text-muted-foreground">Комната создаётся за пару минут, а ссылку можно отправить в общий чат прямо сейчас.</p>
        <Button asChild variant="festive" size="xl">
          <Link href={santaHref('/rooms/new')}>
            <Gift aria-hidden />
            Создать комнату
          </Link>
        </Button>
      </section>
    </div>
  )
}
