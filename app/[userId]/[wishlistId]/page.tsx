'use client'

import { useApiGetWishlistById } from '@/api/wishlist'
import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import * as React from 'react'

export default function Page() {
  const { wishlistId } = useParams()
  const router = useRouter()
  const { data, isLoading } = useApiGetWishlistById(wishlistId as string)
  const wishlist = data?.data

  useEffect(() => {
    if (wishlist?.shortId) {
      router.replace(`/s/${wishlist.shortId}`)
    }
  }, [wishlist, router])

  if (isLoading || wishlist?.shortId) return null

  return (
    <div className="p-8 text-center text-muted-foreground">
      Ссылка устарела. Найдите вишлист через профиль автора.
    </div>
  )
}
