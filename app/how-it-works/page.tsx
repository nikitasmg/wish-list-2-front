import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { JsonLd } from '@/components/json-ld'
import Link from 'next/link'
import React from 'react'
import type { Metadata } from 'next'
import { StepperSection } from './stepper-section'

export const metadata: Metadata = {
  title: 'Как создать вишлист — Пошаговая инструкция',
  description: 'Подробное руководство по созданию идеального вишлиста. Узнайте, как быстро настроить и поделиться своим списком желаний за 6 шагов.',
  alternates: {
    canonical: 'https://prosto-namekni.ru/how-it-works',
  },
  openGraph: {
    type: 'article',
    title: 'Как создать вишлист — Пошаговая инструкция',
    description: '6 простых шагов к идеальному списку желаний',
    url: 'https://prosto-namekni.ru/how-it-works',
  },
}

export default function HowItWorks() {
  return (
    <>
      <Header />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: 'Как создать вишлист',
        description: 'Пошаговая инструкция по созданию вишлиста на Просто намекни',
        step: [
          { '@type': 'HowToStep', position: 1, name: 'Регистрация', text: 'Создайте аккаунт через username или Telegram' },
          { '@type': 'HowToStep', position: 2, name: 'Создайте вишлист', text: 'Назовите ваш вишлист и придумайте описание' },
          { '@type': 'HowToStep', position: 3, name: 'Настройте оформление', text: 'Выберите цветовую тему, дату и время праздника' },
          { '@type': 'HowToStep', position: 4, name: 'Добавьте подарки', text: 'Загрузите фото и придумайте описание' },
          { '@type': 'HowToStep', position: 5, name: 'Поделитесь с друзьями', text: 'Отправьте уникальную ссылку или опубликуйте в соцсетях' },
          { '@type': 'HowToStep', position: 6, name: 'Наслаждайтесь', text: 'Получайте только нужные подарки!' },
        ],
      }} />
      <div className="min-h-screen bg-background text-foreground font-manrope">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-primary mb-4">
              Как создать вишлист
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Всего 6 простых шагов до вашего идеального вишлиста
            </p>
          </div>
        </section>

        <StepperSection />

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-chart-2 to-chart-4 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto text-background">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Готовы начать?
              </h2>
              <p className="mb-8 text-lg">
                Создайте свой первый вишлист прямо сейчас
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href='/wishlist'
                  className="bg-background text-foreground px-8 py-4 rounded-lg font-semibold hover:bg-background/90 transition-colors shadow-lg">
                  Попробовать бесплатно
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Footer/>
      </div>
    </>
  )
}
