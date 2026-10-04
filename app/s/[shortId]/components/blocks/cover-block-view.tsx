import { AddToCalendar } from '@/app/s/[shortId]/components/add-to-calendar'
import { Countdown } from '@/app/s/[shortId]/components/countdown'
import { CardCover } from '@/components/card-cover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { eventTiming, formatEventDate } from '@/shared/event-date'
import { Block, Wishlist } from '@/shared/types'

export function CoverBlockView({ block, wishlist, preview = false }: { block: Block; wishlist?: Wishlist; preview?: boolean }) {
  const image = String(block.data.imageUrl ?? '')
  const view = block.view ?? 'center'
  const title = block.title || wishlist?.title || 'Ваш праздник'

  const eventDate = wishlist?.eventDate ?? wishlist?.location?.time
  const timing = eventTiming(eventDate)
  // Бейдж собирается из повода и даты: «день рождения · 14 ноября».
  const badge = [wishlist?.occasion, formatEventDate(eventDate)].filter(Boolean).join(' · ')

  const hasGifts = (wishlist?.blocks ?? []).some(b => b.type === 'wishlist')
  // У свадьбы и вечеринок главное действие — ответить на приглашение.
  const rsvp = (wishlist?.blocks ?? []).find(b => b.type === 'rsvp' && !b.hidden)

  return <div className={cn('relative isolate overflow-hidden rounded-block px-6 py-14', view === 'left' ? 'text-left' : 'text-center')}>
    {view === 'photo' && image && <><CardCover cover={image} className="absolute inset-0 h-full rounded-none" /><div className="absolute inset-0 bg-background/80" /></>}
    <div className="relative space-y-6">
      {image && view !== 'photo' && <CardCover cover={image} title={title} className={cn('mx-auto h-52 max-w-xs', view === 'circle' && 'size-44 rounded-full', view === 'arch' && 'h-72 rounded-t-block')} />}
      {(block.caption || badge) && <p className="text-body-sm font-semibold text-primary">{block.caption || badge}</p>}
      {view === 'number' && <div className="text-display-xl font-extrabold text-primary">{String(block.data.number ?? '')}</div>}
      <h1 className="text-title-lg font-extrabold [overflow-wrap:anywhere] lg:text-display">{title}</h1>
      {Boolean(block.data.subtitle) && <p className="mx-auto max-w-xl text-lead text-muted-foreground whitespace-pre-wrap">{String(block.data.subtitle)}</p>}

      {/* Отсчёт только до будущего праздника: у прошедшего он показывал бы
          ноль и смотрелся бы поломкой. */}
      {timing && !timing.past && eventDate && (
        <div className={cn('flex', view === 'left' ? 'justify-start' : 'justify-center')}>
          <Countdown target={eventDate} live={Boolean(wishlist?.settings.liveTimer)} />
        </div>
      )}

      {wishlist && !preview && (
        <div className={cn('flex flex-wrap gap-3 pt-2', view === 'left' ? 'justify-start' : 'justify-center')}>
          {rsvp && (
            <Button size="lg" asChild>
              <a href={`#b-${rsvp.id}`}>Ответить на приглашение</a>
            </Button>
          )}
          {hasGifts && (
            <Button size="lg" variant={rsvp ? 'outline' : 'default'} asChild>
              <a href="#gifts">Смотреть подарки</a>
            </Button>
          )}
          <AddToCalendar wishlist={wishlist} />
        </div>
      )}
    </div>
  </div>
}
