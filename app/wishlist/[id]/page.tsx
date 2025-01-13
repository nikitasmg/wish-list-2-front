'use client'
import { useApiGetAllPresents } from '@/api/present'
import { useApiGetWishlistById } from '@/api/wishlist'
import { PresentCard } from '@/app/wishlist/[id]/present/components/present-card'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { WishlistMenu } from '@/app/wishlist/[id]/components/wishlist-menu'
import { PlusCard } from '@/components/PlusCard'
import { Card, CardContent } from '@/components/ui/card'
import { useParams } from 'next/navigation'
import * as React from 'react'

export default function Page() {
  const { id } = useParams()
  if (!id || typeof id !== 'string') return null
  const { data } = useApiGetWishlistById(id)
  const { data: presents } = useApiGetAllPresents(id)
  const wishlist = data?.data

  if (!wishlist) {
    return null
  }
  return (
    <div className="flex flex-col gap-5">
      <Breadcrumbs items={[ { name: 'Мои вишлисты', url: '/wishlist' } ]} page={wishlist.title} />
      <div className="flex items-center justify-between">
        <h2 className="text-4xl">{wishlist.title}</h2>
        <WishlistMenu id={wishlist.id} />
      </div>
      {wishlist.description && (
        <Card>
          <CardContent className="text-xl whitespace-pre-wrap mb-5 py-2 px-5">
            {wishlist.description}
          </CardContent>
        </Card>
      )}
      <h3 className="text-2xl mb-5">Список подарков:</h3>
      <div className="flex flex-col gap-4 md:flex-row md:flex-wrap">
        <PlusCard link={`/wishlist/${id}/present/create`} />
        {
          presents && presents.data.length > 0
          && presents?.data.map(
            present => <PresentCard
              key={present.id}
              wishlistId={id}
              present={present}
            />,
          )
        }
      </div>
    </div>
  )
}