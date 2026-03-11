'use client'

import { useApiGetWishlistById } from '@/api/wishlist'
import { CreateForm } from '@/app/wishlist/components/create-form'
import { ConstructorEditor } from '@/app/wishlist/components/constructor-editor'
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
      <h2 className='text-4xl mb-5'>{wishlist.title}</h2>
      {isConstructor ? (
        <ConstructorEditor wishlist={wishlist} />
      ) : (
        <CreateForm edit wishlist={wishlist} />
      )}
    </>
  )
}
