'use client'

import { CardCover } from '@/components/card-cover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { pluralRu } from '@/shared/event-date'
import { isFromSanta } from '@/shared/santa'
import { GiftFilter, filterGifts, formatPrice, giftCounts, giftLinks, shopName, sortGifts, takenLabel } from '@/shared/gifts'
import { Block, Present, Wishlist } from '@/shared/types'
import { Check, ChevronRight, ExternalLink, Gift, Lock, Star, StickyNote } from 'lucide-react'
import * as React from 'react'
import { useEffect, useState } from 'react'
import { schemeTheme, type SchemeTheme } from './scheme-config'
import { useGroupJoin, useReservation } from './use-reservation'
import { burstConfetti } from './confetti'

type View = 'cards' | 'list' | 'tiles'

/** Сколько подарков видно до «Все подарки — ещё N». */
const COLLAPSED: Record<View, number> = { cards: 8, list: 6, tiles: 9 }

type Context = {
  wishlistId: string
  theme: SchemeTheme
  /** Брони не показываем: предпросмотр или владелец выключил «что занято». */
  hidden: boolean
  owner: boolean
  isExample?: boolean
  confetti: boolean
  onDetails: (present: Present) => void
  onReserved: (present: Present) => void
}

/**
 * «Вишлист» на странице гостя: фильтр со счётчиками, главная мечта первой,
 * три вида — карточки, список, плитка — и бронь без регистрации с подписью
 * «Как вас подписать?».
 */
export function GiftsSection({ wishlist, presents, owner = false, preview = false, view, isExample, block }: {
  wishlist: Wishlist; presents: Present[]; owner?: boolean; preview?: boolean; view?: string; isExample?: boolean; block?: Block
}) {
  const [filter, setFilter] = useState<GiftFilter>('all')
  const [detail, setDetail] = useState<Present | null>(null)
  const [thanks, setThanks] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const theme = schemeTheme(wishlist.settings)
  const hidden = preview || (owner && !wishlist.settings.showGiftAvailability)
  const layout: View = view === 'list' || view === 'tiles' ? view
    : view === 'cards' ? 'cards'
    // Старые вишлисты хранили вид в настройках.
    : wishlist.settings.presentsLayout === 'list' ? 'list' : 'cards'
  const sorted = sortGifts(hidden ? presents.map(p => ({ ...p, reserved: false, reservedByMe: false, gifted: false })) : presents)
  const visible = hidden ? sorted : filterGifts(sorted, filter)
  const limit = COLLAPSED[layout]
  const shown = expanded ? visible : visible.slice(0, limit)
  const counts = giftCounts(sorted)
  const mainLarge = Boolean(wishlist.settings.mainDreamLarge) && layout === 'cards'

  const context: Context = {
    wishlistId: wishlist.id, theme, hidden, owner, isExample,
    confetti: Boolean(wishlist.settings.confettiOnReserve),
    onDetails: setDetail,
    onReserved: present => setThanks(present.title),
  }

  return <section className="space-y-6">
    {block && <header className="space-y-2">
      {block.caption && block.title && <p className="text-body-sm font-semibold text-primary">{block.caption}</p>}
      <h2 className="heading text-title-lg font-extrabold text-primary md:text-display-md md:leading-none">{block.title || block.caption || 'Вишлист'}</h2>
      <p className="text-muted-foreground">
        {presents.length} {pluralRu(presents.length, ['подарок', 'подарка', 'подарков'])} · бронь без регистрации. Организатор не узнает, кто что дарит.
      </p>
    </header>}

    {!hidden && presents.length > 1 && (
      <div role="group" aria-label="Фильтр подарков" className="flex flex-wrap gap-1.5">
        {([['all', 'Все'], ['free', 'Свободные'], ['taken', 'Заняты'], ['gifted', 'Подарено']] as const)
          .filter(([id]) => id !== 'gifted' || counts.gifted > 0)
          .map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => { setFilter(id); setExpanded(false) }}
              className={cn(
                'h-9 rounded-full border px-4 text-body-sm font-semibold transition-colors',
                filter === id ? 'border-transparent bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label} <span className="tabular-nums opacity-60">{counts[id]}</span>
            </button>
          ))}
      </div>
    )}

    {thanks && (
      <div role="status" className="flex flex-wrap items-center gap-4 rounded-block border border-primary/40 bg-primary/10 p-5">
        <Gift className="shrink-0 text-primary" aria-hidden />
        <p className="min-w-0 flex-1 text-body-sm">
          <b>Ура! Вы дарите «{thanks}».</b> Организатор не узнает, кто это, — сюрприз сохранится. Передумаете — отмените бронь в карточке.
        </p>
        <Button size="sm" onClick={() => setThanks(null)}>Отлично</Button>
      </div>
    )}

    {!shown.length
      ? <p className="text-muted-foreground">{!presents.length ? 'Подарков пока нет' : 'В этой категории пока нет подарков'}</p>
      : layout === 'list'
        ? <div className="divide-y rounded-block border bg-card">{shown.map(p => <GiftRow key={p.id} present={p} {...context} />)}</div>
        : layout === 'tiles'
          ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{shown.map(p => <GiftTile key={p.id} present={p} {...context} />)}</div>
          : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {shown.map(p => <GiftCard key={p.id} present={p} {...context} large={mainLarge && p.isMain === true} />)}
          </div>}

    {!expanded && visible.length > limit && (
      <button type="button" onClick={() => setExpanded(true)} className="flex items-center gap-1.5 font-semibold text-primary hover:underline">
        Все подарки — ещё {visible.length - limit} в списке <ChevronRight size={16} aria-hidden />
      </button>
    )}

    <GiftDetail present={detail} context={context} onClose={() => setDetail(null)} />
  </section>
}

