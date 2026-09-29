import { Wishlist } from '@/shared/types'
import { SchemeConfig } from './scheme-config'
import { ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import * as React from 'react'

type Props = {
  wishlist: Wishlist
  config: SchemeConfig
}

export function HeroHeader({ wishlist, config }: Props) {
  return (
    <div className="relative w-full min-h-screen flex flex-col">
      {/* Cover image or gradient fallback */}
      {wishlist.cover ? (
        <Image
          src={wishlist.cover}
          alt={wishlist.title}
          fill
          priority
          unoptimized
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-accent/20" />
      )}

      {/* Gradient overlay — fades cover into background color */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-t',
        config.heroOverlay,
      )} />

      {/* Content pinned to bottom */}
      <div className="relative mt-auto px-6 md:px-12 pb-16 pt-32 space-y-4 max-w-4xl">
        {/* Title */}
        <h1 className={cn(
          'text-5xl md:text-7xl leading-[0.95] text-foreground',
          config.titleBold ? 'font-black' : 'font-bold',
        )}>
          {wishlist.title}
        </h1>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDownIcon className="w-6 h-6 text-muted-foreground" />
      </div>
    </div>
  )
}
