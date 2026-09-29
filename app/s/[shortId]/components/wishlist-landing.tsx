'use client'

import { Present, Wishlist } from '@/shared/types'
import { BlockRenderer } from './blocks/block-renderer'
import { HeroHeader } from './hero-header'
import { GiftsSection } from './gifts-section'
import { getSchemeConfig } from './scheme-config'
import { CUSTOM_SCHEME, normalizeScheme } from '@/shared/constants'
import { deriveSchemeStyle } from '@/shared/derive-scheme'
import { cn } from '@/lib/utils'
import { isLegacyWishlist } from '@/shared/editor-model'
import { ShareWishlist } from './share-wishlist'
import Link from 'next/link'

type Props = { wishlist: Wishlist; presents: Present[]; isMyWishlist: boolean; disableBodyTheme?: boolean }
export function WishlistLanding({ wishlist, presents, isMyWishlist, disableBodyTheme = false }: Props) {
  const scheme = normalizeScheme(wishlist.settings.colorScheme)
  const blocks = wishlist.blocks ?? []
  return <div className={cn('min-h-screen bg-background text-foreground', scheme !== CUSTOM_SCHEME && scheme)}
    style={scheme === CUSTOM_SCHEME ? deriveSchemeStyle(wishlist.settings.customScheme) : undefined}>
    {/* В предпросмотре шапки нет: она принадлежит опубликованной странице,
        а в редакторе только съедала бы место. */}
    {!disableBodyTheme && <div className="mx-auto flex max-w-5xl justify-end px-4 pt-4 md:px-8">
      <ShareWishlist wishlist={wishlist} />
    </div>}
    {isLegacyWishlist(wishlist) && !blocks.some(b => b.type === 'cover') && <HeroHeader wishlist={wishlist} config={getSchemeConfig(scheme)} />}
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-12 space-y-12">
      <BlockRenderer blocks={blocks} wishlist={wishlist} presents={presents} owner={isMyWishlist} preview={disableBodyTheme} />
      {isLegacyWishlist(wishlist) && !blocks.some(b => b.type === 'wishlist') && presents.length > 0 && <section className="space-y-6"><h2 className="text-3xl font-bold">Желанные подарки</h2><GiftsSection wishlist={wishlist} presents={presents} owner={isMyWishlist} preview={disableBodyTheme} /></section>}
    </div>
    <footer className="border-t px-4 py-8"><div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4 text-sm">
      <Link href="/" className="text-muted-foreground">Сделано в «просто намекни<span className="text-primary">;)</span>»</Link>
      {/* Подвал — канал привлечения: гость уже увидел готовую страницу */}
      <Link href="/templates" className="font-semibold text-primary hover:underline">Создать свой вишлист →</Link>
    </div></footer>
  </div>
}