function MainBadge() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-caption font-bold text-primary-foreground"><Star size={11} fill="currentColor" aria-hidden />Главная мечта</span>
}

/** Карточка: 2 строки названия, 3 строки описания, «Подробнее», если не влезло. */
function GiftCard({ present, large, ...context }: Context & { present: Present; large?: boolean }) {
  const reservation = useReservation(present, context.wishlistId, context.isExample)
  const status = reservation.state
  const dim = !context.hidden && (status === 'taken' || status === 'gifted')
  const long = (present.description?.length ?? 0) > 90 || giftLinks(present).length > 1
  const cover = present.images?.[0] || present.cover
  return (
    <article className={cn(
      'flex min-w-0 flex-col overflow-hidden rounded-block border bg-card text-card-foreground',
      large && 'sm:col-span-2',
      status === 'mine' && !context.hidden && 'border-primary/60',
    )}>
      <button type="button" onClick={() => context.onDetails(present)} className="relative block text-left" aria-label={`Подробнее: ${present.title}`}>
        <CardCover cover={cover} letter={present.title} title={present.title} className={cn('rounded-none', large ? 'h-64' : 'h-44', dim && 'opacity-40')} />
        {present.isMain && <span className="absolute left-3 top-3"><MainBadge /></span>}
      </button>
      <div className={cn('flex flex-1 flex-col gap-2 p-4', dim && 'opacity-60')}>
        <h3 className={cn('heading line-clamp-2 font-bold leading-snug [overflow-wrap:anywhere]', large ? 'text-title' : 'text-title-xs')}>{present.title}</h3>
        {present.price != null && <p className={cn('font-bold', dim ? 'text-muted-foreground' : 'text-primary')}>{formatPrice(present.price)}</p>}
        {present.description && <p className="line-clamp-3 whitespace-pre-line text-body-sm text-muted-foreground [overflow-wrap:anywhere]">{present.description}</p>}
        {long && <button type="button" onClick={() => context.onDetails(present)} className="self-start text-body-sm font-semibold text-primary hover:underline">Подробнее</button>}
      </div>
      <div className="p-4 pt-0">
        <GiftAction present={present} reservation={reservation} context={context} />
      </div>
    </article>
  )
}

