import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { WishlistExample } from '@/components/wishlist-example'
import { PlusIcon } from 'lucide-react'
// import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>WishMaker - Создавайте красивые вишлисты бесплатно</title>
        <meta
          name="description"
          content="Бесплатный сервис для создания вишлистов с индивидуальным дизайном.
                  Добавляйте подарки, настраивайте стиль и делитесь с друзьями!"
        />
        <meta
          name="keywords"
          content="вишлист, список желаний, подарки, создать вишлист, бесплатный вишлист,
                  онлайн вишлист, поделиться вишлистом"
        />
        <link rel="canonical" href="https://get-my-wishlist.ru" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="GetWishLIst - Ваш идеальный вишлист" />
        <meta property="og:description" content="Создайте и настройте персональный вишлист за минуту" />
        <meta name="google-site-verification" content="TCCUJdCGgoWQ8fzYxNHPw0CIz_7g880Qb6hEZiWGUd0" />
      </Head>
      <Header />
      <div className="min-h-screen bg-background text-foreground font-manrope">
        {/* Hero Section с анимацией */}
        <section className="container mx-auto px-4 py-8 md:py-24">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <div className="flex items-center gap-3 mb-4 bg-accent/20 px-4 py-2 rounded-full w-fit">
                <span className="text-chart-1">🎁</span>
                <span className="text-sm font-semibold">Бесплатно навсегда!</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-primary mb-6 leading-tight">
                Создавай вишлисты,<br />
                <span className="bg-gradient-to-r from-chart-1 to-chart-5 bg-clip-text text-transparent">
                которые хочется исполнить
              </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
                Персонализируй список желаний, добавляй подарки из любых магазинов и
                делись с друзьями красивой страницей. Мечты должны сбываться!
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href='/wishlist'
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold transition-all hover:bg-primary/90 hover:scale-105 shadow-lg">
                  Создать
                  <PlusIcon />
                </Link>
                <Link
                  href='/how-it-works'
                  className="border-2 border-primary text-primary px-8 py-4 rounded-lg font-semibold hover:bg-accent/50 transition-colors flex items-center gap-2">
                  <span>Как это работает?</span>
                </Link>
              </div>
            </div>

            <div className="w-full md:w-1/2 mt-8 md:mt-0 relative">
              <WishlistExample/>
              <div className="hidden md:block absolute -top-12 -left-20 w-48 h-48 bg-chart-4/20 rounded-full blur-xl" />
              <div
                className="hidden md:block absolute -bottom-12 -right-20 w-48 h-48 bg-chart-5/20 rounded-full blur-xl" />
            </div>
          </div>
        </section>

        {/* Секция преимуществ с иконками */}
        <section className="bg-popover py-4 md:py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-4 md:gap-8">
              {[
                { icon: '💎', title: 'Бесплатно', text: 'Никаких скрытых платежей' },
                { icon: '🎨', title: 'Кастомизация', text: 'Несколько вариантов оформления' },
                { icon: '🔗', title: 'Простая ссылка', text: 'Делитесь одним кликом' },
                { icon: '🛍️', title: 'Интеграции', text: 'Добавляйте из любых магазинов' },
              ].map((feature, index) => (
                <div key={index} className="text-center p-2 md:p-6">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Секция примеров */}
        {/*<section className="py-16 md:py-24">*/}
        {/*  <div className="container mx-auto px-4">*/}
        {/*    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">*/}
        {/*      Примеры вишлистов*/}
        {/*    </h2>*/}
        {/*    <div className="grid md:grid-cols-3 gap-8">*/}
        {/*      {[ 1, 2, 3 ].map((i) => (*/}
        {/*        <div key={i} className="group relative overflow-hidden rounded-2xl shadow-lg">*/}
        {/*          <img*/}
        {/*            src={`/examples/example-${i}.jpg`}*/}
        {/*            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"*/}
        {/*            alt={`Пример вишлиста ${i}`}*/}
        {/*          />*/}
        {/*          <div*/}
        {/*            className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent flex items-end p-6">*/}
        {/*            <div className="text-background">*/}
        {/*              <h3 className="font-bold text-lg mb-2">Тематический пример #{i}</h3>*/}
        {/*              <button*/}
        {/*                className="border-2 border-background px-4 py-2 rounded-lg hover:bg-background/20 transition-colors">*/}
        {/*                Посмотреть пример*/}
        {/*              </button>*/}
        {/*            </div>*/}
        {/*          </div>*/}
        {/*        </div>*/}
        {/*      ))}*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*</section>*/}

        {/* Секция отзывов */}
        {/*<section className="bg-card py-16">*/}
        {/*  <div className="container mx-auto px-4">*/}
        {/*    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">*/}
        {/*      Отзывы пользователей*/}
        {/*    </h2>*/}
        {/*    <div className="grid md:grid-cols-2 gap-8">*/}
        {/*      {[*/}
        {/*        {*/}
        {/*          name: 'Анна, 28 лет',*/}
        {/*          text: 'С помощью WishMaker смогла организовать свой идеальный свадебный вишлист. Все гости были в восторге от удобства!',*/}
        {/*          avatar: 1*/}
        {/*        },*/}
        {/*        {*/}
        {/*          name: 'Максим, 35 лет',*/}
        {/*          text: 'Лучший сервис для создания списков подарков на день рождения. Теперь друзья всегда знают, что подарить!',*/}
        {/*          avatar: 2*/}
        {/*        },*/}
        {/*      ].map((review, index) => (*/}
        {/*        <div key={index} className="bg-popover p-8 rounded-xl">*/}
        {/*          <div className="flex items-center gap-4 mb-4">*/}
        {/*            <img*/}
        {/*              src={`/avatars/user-${review.avatar}.jpg`}*/}
        {/*              className="w-12 h-12 rounded-full"*/}
        {/*              alt={review.name}*/}
        {/*            />*/}
        {/*            <div>*/}
        {/*              <h4 className="font-bold">{review.name}</h4>*/}
        {/*              <div className="flex text-chart-5">*/}
        {/*                ★★★★★*/}
        {/*              </div>*/}
        {/*            </div>*/}
        {/*          </div>*/}
        {/*          <p className="text-muted-foreground">{review.text}</p>*/}
        {/*        </div>*/}
        {/*      ))}*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*</section>*/}

        {/* Финальный CTA */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-chart-2 to-chart-4">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto text-background">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Начни прямо сейчас!
              </h2>
              <p className="mb-8 text-lg">
                Создай свой первый вишлист бесплатно — это займет меньше минуты
              </p>
              <Link
                href='/wishlist'
                className="bg-background text-foreground px-12 py-4 rounded-xl font-bold text-lg hover:bg-background/90 transition-colors shadow-xl">
                Попробовать бесплатно  →
              </Link>
            </div>
          </div>
        </section>
        <Footer/>
      </div>
    </>
  )
}
