'use client'
import { ConfirmReserveModal } from '@/app/s/[shortId]/components/confirm-modal'
import { useGroupJoin, useReservation } from '@/app/s/[shortId]/components/use-reservation'
import { CardCover } from '@/components/card-cover'
import { Button } from '@/components/ui/button'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { linkHostname, pluralizeRu } from '@/lib/utils'
import { Present } from '@/shared/types'
import { Check, ExternalLink, Heart, Lock } from 'lucide-react'
import * as React from 'react'
import type { SchemeTheme } from './scheme-config'

type Props = {
  present: Present
  theme: SchemeTheme
  isHidden: boolean
  isOwner?: boolean
  wishlistId: string
  onDetails?: (present: Present) => void
  isExample?: boolean
}

/**
 * Порог, после которого описание точно не помещается в три строки карточки.
 * Показывать «Подробнее» под однострочным описанием — лишний шум: там и так
 * всё видно.
 */
const CLAMPED_DESCRIPTION = 90

export const PresentItem = ({
  present, theme, isHidden, isOwner, wishlistId, onDetails, isExample,
}: Props) => {
  const { state, isPending, reserve, release } = useReservation(present, wishlistId, isExample)
  const group = useGroupJoin(present, wishlistId, isExample)
  const links = present.links?.length ? present.links : present.link ? [present.link] : []
  const hasMore = Boolean(onDetails) && (
    (present.description?.length ?? 0) > CLAMPED_DESCRIPTION || links.length > 1
  )
  const images = present.type === 'multi' && present.images?.length ? present.images : []

  return (
    <div className="w-full md:max-w-[350px] bg-card rounded-2xl flex flex-col gap-2">
      {images.length > 1 ? (
        <Carousel className="w-full">
          <CarouselContent>
            {images.map((img, i) => (
              <CarouselItem key={img + i}>
                <CardCover cover={img} className="h-[300px]" />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
      ) : images.length === 1 ? (
        <CardCover cover={images[0]} className="h-[300px]" />
      ) : present.cover ? (
        <CardCover cover={present.cover} className="h-[300px]" />
      ) : (
        <div className="flex justify-center items-center bg-primary w-full h-[300px] rounded-t-2xl">
          <Heart size={50} />
        </div>
      )}

      <div className="grow flex flex-col gap-2 p-3">
        <div className="text-2xl text-secondary-foreground font-bold line-clamp-2 min-h-[65px]">
          {present.title}
        </div>
        <div className="line-clamp-3 text-foreground min-h-[72px] whitespace-pre-line break-words">
          {present.description}
        </div>
        {hasMore && (
          <button
            type="button"
            onClick={() => onDetails?.(present)}
            className="self-start text-sm font-semibold text-primary hover:underline"
          >
            Подробнее
          </button>
        )}
        {present.price && (
          <div className="text-right font-bold text-l italic text-foreground mt-auto">
            {present.price.toLocaleString('ru-RU')} ₽
          </div>
        )}

        <div className="flex items-center justify-between flex-col sm:flex-row gap-3 mt-auto">
          {!isHidden && (
            present.type === 'group'
              ? <GroupJoinControl group={group} isOwner={isOwner} />
              : isOwner
                ? (
                  <Button className="grow" variant={present.reserved ? 'destructive' : 'secondary'} disabled>
                    {present.reserved ? 'Забронирован' : 'Свободен'}
                  </Button>
                )
                : (
                  <ReserveControl
                    state={state}
                    isPending={isPending}
                    theme={theme}
                    onReserve={reserve}
                    onRelease={release}
                  />
                )
          )}
          {links.length > 0 && <ShopLinks links={links} />}
        </div>
      </div>
    </div>
  )
}

/**
 * Групповой подарок: кнопка «скинусь» и счётчик участников. Владельцу кнопку
 * не показываем — он смотрит на свой же вишлист, дарить ему нечего.
 */
export function GroupJoinControl({
  group, isOwner,
}: {
  group: ReturnType<typeof useGroupJoin>
  isOwner?: boolean
}) {
  return (
    <div className="w-full flex flex-col gap-2">
      {!isOwner && (
        <Button
          className="grow"
          loading={group.isPending}
          variant={group.joined ? 'destructive' : 'default'}
          onClick={group.toggle}
        >
          {group.joined ? 'Не хочу дарить' : 'Я хочу подарить'}
        </Button>
      )}
      <p className="text-sm text-center text-muted-foreground">
        {group.count} {pluralizeRu(group.count, ['человек', 'человека', 'человек'])}{' '}
        {pluralizeRu(group.count, ['хочет', 'хотят', 'хотят'])} подарить
      </p>
    </div>
  )
}

/**
 * Три состояния вместо двух: свободен, «Вы дарите» со снятием брони и чужая
 * бронь. Кто именно занял подарок, гостю не показываем — этого нет и в ответе
 * API.
 */
export function ReserveControl({
  state, isPending, theme, onReserve, onRelease, size,
}: {
  state: 'free' | 'mine' | 'taken'
  isPending: boolean
  theme: SchemeTheme
  onReserve: () => void
  onRelease: () => void
  size?: 'sm'
}) {
  if (state === 'mine') {
    return (
      <div className="grow flex items-center justify-between gap-2 h-10 px-3 rounded-xl border border-primary/40">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-primary">
          <Check className="w-4 h-4" /> Вы дарите
        </span>
        <button
          type="button"
          onClick={onRelease}
          disabled={isPending}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          Отменить
        </button>
      </div>
    )
  }

  if (state === 'taken') {
    return (
      <div className="grow flex items-center justify-center gap-1.5 h-10 text-sm text-muted-foreground">
        <Lock className="w-4 h-4" /> Уже дарят
      </div>
    )
  }

  return (
    <ConfirmReserveModal theme={theme} onClick={onReserve}>
      <Button className="grow" size={size} loading={isPending}>Забронировать</Button>
    </ConfirmReserveModal>
  )
}

/** Подпись магазина — хост ссылки: отдельного поля для названия нет. */
export function shopName(link: string): string {
  return linkHostname(link) ?? 'Магазин'
}

function ShopLinks({ links }: { links: string[] }) {
  if (links.length === 1) {
    return (
      <a href={links[0]} target="_blank" rel="noopener noreferrer"
         className="flex text-primary gap-2 hover:underline whitespace-nowrap">
        В магазин <ExternalLink />
      </a>
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5 justify-end">
      {links.map(link => (
        <a
          key={link}
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-full border border-border/60 text-xs text-muted-foreground hover:text-foreground"
        >
          {shopName(link)} <ExternalLink className="w-3 h-3" />
        </a>
      ))}
    </div>
  )
}