/** Список — по одной строке, стрелка открывает подарок. */
function GiftRow({ present, ...context }: Context & { present: Present }) {
  const reservation = useReservation(present, context.wishlistId, context.isExample)
  const dim = !context.hidden && (reservation.state === 'taken' || reservation.state === 'gifted')
  return (
    <div className={cn('flex items-center gap-4 p-3 pr-4', dim && 'opacity-60')}>
      <CardCover cover={present.images?.[0] || present.cover} letter={present.title} className="h-14 w-14 shrink-0 rounded-block" />
      <button type="button" onClick={() => context.onDetails(present)} className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold">{present.title}</span>
          {present.isMain && <Star size={13} className="shrink-0 text-primary" fill="currentColor" aria-label="Главная мечта" />}
        </div>
        {present.description && <p className="truncate text-body-sm text-muted-foreground">{present.description}</p>}
      </button>
      {present.price != null && <span className="shrink-0 font-bold text-primary">{formatPrice(present.price)}</span>}
      <div className="hidden shrink-0 sm:block"><GiftAction present={present} reservation={reservation} context={context} compact /></div>
      <button type="button" aria-label={`Открыть: ${present.title}`} onClick={() => context.onDetails(present)} className="shrink-0 text-muted-foreground"><ChevronRight size={18} aria-hidden /></button>
    </div>
  )
}

/** Плитка — фото и цена; название по наведению, значок «есть описание». */
function GiftTile({ present, ...context }: Context & { present: Present }) {
  const status = useReservation(present, context.wishlistId, context.isExample).state
  const dim = !context.hidden && (status === 'taken' || status === 'gifted')
  return (
    <button type="button" onClick={() => context.onDetails(present)} className="group relative block overflow-hidden rounded-block border text-left">
      <CardCover cover={present.images?.[0] || present.cover} letter={present.title} className={cn('aspect-square h-auto rounded-none', dim && 'opacity-40')} />
      {present.description && <StickyNote size={15} className="absolute right-2.5 top-2.5 text-white drop-shadow" aria-label="Есть описание" />}
      {present.isMain && <span className="absolute left-2.5 top-2.5"><MainBadge /></span>}
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 pt-10 text-white">
        <span className="line-clamp-2 text-body-sm font-semibold opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{present.title}</span>
        <span className="text-body-sm font-bold">{formatPrice(present.price)}</span>
        {!context.hidden && status !== 'free' && <span className="ml-2 text-caption opacity-80">· {status === 'gifted' ? 'подарено' : status === 'mine' ? 'вы дарите' : 'занято'}</span>}
      </span>
    </button>
  )
}

/**
 * Действие под подарком. Гость: «Забронировать» → «Как вас подписать?» →
 * «Вы дарите · Отменить». Чужая бронь — «Дарит Аня» или «Уже дарят»,
 * подаренный — «Уже подарено». Владелец видит только факт брони.
 */
