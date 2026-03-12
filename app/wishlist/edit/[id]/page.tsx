'use client'

import { useApiGetWishlistById } from '@/api/wishlist'
import { CreateForm } from '@/app/wishlist/components/create-form'
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

  const isConstructor = Array.isArray(wishlist.blocks)

  return (
    <>
      <Breadcrumbs
        items={[
          { name: 'Мои вишлисты', url: '/wishlist' },
          { name: wishlist.title, url: `/wishlist/${id}` },
        ]}
        page="Конструктор"
      />
      <h2 className='text-4xl mb-5'>{wishlist.title}</h2>
      {isConstructor ? (
        <ConstructorEditor wishlist={wishlist} />
      ) : (
        <CreateForm edit wishlist={wishlist} />
      )}
    </>
  )
}
