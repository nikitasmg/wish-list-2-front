'use client'
import { useApiGetAllPresents } from '@/api/present'
import { useApiGetWishlistById } from '@/api/wishlist'
import { ShareButtons } from '@/app/wishlist/[id]/components/share-buttons'
import { PresentCard } from '@/app/wishlist/[id]/present/components/present-card'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { WishlistMenu,  } from '@/app/wishlist/[id]/components/wishlist-menu'
import { PlusCard } from '@/components/plus-card'
import { Card, CardContent } from '@/components/ui/card'
import { toDate } from 'date-fns'
import { useParams } from 'next/navigation'
import * as React from 'react'
import Image from 'next/image'

export default function Page() {
  const { id } = useParams()

  const { data } = useApiGetWishlistById(id as string)
  const { data: presents } = useApiGetAllPresents(id as string)
  const wishlist = data?.data

  if (!wishlist) {
    return null
  }

  return (
    <div className="flex flex-col gap-5">

      <Breadcrumbs items={[ { name: 'Мои вишлисты', url: '/wishlist' } ]} page={wishlist.title} />
      <div className="flex items-center justify-between">
        <h2 className="text-4xl">{wishlist?.title ?? 'День рождения'}</h2>
        <WishlistMenu wishlist={wishlist} />
      </div>
      <ShareButtons wishlist={wishlist} />
      <div className='flex flex-col-reverse md:flex-row gap-5'>
        {wishlist.description && (
          <Card>
            <CardContent className="text-xl whitespace-pre-wrap mb-5 py-2 px-5">
              {wishlist.description}
            </CardContent>
          </Card>
        )}
        {
          wishlist?.cover &&
          <Image className="rounded-2xl" src={wishlist.cover} alt="wishlist-cover" width={400} height={400} />
        }
      </div>

      {
        (wishlist.location.name || wishlist.location.time) && (
          <div className='mb-5'>
            <h3 className="text-2xl mb-2">Дата и место:</h3>
            {
              wishlist.location.time && <div>
                Дата - {toDate(wishlist.location.time).toLocaleDateString()}
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
        )
      }
      <h3 className="text-2xl mb-5">Список подарков:</h3>
      <PlusCard link={`/wishlist/${id}/present/create`} />
      <div className="flex flex-col gap-4 md:flex-row md:flex-wrap">
        {
          presents && presents.data.length > 0
          && presents?.data.map(
            present => <PresentCard
              key={present.id}
              wishlistId={id as string}
              present={present}
            />,
          )
        }
      </div>
    </div>
  )
}