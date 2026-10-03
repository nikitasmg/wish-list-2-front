'use client'

import { Present, Wishlist } from '@/shared/types'
import { BlockRenderer } from './blocks/block-renderer'
import { HeroHeader } from './hero-header'
import { GiftsSection } from './gifts-section'
import { getSchemeConfig } from './scheme-config'
import { normalizeScheme } from '@/shared/constants'
import { pageLook } from '@/shared/look'
import { cn } from '@/lib/utils'
import { isLegacyWishlist } from '@/shared/editor-model'
import { ShareWishlist } from './share-wishlist'
import Link from 'next/link'

type Props = {
  wishlist: Wishlist
  presents: Present[]
  isMyWishlist: boolean
  /** Витрина готовых вишлистов: бронь там понарошку, запросов на бэк нет. */
  isExample?: boolean
  disableBodyTheme?: boolean
}

export function WishlistLanding({ wishlist, presents, isMyWishlist, isExample, disableBodyTheme = false }: Props) {
  const scheme = normalizeScheme(wishlist.settings.colorScheme)
  const look = pageLook(wishlist.settings)
  const blocks = wishlist.blocks ?? []
  return <div className={cn('min-h-screen bg-background text-foreground', look.className)} style={look.style}>
    {/* В предпросмотре шапки нет: она принадлежит опубликованной странице,
        а в редакторе только съедала бы место. */}
    {!disableBodyTheme && <div className="mx-auto flex max-w-[1120px] items-center justify-between px-4 pt-5 md:px-8">
      <Link href="/" className="flex flex-col leading-none">
        <span className="text-[10px] tracking-wide text-muted-foreground">просто</span>
        <span className="text-[19px] font-extrabold">намекни<span className="text-primary">;)</span></span>
      </Link>
      <ShareWishlist wishlist={wishlist} />
    </div>}
    {isLegacyWishlist(wishlist) && !blocks.some(b => b.type === 'cover') && <HeroHeader wishlist={wishlist} config={getSchemeConfig(scheme)} />}
    <div className="mx-auto max-w-[1120px] space-y-12 px-4 py-12 md:px-8 md:py-16">
      <BlockRenderer blocks={blocks} rows={wishlist.rows} wishlist={wishlist} presents={presents} owner={isMyWishlist} preview={disableBodyTheme} isExample={isExample} />
      {isLegacyWishlist(wishlist) && !blocks.some(b => b.type === 'wishlist') && presents.length > 0 && <section className="space-y-6"><h2 className="text-3xl font-bold">Желанные подарки</h2><GiftsSection wishlist={wishlist} presents={presents} owner={isMyWishlist} preview={disableBodyTheme} isExample={isExample} /></section>}
    </div>
    <footer className="border-t px-4 py-8"><div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4 text-sm">
      <Link href="/" className="text-muted-foreground">Сделано в «просто намекни<span className="text-primary">;)</span>»</Link>
      {/* Подвал — канал привлечения: гость уже увидел готовую страницу */}
      <Link href="/wishlist/create" className="font-semibold text-primary hover:underline">Создать свой вишлист →</Link>
    </div></footer>
  </div>
}
