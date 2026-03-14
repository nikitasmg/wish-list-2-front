'use client'

import { useApiGetWishlistById } from '@/api/wishlist'
import { ConstructorEditor } from '@/app/wishlist/components/constructor-editor'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { useParams } from 'next/navigation'
import * as React from 'react'

export default function Page() {
  const { id } = useParams()
  const { data } = useApiGetWishlistById(id as string)
  const wishlist = data?.data

  if (!wishlist) {
    return null
  }

  return (
    <>
      <Breadcrumbs
        items={[{ name: 'Мои вишлисты', url: '/wishlist' }]}
        page={wishlist.title}
      />
      <ConstructorEditor wishlist={wishlist} />
    </>
  )
}
