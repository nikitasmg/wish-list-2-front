'use client'

import { useApiGetAllPresents } from '@/api/present'
import { useApiGetMe } from '@/api/user'
import { useApiGetWishlistById } from '@/api/wishlist'
import { PresentItem } from '@/app/[userId]/[wishlistId]/components/present-item'
import { cn } from '@/lib/utils'
import { toDate } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { MapPinIcon, CalendarIcon } from 'lucide-react'
import { useEffect } from 'react'
import * as React from 'react'

export default function Page() {
  const { wishlistId } = useParams()

  const { data: presentsData } = useApiGetAllPresents(wishlistId as string)

  const { data } = useApiGetWishlistById(wishlistId as string)

  const { data: userData } = useApiGetMe()

  const wishlist = data?.data
  const presents = presentsData?.data
  const isMyWishlist = userData?.user.id === wishlist?.userId
  const isPresentHidden = (isMyWishlist && !wishlist?.settings.showGiftAvailability)

  useEffect(() => {
    if (typeof window !== 'undefined' && document.body.classList) {
      const colorScheme = wishlist?.settings?.colorScheme;
      if (colorScheme) {
        document.body.classList.add(colorScheme)
      }
      return () => {
        if (colorScheme)
        document.body.classList.remove(colorScheme)
      };
    }
  }, [wishlist]);

  if (!wishlist) {
    return null
  }

  return (
    <div className={cn('min-h-screen bg-background relative overflow-hidden', wishlist.settings.colorScheme)}>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-16">
        {/* Шапка с обложкой */}
        <div className="grid md:grid-cols-[1fr_400px] gap-8 items-start">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-black text-primary leading-[0.9]">
              Добро пожаловать в мой вишлист!
            </h1>

            <div className="text-2xl md:text-3xl font-medium text-muted-foreground max-w-2xl">
              Приглашаю вас на праздник —<br />
              <span className="text-primary font-bold italic text-4xl md:text-5xl">&#34;{wishlist.title}&#34;</span>
            </div>
          </div>

          {
            wishlist?.cover &&
            <Image className="rounded-2xl" src={wishlist.cover} alt="wishlist-cover" width={400} height={400} />
          }
        </div>

        {/* Основной контент - диагональная компоновка */}
        <div className="relative space-y-20 whitespace-pre-wrap">
          {/* Описание */}
          {wishlist?.description && (
            <div className="relative pl-8 md:pl-12 border-l-4 border-accent">
              <div className="text-xl md:text-2xl leading-relaxed text-foreground space-y-4 max-w-3xl">
                {wishlist.description}
              </div>
            </div>
          )}

          {/* Детали мероприятия */}
          {(wishlist?.location.time || wishlist.location.name) && (
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="sticky top-24 space-y-4 md:space-y-6">
                <h2 className="text-3xl md:text-5xl font-bold text-primary">
                  Где и когда?
                </h2>
                <div className="w-32 h-2 bg-accent rounded-full" />
              </div>

              <div className="space-y-8 bg-card p-8 rounded-3xl shadow-lg">
                {wishlist.location.time && (
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-xl font-medium text-foreground">
                      {toDate(wishlist.location.time).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                )}

                {wishlist.location.name && (
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <MapPinIcon className="w-6 h-6 text-primary" />
                    </div>
                    {wishlist.location.link ? (
                      <a
                        href={wishlist.location.link}
                        className="text-xl font-medium text-primary hover:text-accent transition-colors underline underline-offset-4"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {wishlist.location.name}
                      </a>
                    ) : (
                      <span className="text-xl font-medium">{wishlist.location.name}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Список подарков */}
          <div className="space-y-12">
            <div className="flex flex-col justify-between items-start gap-4 md:gap-6 max-w-max">
              <h2 className="text-3xl md:text-5xl font-bold text-primary">
                Желанные подарки
              </h2>
              <div className="w-24 md:w-40 h-2 bg-accent rounded-full ml-auto" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {presents?.map(present => (
                <PresentItem
                  key={present.id}
                  present={present}
                  theme={wishlist.settings.colorScheme}
                  isHidden={isPresentHidden}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <footer className="bg-secondary text-secondary-foreground py-3">
        <div className="mx-auto flex items-center justify-between container px-4 text-center w-full">
          <div className="flex-col border-t border-secondary/20 text-xs md:text-xl">
            <p>Создано с помощью сервиса <Link href='/' className='underline'>GetWishlist</Link></p>
          </div>
          <Link
            href='/'
            className="bg-background text-foreground px-12 py-4 rounded-xl font-bold text-lg hover:bg-background/90 transition-colors shadow-xl">
            Хочу такой же вишлист!
          </Link>
        </div>
      </footer>
    </div>
  )
}