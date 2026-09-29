'use client'

import { GroupJoinControl, ReserveControl, shopName } from '@/app/s/[shortId]/components/present-item'
import { useGroupJoin, useReservation } from '@/app/s/[shortId]/components/use-reservation'
import { CardCover } from '@/components/card-cover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Present } from '@/shared/types'
import { ExternalLinkIcon } from 'lucide-react'
import * as React from 'react'
import type { SchemeConfig, SchemeTheme } from './scheme-config'

type Props = {
  presents: Present[]
  wishlistId: string
  theme: SchemeTheme
  config: SchemeConfig
  isHidden: boolean
  isOwner?: boolean
  isExample?: boolean
  onDetails?: (present: Present) => void
}

export function PresentsList({
  presents, wishlistId, theme, config, isHidden, isOwner, isExample, onDetails,
}: Props) {
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
          isOwner={isOwner}
          isExample={isExample}
          onDetails={onDetails}
        />
      ))}
    </div>
  )
}

function PresentRow({
  present, wishlistId, theme, config, isHidden, isOwner, isExample, onDetails,
}: {
  present: Present
  wishlistId: string
  theme: SchemeTheme
  config: SchemeConfig
  isHidden: boolean
  isOwner?: boolean
  isExample?: boolean
  onDetails?: (present: Present) => void
}) {
  const { state, isPending, reserve, release } = useReservation(present, wishlistId, isExample)
  const group = useGroupJoin(present, wishlistId, isExample)
  const links = present.links?.length ? present.links : present.link ? [present.link] : []
  // У набора обложки своей нет — берём первую картинку из набора.
  const cover = present.images?.[0] || present.cover

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
      {cover ? (
        <CardCover
          cover={cover}
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
          present.type === 'group' ? (
            <GroupJoinControl group={group} isOwner={isOwner} />
          ) : isOwner ? (
            <Button size="sm" variant={present.reserved ? 'destructive' : 'secondary'} disabled>
              {present.reserved ? 'Забронирован' : 'Свободен'}
            </Button>
          ) : (
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
          )
        )}
      </div>
    </div>
  )
}