function GiftAction({ present, reservation, context, compact }: {
  present: Present
  reservation: ReturnType<typeof useReservation>
  context: Context
  compact?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [santa, setSanta] = useState(false)
  // Пришли из конверта Тайного Санты — бронь по умолчанию без имени.
  useEffect(() => {
    if (isFromSanta(window.location.search)) {
      setSanta(true)
      setAnonymous(true)
    }
  }, [])
  const group = useGroupJoin(present, context.wishlistId, context.isExample)
  const links = giftLinks(present)
  const state = reservation.state

  if (context.hidden) {
    return links.length ? <ShopLink link={links[0]} /> : null
  }
  if (present.type === 'group' && state !== 'gifted') {
    return <div className="space-y-1.5">
      {!context.owner && <Button className="w-full" size={compact ? 'sm' : 'default'} loading={group.isPending} variant={group.joined ? 'outline' : 'default'} onClick={group.toggle}>{group.joined ? 'Не участвую' : 'Скинусь'}</Button>}
      <p className="text-center text-caption text-muted-foreground">{group.count} {pluralRu(group.count, ['человек', 'человека', 'человек'])} уже {pluralRu(group.count, ['скидывается', 'скидываются', 'скидываются'])}</p>
    </div>
  }
  if (state === 'gifted') {
    return <p className="flex items-center gap-1.5 text-body-sm text-muted-foreground"><Gift size={15} aria-hidden />Уже подарено</p>
  }
  if (context.owner) {
    return <p className="text-body-sm text-muted-foreground">{state === 'free' ? 'Свободен' : 'Занят'}</p>
  }
  if (state === 'mine') {
    return <div className="flex h-10 items-center justify-between gap-2 rounded-block border border-primary/50 px-3">
      <span className="flex items-center gap-1.5 text-body-sm font-semibold text-primary"><Check size={15} aria-hidden />Вы дарите</span>
      <button type="button" onClick={reservation.release} disabled={reservation.isPending} className="text-caption font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50">Отменить</button>
    </div>
  }
  if (state === 'taken') {
    return <p className="flex items-center gap-1.5 text-body-sm text-muted-foreground"><Lock size={14} aria-hidden />{takenLabel(present)}</p>
  }
  if (editing) {
    return <form
      className="space-y-2"
      onSubmit={e => {
        e.preventDefault()
        const target = e.currentTarget
        reservation.reserve(name.trim(), anonymous, () => {
          setEditing(false)
          context.onReserved(present)
          if (context.confetti) burstConfetti(target)
        })
      }}
    >
      <label className="block space-y-1 text-body-sm">
        <span className="font-semibold">Как вас подписать?</span>
        <Input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Имя" maxLength={60} disabled={anonymous} />
      </label>
      <label className="flex items-center gap-2 text-body-sm text-muted-foreground">
        <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
        Анонимно
      </label>
      {santa && <p className="text-caption text-muted-foreground">Вы Тайный Санта — бронь без имени, подопечный не узнает, кто дарит.</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1" loading={reservation.isPending}>Готово</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>Отмена</Button>
      </div>
    </form>
  }
  return <div className="flex items-center gap-2">
    <Button className="flex-1" size={compact ? 'sm' : 'default'} onClick={() => setEditing(true)}>Забронировать</Button>
    {links.length > 0 && !compact && (
      <Button variant="outline" size="icon" asChild>
        <a href={links[0]} target="_blank" rel="noopener noreferrer" aria-label={`Открыть в магазине ${shopName(links[0])}`}><ExternalLink size={16} aria-hidden /></a>
      </Button>
    )}
  </div>
}

function ShopLink({ link }: { link: string }) {
  return <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-primary hover:underline">
    {shopName(link)} <ExternalLink size={13} aria-hidden />
  </a>
}

/** Подарок целиком — боковая панель: полное описание, все магазины и бронь. */
function GiftDetail({ present, context, onClose }: { present: Present | null; context: Context; onClose: () => void }) {
  return (
    <Sheet open={Boolean(present)} onOpenChange={open => { if (!open) onClose() }}>
      <SheetContent side="right" className={cn('w-full overflow-y-auto sm:max-w-[440px]', context.theme.className)} style={context.theme.style}>
        {present && <GiftDetailBody present={present} context={context} />}
      </SheetContent>
    </Sheet>
  )
}

function GiftDetailBody({ present, context }: { present: Present; context: Context }) {
  const reservation = useReservation(present, context.wishlistId, context.isExample)
  const links = giftLinks(present)
  const images = present.images?.length ? present.images : present.cover ? [present.cover] : []
  return (
    <div className="space-y-5 pt-6 text-foreground">
      <CardCover cover={images[0] ?? ''} letter={present.title} title={present.title} className="h-60 rounded-block" />
      {present.isMain && <MainBadge />}
      <SheetTitle className="heading text-title font-extrabold [overflow-wrap:anywhere]">{present.title}</SheetTitle>
      {present.price != null && <p className="text-title-sm font-bold text-primary">{formatPrice(present.price)}</p>}
      {present.description && <div className="space-y-3 whitespace-pre-wrap leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">{present.description}</div>}
      {links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {links.map(link => (
            <a key={link} href={link} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-body-sm hover:border-primary">
              {shopName(link)} <ExternalLink size={13} aria-hidden />
            </a>
          ))}
        </div>
      )}
      <GiftAction present={present} reservation={reservation} context={context} />
    </div>
  )
}
