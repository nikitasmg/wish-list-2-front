'use client'

import { useApiGetWishlistById } from '@/api/wishlist'
import { PresentsPage } from '@/app/[userId]/[wishlistId]/components/presents-page'
import { toDate } from 'date-fns'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import * as React from 'react'

export default function Page() {
  const { wishlistId } = useParams()
  if (!wishlistId) {
    return null
  }
  const { data } = useApiGetWishlistById(wishlistId as string)

  const wishlist = data?.data

  if (!wishlist) {
    return null
  }

  return (
    <div className={`w-screen min-h-screen bg-background px-2 md:px-5 ${wishlist.settings.colorScheme}`}>
      <div className="flex flex-col py-5">
        <div className="flex flex-col-reverse gap-6 md:flex-row md:justify-between mb-10">
          <div className="text-5xl font-bold text-primary flex flex-col gap-4 justify-between col-auto">
            <div>
              Добро пожаловать в мой вишлист!
            </div>
            <div className="text-4xl text-card-foreground">
              Приглашаю вас на свой праздник -
              <div className="text-primary text-4xl">"{wishlist.title}"</div>
            </div>
          </div>

          {wishlist?.cover &&
            <Image className="rounded-2xl" src={wishlist.cover} alt="wishlist-cover" width={400} height={400} />
          }
        </div>
        {
          wishlist?.description && <div className="mb-4">
            <span className="text-4xl text-primary mb-2">Что вас ждет?</span>
            <div className="text-xl text-foreground">
              {wishlist?.description}
            </div>
          </div>
        }
        {
          (wishlist?.location.time || wishlist.location.name) && <div className='flex flex-col gap-2 text-foreground text-xl'>
            <span className="text-4xl text-primary">Где и когда?</span>
            {
              wishlist.location.time && <div>
                Дата - {toDate((wishlist.location.time)).toLocaleDateString()}
              </div>
            }

            {
              wishlist.location.name && <div>
                Место - {wishlist.location.link ?
                <a className='text-primary underline' href={wishlist.location.link} rel="nofollow" target="_blank">{wishlist.location.name}</a> :
                <span>{wishlist.location.name}</span>}
              </div>
            }

          </div>
        }
      </div>
      <PresentsPage />
    </div>
  )
}