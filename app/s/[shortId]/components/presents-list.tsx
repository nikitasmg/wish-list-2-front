'use client'

import { ReserveControl, shopName } from '@/app/s/[shortId]/components/present-item'
import { useReservation } from '@/app/s/[shortId]/components/use-reservation'
import { Present } from '@/shared/types'
import { SchemeConfig } from './scheme-config'
import { cn } from '@/lib/utils'
import { ExternalLinkIcon } from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'

type Props = {
  presents: Present[]
  wishlistId: string
  theme: string
  config: SchemeConfig
  isHidden: boolean
}

export function PresentsList({ presents, wishlistId, theme, config, isHidden }: Props) {
  if (!presents.length) return null

  return (
    <div className="space-y-3">
      {presents.map(present => (
        <PresentRow
          key={present.id}
          present={present}
          wishlistId={wishlistId}
          theme={theme}
          config={config}
          isHidden={isHidden}
        />
      ))}
    </div>
  )
}

function PresentRow({
  present, wishlistId, theme, config, isHidden,
}: {
  present: Present
  wishlistId: string
  theme: string
  config: SchemeConfig
  isHidden: boolean
}) {
  const { state, isPending, reserve, release } = useReservation(present, wishlistId)
  const links = present.links?.length ? present.links : present.link ? [present.link] : []

  return (
    <div className={cn(
      'flex items-center gap-4 bg-card p-4 border border-border/40',
      // Своя бронь не приглушается: это подарок, который гость выбрал сам.
      state === 'taken' && 'opacity-60',
      state === 'mine' && 'border-primary/40',
      config.cardRounded,
    )}>
      <div className={cn('w-16 h-16 flex-shrink-0 overflow-hidden bg-muted', config.cardRounded)}>
        {present.cover ? (
          <Image src={present.cover} alt={present.title} width={64} height={64} unoptimized className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🎁</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-foreground truncate">{present.title}</div>
        {present.description && (
          <div className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{present.description}</div>
        )}
        {links.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {links.map(link => (
              <a key={link} href={link} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <ExternalLinkIcon className="w-3 h-3" /> {shopName(link)}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-2 flex-shrink-0 w-[172px]">
        {present.price && (
          <span className="text-sm font-bold text-primary whitespace-nowrap">
            {present.price.toLocaleString('ru-RU')} ₽
          </span>
        )}
        {!isHidden && (
          <div className="flex w-full">
            <ReserveControl
              state={state}
              isPending={isPending}
              theme={theme}
              onReserve={reserve}
              onRelease={release}
              size="sm"
            />
          </div>
        )}
      </div>
    </div>
  )
}
