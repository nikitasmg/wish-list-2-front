'use client'
import { useApiGetAllWishlists } from '@/api/wishlist'
import { WishlistCard } from '@/app/wishlist/components/wishlist-card'
import { PlusCard } from '@/components/plus-card'
import * as React from 'react'

export default function Page() {
  const {data} = useApiGetAllWishlists()
  return (
    <div>
      <h2 className="text-4xl mb-5">Мои вишлисты</h2>
      <PlusCard link='/wishlist/create'/>
      <div className="flex flex-wrap gap-4 items-center">
        {
          data?.data?.map((wishlist) => (
            <WishlistCard key={wishlist.id} wishlist={wishlist}/>
          ))
        }
      </div>
    </div>
  )
}