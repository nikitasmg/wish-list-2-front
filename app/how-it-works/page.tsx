import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import Link from 'next/link'
import React from 'react'
import Head from 'next/head'

export default function HowItWorks() {
  const steps = [
    {
      title: 'Регистрация',
      description: 'Создайте аккаунт за 30 секунд через email или социальные сети',
      image: '/screenshots/step-1.jpg',
      direction: 'left',
    },
    {
      title: 'Создайте вишлист',
      description: 'Назовите ваш вишлист и придумайте описание',
      image: '/screenshots/step-2.jpg',
      direction: 'right',
    },
    {
      title: 'Настройте оформление',
      description: 'Выберите цветовую тему, дату и время праздника',
      image: '/screenshots/step-3.jpg',
      direction: 'left',
    },
    {
      title: 'Добавьте подарки',
      description: 'Загрузите фото и придумайте описание',
      image: '/screenshots/step-4.jpg',
      direction: 'right',
    },
    {
      title: 'Поделитесь с друзьями',
      description: 'Отправьте уникальную ссылку или опубликуйте в соцсетях',
      image: '/screenshots/step-5.jpg',
      direction: 'left',
    },
    {
      title: 'Наслаждайтесь',
      description: 'Получайте только нужные подарки!',
      image: '/screenshots/step-6.jpg',
      direction: 'right',
    },
  ]

  return (
    <>
      <Head>
        <title>Как создать вишлист - Пошаговая инструкция | WishMaker</title>
        <meta
          name="description"
          content="Подробное руководство по созданию идеального вишлиста.
                  Узнайте, как быстро настроить и поделиться своим списком желаний"
        />
        <meta
          name="keywords"
          content="как создать вишлист, инструкция вишлист, настройка вишлиста,
                  шаги создания вишлиста, руководство WishMaker"
        />
        <link rel="canonical" href='https://get-my-wishlist.ru/how-it-works' />
        <meta property="og:type" content="article" />
        <meta property="og:title" content="Пошаговая инструкция по созданию вишлиста" />
        <meta property="og:description" content="6 простых шагов к идеальному списку желаний" />
      </Head>
      <Header />
      <div className="min-h-screen bg-background text-foreground font-manrope">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-primary mb-4">
              Как это работает
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Всего 6 простых шагов до вашего идеального вишлиста
            </p>
          </div>
        </section>

        {/* Steps Section */}
        <section className="container mx-auto px-4 pb-16 md:pb-24">
          <div className="relative">
            {/* Vertical line */}
            <div
              className="hidden md:block absolute left-1/2 top-0 w-1 h-full bg-gradient-to-b from-chart-1 to-chart-5 rounded-full" />

            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex flex-col md:flex-row ${step.direction === 'left' ? 'md:flex-row-reverse' : ''} items-center gap-8 mb-16 md:mb-24`}
              >
                {/* Content */}
                <div className="md:w-1/2 space-y-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                      {index + 1}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold">
                      {step.title}
                    </h2>
                  </div>
                  <p className="text-lg text-muted-foreground">
                    {step.description}
                  </p>
                  {index === 0 && (
                    <Link
                      href='/registration'
                      className="block max-w-max mt-4 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                      Начать регистрацию →
                    </Link>
                  )}
                </div>

                {/* Image */}
                <div className="md:w-1/2">
                  <div className="relative bg-card rounded-xl shadow-xl overflow-hidden border">
                    {/*<img*/}
                    {/*  src={step.image}*/}
                    {/*  alt={`Шаг ${index + 1} - ${step.title}`}*/}
                    {/*  className="w-full h-64 md:h-80 object-cover hover:scale-105 transition-transform"*/}
                    {/*/>*/}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/60 p-4">
                    <span className="text-background text-sm">
                      Пример шага {index + 1}
                    </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

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