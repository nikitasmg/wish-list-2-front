'use client'

import { useApiGetWishlistByShortId } from '@/api/wishlist'
import { useApiGetAllPresents } from '@/api/present'
import { useApiGetMe } from '@/api/user'
import { WishlistLanding } from '@/app/s/[shortId]/components/wishlist-landing'
import { useParams } from 'next/navigation'
import * as React from 'react'

export default function Page() {
  const { shortId } = useParams()
  const { data } = useApiGetWishlistByShortId(shortId as string)
  const wishlist = data?.data
  const { data: presentsData } = useApiGetAllPresents(wishlist?.id ?? '')
  const { data: userData } = useApiGetMe()

  const presents = presentsData?.data ?? []
  const isMyWishlist = userData?.user.id === wishlist?.userId

  if (!wishlist) return null

  return <WishlistLanding wishlist={wishlist} presents={presents} isMyWishlist={isMyWishlist} />
}
