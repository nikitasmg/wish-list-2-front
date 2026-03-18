'use client'

import { Present, Wishlist } from '@/shared/types'
import { BlockRenderer } from './blocks/block-renderer'
import { HeroHeader } from './hero-header'
import { PresentsList } from './presents-list'
import { PresentsGrid } from './presents-grid'
import { getSchemeConfig } from './scheme-config'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import * as React from 'react'
import { useEffect } from 'react'

type Props = {
  wishlist: Wishlist
  presents: Present[]
  isMyWishlist: boolean
  isExample?: boolean
  disableBodyTheme?: boolean
}

export function WishlistLanding({ wishlist, presents, isMyWishlist, isExample, disableBodyTheme }: Props) {
  const config = getSchemeConfig(wishlist.settings.colorScheme)
  const isPresentHidden = isMyWishlist
  const layout = wishlist.settings.presentsLayout ?? 'list'

  useEffect(() => {
    if (disableBodyTheme) return
    const scheme = wishlist.settings.colorScheme
    if (!scheme) return
    document.body.classList.add(scheme)
    return () => { document.body.classList.remove(scheme) }
  }, [wishlist.settings.colorScheme, disableBodyTheme])

  return (
    <div className={cn('min-h-screen bg-background', wishlist.settings.colorScheme)}>
      <HeroHeader wishlist={wishlist} config={config} />

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-16 space-y-16">
        {wishlist.blocks && wishlist.blocks.length > 0 && (
          <BlockRenderer blocks={wishlist.blocks} />
        )}

        {presents.length > 0 && (
          <section className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold text-primary">Желанные подарки</h2>
              <div className="w-16 h-1.5 bg-accent rounded-full" />
            </div>

            {layout === 'list' && (
              <PresentsList
                presents={presents}
                wishlistId={wishlist.id}
                theme={wishlist.settings.colorScheme}
                config={config}
                isHidden={isPresentHidden}
                isExample={isExample}
              />
            )}
            {layout === 'grid3' && (
              <PresentsGrid
                presents={presents}
                wishlistId={wishlist.id}
                theme={wishlist.settings.colorScheme}
                isHidden={isPresentHidden}
                isExample={isExample}
                columns={3}
              />
            )}
            {layout === 'grid2' && (
              <PresentsGrid
                presents={presents}
                wishlistId={wishlist.id}
                theme={wishlist.settings.colorScheme}
                isHidden={isPresentHidden}
                isExample={isExample}
                columns={2}
              />
            )}
          </section>
        )}
      </div>

      <footer className="bg-secondary text-secondary-foreground py-4">
        <div className="mx-auto flex items-center justify-between container px-4 gap-4">
          <p className="text-sm md:text-base">
            Создано с помощью сервиса <Link href="/" className="underline">Просто намекни</Link>
          </p>
          <Link href="/" className="bg-background text-foreground px-4 py-2 md:px-8 md:py-3 rounded-xl font-bold text-sm md:text-base hover:bg-background/90 transition-colors shadow-lg">
            Хочу такой же!
          </Link>
        </div>
      </footer>
    </div>
  )
}
