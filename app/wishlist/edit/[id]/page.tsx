'use client'

import { useApiGetWishlistById } from '@/api/wishlist'
import { ConstructorEditor } from '@/app/wishlist/components/constructor-editor'
import { useParams } from 'next/navigation'
import * as React from 'react'

export default function Page() {
  const { id } = useParams()
  const { data } = useApiGetWishlistById(id as string)
  const wishlist = data?.data

  if (!wishlist) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Открываем конструктор…</div>
  }

  return <ConstructorEditor wishlist={wishlist} />
}
