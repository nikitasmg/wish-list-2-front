'use client'

import { useApiGetAllPresents } from '@/api/present'
import { useApiGetMe } from '@/api/user'
import { useApiGetWishlistById } from '@/api/wishlist'
import { PresentItem } from '@/app/[userId]/[wishlistId]/components/present-item'
import { cn } from '@/lib/utils'
import { toDate } from 'date-fns'
import Image from 'next/image'
import { useParams } from 'next/navigation'
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

  if (!wishlist) {
    return null
  }

  return (
    <div className={cn('w-screen min-h-screen bg-background px-2 pt-2 md:px-5', wishlist.settings.colorScheme)}>
      <div className="text-5xl font-bold text-primary mb-4">
        Добро пожаловать в мой вишлист!
      </div>
      {
        wishlist?.cover &&
        <Image className="rounded-2xl" src={wishlist.cover} alt="wishlist-cover" width={400} height={400} />
      }
      <div className="flex flex-col py-5">
        <div className="flex flex-col-reverse gap-6 md:flex-row md:justify-between mb-4">
          <div
            className="text-5xl font-bold text-primary flex flex-col gap-4 justify-between md:justify-start col-auto">

            <div className="text-4xl text-card-foreground flex flex-wrap items-center">
              Приглашаю вас на свой праздник -
              <div className="text-primary text-5xl">{`"${wishlist.title}"`}</div>
            </div>
          </div>
        </div>
        {
          wishlist?.description && <div className="mb-4 whitespace-pre-wrap">
            <div className="text-4xl text-primary font-bold mb-4">Что вас ждет?</div>
            <div className="text-2xl text-foreground">
              {wishlist?.description}
            </div>
          </div>
        }
        {
          (wishlist?.location.time || wishlist.location.name) &&
          <div className="flex flex-col gap-2 text-foreground text-xl">
            <div className="text-4xl text-primary font-bold mb-2">Где и когда?</div>
            {
              wishlist.location.time && <div>
                Дата - {toDate((wishlist.location.time)).toLocaleDateString()}
              </div>
            }

            {
              wishlist.location.name && <div>
                Место - {wishlist.location.link ?
                <a className="text-primary underline" href={wishlist.location.link} rel="nofollow"
                   target="_blank">{wishlist.location.name}</a> :
                <span>{wishlist.location.name}</span>}
              </div>
            }

          </div>
        }
      </div>
      <div className="text-4xl text-primary font-bold mb-2">А вот и мой список подарков:</div>
      <div className="flex flex-wrap gap-5 py-5">
        {
          presents?.map(present =>
            <PresentItem
              key={present.id}
              present={present}
              theme={wishlist.settings.colorScheme}
              isHidden={isPresentHidden}
            />,
          )
        }
      </div>
    </div>
  )
}