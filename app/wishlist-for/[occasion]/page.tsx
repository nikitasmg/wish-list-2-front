'use client'

import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { WishlistLanding } from '@/app/s/[shortId]/components/wishlist-landing'
import { getOccasionBySlug } from '@/content/occasions'
import { use } from 'react'

type Props = {
  params: Promise<{ occasion: string }>
}

export default function OccasionPage({ params }: Props) {
  const { occasion: slug } = use(params)
  const occasion = getOccasionBySlug(slug)
  if (!occasion) notFound()

  return (
    <div className="min-h-screen bg-background text-foreground font-manrope">
      <Header />
      <WishlistLanding
        wishlist={occasion.wishlist}
        presents={occasion.presents}
        isMyWishlist={false}
        isExample
        disableBodyTheme
      />
    </div>
  )
}
