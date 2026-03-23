'use client'

import { WishlistMenu } from '@/app/wishlist/[id]/components/wishlist-menu'
import { ShareButtons } from '@/components/share-button'
import { Button } from '@/components/ui/button'
import { colorSchema } from '@/shared/constants'
import { Wishlist } from '@/shared/types'
import { toDate } from 'date-fns'
import { ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import * as React from 'react'

interface WishlistCardProps {
  wishlist: Wishlist
}

function WishlistCoverPlaceholder({ colorScheme }: { colorScheme: string }) {
  const scheme = colorSchema.find((s) => s.value === colorScheme) ?? colorSchema[0]
  const [bg, accent] = scheme.colors
  return (
    <div
      className="w-full h-[110px] rounded-t-xl"
      style={{
        backgroundImage: [
          `radial-gradient(circle, ${accent}26 1px, transparent 1px)`,
          `linear-gradient(135deg, ${accent}40 0%, ${bg}26 100%)`,
        ].join(', '),
        backgroundSize: '18px 18px, 100% 100%',
        backgroundColor: bg,
      }}
    />
  )
}

export const WishlistCard = ({ wishlist }: WishlistCardProps) => {
  const router = useRouter()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const shareUrl = wishlist.shortId ? `${appUrl}/s/${wishlist.shortId}` : ''

  return (
    <div className="group relative border text-card-foreground rounded-xl shadow hover:shadow-md transition-shadow bg-card flex flex-col">
      {/* Обложка */}
      {wishlist.cover ? (
        <div className="relative h-[110px] rounded-t-xl overflow-hidden">
          <Image
            src={wishlist.cover}
            alt={wishlist.title}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      ) : (
        <WishlistCoverPlaceholder colorScheme={wishlist.settings.colorScheme} />
      )}

      {/* Контент */}
      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-1 mb-1">
          <h3 className="text-sm font-semibold line-clamp-2 leading-snug flex-1">
            {wishlist.title}
          </h3>
          <WishlistMenu wishlist={wishlist} />
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          {wishlist.presentsCount} подарков
          {wishlist.location.time && (
            <> · {toDate(wishlist.location.time).toLocaleDateString('ru-RU')}</>
          )}
        </p>

        <div className="flex gap-1.5 mt-auto flex-wrap">
          {shareUrl && (
            <ShareButtons
              title={wishlist.title}
              url={shareUrl}
              className="flex gap-1"
            />
          )}
          <Button
            size="sm"
            className="flex-1"
            onClick={() => router.push(`/wishlist/edit/${wishlist.id}`)}
          >
            <ExternalLink size={13} className="mr-1" />
            Открыть
          </Button>
        </div>
      </div>
    </div>
  )
}
