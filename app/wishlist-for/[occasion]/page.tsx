'use client'

import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { WishlistLanding } from '@/app/s/[shortId]/components/wishlist-landing'
import { Breadcrumbs } from '@/components/breadcrumbs'
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
      <div className="container mx-auto px-4 pt-8">
        <Breadcrumbs
          items={[{ name: 'Примеры вишлистов', url: '/wishlist-for' }]}
          page={occasion.h1}
        />
      </div>
      <WishlistLanding
        wishlist={occasion.wishlist}
        presents={occasion.presents}
        isMyWishlist={false}
        disableBodyTheme
      />
    </div>
  )
}
