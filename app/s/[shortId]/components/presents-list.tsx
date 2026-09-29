'use client'

import { ReserveControl, shopName } from '@/app/s/[shortId]/components/present-item'
import { useReservation } from '@/app/s/[shortId]/components/use-reservation'
import { Present } from '@/shared/types'
import { SchemeConfig } from './scheme-config'
import { cn } from '@/lib/utils'
import { CardCover } from '@/components/card-cover'
import { ExternalLinkIcon } from 'lucide-react'
import * as React from 'react'

type Props = {
  presents: Present[]
  wishlistId: string
  theme: string
  config: SchemeConfig
  isHidden: boolean
  onDetails?: (present: Present) => void
}

export function PresentsList({ presents, wishlistId, theme, config, isHidden, onDetails }: Props) {
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
          onDetails={onDetails}
        />
      ))}
    </div>
  )
}

function PresentRow({
  present, wishlistId, theme, config, isHidden, onDetails,
}: {
  present: Present
  wishlistId: string
  theme: string
  config: SchemeConfig
  isHidden: boolean
  onDetails?: (present: Present) => void
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
      {/* Тот же CardCover, что и в карточках: скелетон при загрузке и
          нейтральная заглушка на битой ссылке — раньше здесь был голый img,
          и сломанное фото ломало строку. */}
      {present.cover ? (
        <CardCover
          cover={present.cover}
          title={present.title}
          className={cn('w-16 h-16 flex-shrink-0', config.cardRounded)}
        />
      ) : (
        <div className={cn('w-16 h-16 flex-shrink-0 overflow-hidden bg-muted flex items-center justify-center text-2xl', config.cardRounded)}>
          🎁
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* В списке строка одна: подробности открывает нажатие на название,
            иначе длинное описание разваливает ряд. */}
        {onDetails ? (
          <button
            type="button"
            onClick={() => onDetails(present)}
            className="block w-full text-left font-semibold text-foreground truncate hover:underline"
          >
            {present.title}
          </button>
        ) : (
          <div className="font-semibold text-foreground truncate">{present.title}</div>
        )}
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
