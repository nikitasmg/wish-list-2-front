'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState, useEffect, KeyboardEvent } from 'react'

const steps: { title: string; description: string; image: string; imageDark: string }[] = [
  {
    title: 'Регистрация',
    description: 'Создайте аккаунт через username или Telegram',
    image: '/screenshots/login.png',
    imageDark: '/screenshots/login-dark.png',
  },
  {
    title: 'Создайте вишлист',
    description: 'Назовите ваш вишлист и придумайте описание',
    image: '/screenshots/create-wishlist.png',
    imageDark: '/screenshots/create-wishlist-dark.png',
  },
  {
    title: 'Настройте оформление',
    description: 'Выберите цветовую тему, дату и время праздника',
    image: '/screenshots/theme.png',
    imageDark: '/screenshots/theme-dark.png',
  },
  {
    title: 'Добавьте подарки',
    description: 'Загрузите фото и придумайте описание',
    image: '/screenshots/gifts.png',
    imageDark: '/screenshots/gifts-dark.png',
  },
  {
    title: 'Поделитесь с друзьями',
    description: 'Отправьте уникальную ссылку или опубликуйте в соцсетях',
    image: '/screenshots/share.png',
    imageDark: '/screenshots/share-dark.png',
  },
  {
    title: 'Наслаждайтесь',
    description: 'Получайте только нужные подарки!',
    image: '/screenshots/wishlist-example.png',
    imageDark: '/screenshots/wishlist-example-dark.png',
  },
]

export function StepperSection() {
  const [active, setActive] = useState(0)
  const stepRefs = useRef<(HTMLButtonElement | null)[]>([])
  const step = steps[active]

  useEffect(() => {
    stepRefs.current[active]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [active])

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowLeft') setActive(a => Math.max(0, a - 1))
    if (e.key === 'ArrowRight') setActive(a => Math.min(steps.length - 1, a + 1))
  }

  return (
    <section className="container mx-auto px-4 pb-16 md:pb-24">
      {/* Stepper bar */}
      <div
        role="tablist"
        onKeyDown={handleKeyDown}
        className="relative flex items-start gap-0 overflow-x-auto pb-4 mb-10 scroll-smooth"
      >
        {/* connecting line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border z-0" />

        {steps.map((s, i) => {
          const isActive = i === active
          const isPast = i < active
          return (
            <button
              key={i}
              role="tab"
              ref={el => { stepRefs.current[i] = el }}
              aria-selected={isActive}
              aria-current={isActive ? 'step' : undefined}
              onClick={() => setActive(i)}
              className="relative z-10 flex flex-col items-center gap-1.5 flex-shrink-0 px-3 focus:outline-none"
            >
              <div className={[
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors bg-background',
                isActive ? 'bg-primary text-primary-foreground border-primary' : '',
                isPast ? 'text-muted-foreground border-muted-foreground' : '',
                !isActive && !isPast ? 'text-muted-foreground border-border' : '',
              ].join(' ')}>
                {i + 1}
              </div>
              <span className={[
                'text-xs font-medium whitespace-nowrap transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              ].join(' ')}>
                {s.title}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content — key triggers fade-in animation on step change */}
      <div
        key={active}
        className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 flex flex-col md:flex-row items-center gap-8"
      >
        {/* Text */}
        <div className="md:w-1/2 space-y-4">
          <span className="block text-7xl font-bold text-primary/15 leading-none select-none">
            {String(active + 1).padStart(2, '0')}
          </span>
          <div aria-live="polite">
            <h2 className="text-3xl font-bold">{step.title}</h2>
            <p className="text-lg text-muted-foreground mt-2">{step.description}</p>
          </div>
          {active === 0 && (
            <Link
              href="/registration"
              className="inline-block mt-4 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Начать регистрацию →
            </Link>
          )}
        </div>

        {/* Screenshot */}
        <div className="w-full md:w-1/2">
          <div className="relative h-[280px] md:h-[420px] rounded-xl shadow-xl overflow-hidden border bg-accent">
            <Image
              src={step.image}
              alt={step.title}
              fill
              style={{ objectFit: 'contain' }}
              className="dark:hidden"
            />
            <Image
              src={step.imageDark}
              alt={step.title}
              fill
              style={{ objectFit: 'contain' }}
              className="hidden dark:block"
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-8 justify-center">
        <button
          onClick={() => setActive(a => a - 1)}
          disabled={active === 0}
          className="px-5 py-2 rounded-lg border font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Назад
        </button>
        <button
          onClick={() => setActive(a => a + 1)}
          disabled={active === steps.length - 1}
          className="px-5 py-2 rounded-lg border font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Вперёд →
        </button>
      </div>
    </section>
  )
}
