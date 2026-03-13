import { Wishlist } from '@/shared/types'
import { SchemeConfig } from './scheme-config'
import { CalendarIcon, MapPinIcon, ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import * as React from 'react'

type Props = {
  wishlist: Wishlist
  config: SchemeConfig
}

export function HeroHeader({ wishlist, config }: Props) {
  const hasLocation = wishlist.location.name || wishlist.location.time

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

        {/* Description */}
        {wishlist.description && (
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl line-clamp-3">
            {wishlist.description}
          </p>
        )}

        {/* Location + date chips */}
        {hasLocation && (
          <div className="flex flex-wrap gap-3 pt-2">
            {wishlist.location.time && (
              <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                <CalendarIcon className="w-4 h-4 text-primary" />
                {new Date(wishlist.location.time).toLocaleDateString('ru-RU', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </div>
            )}
            {wishlist.location.name && (
              <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                <MapPinIcon className="w-4 h-4 text-primary" />
                {wishlist.location.link ? (
                  <a href={wishlist.location.link} target="_blank" rel="noopener noreferrer"
                     className="text-primary underline underline-offset-2">
                    {wishlist.location.name}
                  </a>
                ) : (
                  <span>{wishlist.location.name}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDownIcon className="w-6 h-6 text-muted-foreground" />
      </div>
    </div>
  )
}
