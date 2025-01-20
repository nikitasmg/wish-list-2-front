'use client'
import { useApiGetWishlistById } from '@/api/wishlist'
import { CreateForm } from '@/app/wishlist/components/create-form'
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
      <h2 className='text-4xl mb-5'>{wishlist.title}</h2>
      <CreateForm edit wishlist={wishlist}/>
    </>
  )
}