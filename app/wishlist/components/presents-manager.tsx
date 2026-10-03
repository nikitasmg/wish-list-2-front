'use client'

import { useApiEditPresent, useApiRemovePresent, useApiReorderPresents, useApiSetGifted } from '@/api/present'
import { PresentModal } from '@/app/wishlist/components/present-modal'
import { CardCover } from '@/components/card-cover'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ToastAction } from '@/components/ui/toast'
import { toast } from '@/hooks/use-toast'
import { cn, pluralizeRu } from '@/lib/utils'
import { formatPrice, giftLinks, giftStatus, shopName, sortGifts } from '@/shared/gifts'
import { pageLook } from '@/shared/look'
import { Present, Wishlist } from '@/shared/types'
import { DndContext, DragEndEvent, PointerSensor, closestCenter, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { Ellipsis, Gift, GripVertical, Plus, Star } from 'lucide-react'
import * as React from 'react'
import { useEffect, useState } from 'react'

/** Форма подарка целиком: PUT заменяет все поля, частичная затёрла бы остальное. */
export function presentForm(present: Present, patch: Partial<Present> = {}): FormData {
  const p = { ...present, ...patch }
  const form = new FormData()
  form.append('title', p.title)
  if (p.description) form.append('description', p.description)
  if (p.link) form.append('link', p.link)
  if (p.price != null) form.append('price', String(p.price))
  if (p.cover) form.append('cover_url', p.cover)
  form.append('type', p.type ?? 'single')
  form.append('is_main', String(Boolean(p.isMain)))
  if (p.type === 'multi') {
    form.append('images', JSON.stringify(p.images ?? []))
    form.append('links', JSON.stringify(p.links ?? []))
  }
  return form
}

/**
 * Экран «Подарки» по макету: таблица с ценой, магазином и статусом, порядок
 * перетаскиванием, ★ главная мечта всегда первой, «Так увидят гости» справа.
 */
export function PresentsManager({ wishlist, presents, autoAdd }: { wishlist: Wishlist; presents: Present[]; autoAdd?: boolean }) {
  const [editing, setEditing] = useState<Present | undefined>()
  // «+» на карточке кабинета открывает форму сразу, без захода в конструктор.
  const [open, setOpen] = useState(Boolean(autoAdd))
  const { mutate: removePresent } = useApiRemovePresent(wishlist.id)
  const { mutate: reorder } = useApiReorderPresents(wishlist.id)
  const { mutate: setGifted } = useApiSetGifted(wishlist.id)
  const { mutate: edit } = useApiEditPresent(wishlist.id)

  // Порядок держим у себя, чтобы строка встала на место сразу, а не после
  // ответа сервера.
  const [order, setOrder] = useState<string[]>(() => sortGifts(presents).map(p => p.id))
  useEffect(() => { setOrder(sortGifts(presents).map(p => p.id)) }, [presents])
  const byId = new Map(presents.map(p => [p.id, p]))
  const list = order.map(id => byId.get(id)).filter((p): p is Present => Boolean(p))

  const [freshIds, setFreshIds] = useState<string[]>([])
  const add = () => { setEditing(undefined); setOpen(true) }
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const eventPassed = wishlist.eventDate ? new Date(wishlist.eventDate).getTime() < Date.now() : false
  const takenNotGifted = presents.filter(p => p.reserved && !p.gifted)

  const afterCreate = (present: Present) => {
    setFreshIds(ids => [...ids, present.id])
    toast({
      title: 'Подарок добавлен в вишлист',
      action: (
        <div className="flex gap-2">
          <ToastAction altText="Отменить добавление" onClick={() => { removePresent({ presentId: present.id }); setFreshIds(ids => ids.filter(id => id !== present.id)) }}>
            Отменить
          </ToastAction>
          <ToastAction altText="Добавить ещё подарок" onClick={add}>Добавить ещё</ToastAction>
        </div>
      ),
    })
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = order.indexOf(String(active.id))
    const to = order.indexOf(String(over.id).replace(/^drop:/, ''))
    if (from < 0 || to < 0) return
    const next = [...order]
    next.splice(to, 0, next.splice(from, 1)[0])
    // Главная мечта всё равно первая — перетаскивать её вниз бессмысленно.
    const main = presents.find(p => p.isMain)
    const final = main ? [main.id, ...next.filter(id => id !== main.id)] : next
    setOrder(final)
    reorder({ ids: final })
  }

  return (
    <div className="mx-auto grid max-w-[1280px] gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Подарки</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {presents.length} {pluralizeRu(presents.length, ['подарок', 'подарка', 'подарков'])} в списке · порядок меняется перетаскиванием
            </p>
          </div>
          <Button className="ml-auto" onClick={add}>
            <Plus size={17} className="mr-1.5" aria-hidden />
            Добавить подарок
          </Button>
        </div>

        {eventPassed && takenNotGifted.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-muted/40 p-4 text-sm">
            <Gift size={18} className="text-primary" aria-hidden />
            <span className="flex-1">Праздник прошёл. Отметить {takenNotGifted.length} {pluralizeRu(takenNotGifted.length, ['занятый подарок', 'занятых подарка', 'занятых подарков'])} подаренными?</span>
            <Button size="sm" variant="outline" onClick={() => takenNotGifted.forEach(p => setGifted({ presentId: p.id, gifted: true }))}>Отметить</Button>
          </div>
        )}

        {presents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
            <Gift size={28} className="text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">Подарков пока нет. Гость увидит пустой список, пока вы не добавите первый.</p>
            <Button variant="outline" onClick={add}>Добавить подарок</Button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <div className="overflow-hidden rounded-2xl border">
              <div className="hidden grid-cols-[20px_minmax(0,1fr)_110px_130px_130px_36px] gap-3 border-b px-4 py-2.5 text-xs font-semibold text-muted-foreground md:grid">
                <span /><span>Подарок</span><span>Цена</span><span>Где купить</span><span>Статус</span><span />
              </div>
              {list.map(present => (
                <PresentRow
                  key={present.id}
                  present={present}
                  fresh={freshIds.includes(present.id)}
                  onEdit={() => { setEditing(present); setOpen(true) }}
                  onDelete={() => removePresent({ presentId: present.id })}
                  onGifted={gifted => setGifted({ presentId: present.id, gifted })}
                  onMain={() => edit({ id: present.id, data: presentForm(present, { isMain: !present.isMain }) })}
                />
              ))}
            </div>
          </DndContext>
        )}
      </section>

      <GuestPreview wishlist={wishlist} presents={list} />

      <PresentModal wishlistId={wishlist.id} present={editing} open={open} onOpenChange={setOpen} onCreated={afterCreate} />
    </div>
  )
}

function PresentRow({ present, fresh, onEdit, onDelete, onGifted, onMain }: {
  present: Present
  fresh: boolean
  onEdit: () => void
  onDelete: () => void
  onGifted: (gifted: boolean) => void
  onMain: () => void
}) {
  const { attributes, listeners, setNodeRef: dragRef, isDragging, transform } = useDraggable({ id: present.id, disabled: present.isMain })
  const { setNodeRef: dropRef, isOver } = useDroppable({ id: `drop:${present.id}` })
  const links = giftLinks(present)
  const status = giftStatus(present)
  const label = present.type === 'group'
    ? `${present.participantsCount ?? 0} ${pluralizeRu(present.participantsCount ?? 0, ['участник', 'участника', 'участников'])}`
    : status === 'gifted' ? 'Подарено' : status === 'free' ? 'Свободен' : 'Занят'

  return (
    <div
      ref={node => { dragRef(node); dropRef(node) }}
      style={transform ? { transform: `translate3d(0, ${transform.y}px, 0)` } : undefined}
      className={cn(
        'relative grid grid-cols-[20px_minmax(0,1fr)_36px] items-center gap-3 border-b bg-background px-4 py-3 last:border-b-0 md:grid-cols-[20px_minmax(0,1fr)_110px_130px_130px_36px]',
        fresh && 'bg-primary/5',
        isDragging && 'z-10 shadow-xl',
        isOver && !isDragging && 'shadow-[inset_0_2px_0_hsl(var(--primary))]',
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={present.isMain ? 'Главная мечта всегда первая' : `Перетащить «${present.title}»`}
        disabled={present.isMain}
        className="flex h-8 cursor-grab touch-none items-center justify-center text-muted-foreground/60 hover:text-foreground disabled:cursor-default disabled:opacity-30"
      >
        <GripVertical size={15} aria-hidden />
      </button>

      <button type="button" onClick={onEdit} className="flex min-w-0 items-center gap-3 text-left">
        <CardCover cover={present.images?.[0] || present.cover} letter={present.title} title={present.title} className="h-11 w-11 shrink-0 rounded-lg" />
        <span className="truncate text-[15px] font-semibold">{present.title}</span>
        {present.isMain && <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary"><Star size={10} fill="currentColor" aria-hidden />главная мечта</span>}
        {present.type && present.type !== 'single' && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{present.type === 'group' ? 'вскладчину' : 'набор'}</span>}
        {fresh && <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">новый</span>}
      </button>

      <span className="hidden text-[15px] font-semibold text-primary md:block">{formatPrice(present.price) || '—'}</span>
      <span className="hidden truncate text-sm text-muted-foreground md:block">{links[0] ? shopName(links[0]) : '—'}</span>
      <span className={cn('hidden text-sm md:block', status === 'free' ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>

      <DropdownMenu>
        <DropdownMenuTrigger aria-label={`Действия с подарком «${present.title}»`} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent">
          <Ellipsis size={18} className="text-muted-foreground" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>Редактировать</DropdownMenuItem>
          <DropdownMenuItem onClick={onMain}>{present.isMain ? 'Убрать «главную мечту»' : 'Сделать главной мечтой'}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onGifted(!present.gifted)}>{present.gifted ? 'Снять «Уже подарено»' : 'Отметить «Уже подарено»'}</DropdownMenuItem>
          {links[0] && <DropdownMenuItem asChild><a href={links[0]} target="_blank" rel="noopener noreferrer">Открыть в магазине</a></DropdownMenuItem>}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={() => { if (window.confirm(`Удалить «${present.title}»? Бронь гостя тоже пропадёт.`)) onDelete() }}>
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/** «Так увидят гости» — в схеме самой страницы. */
function GuestPreview({ wishlist, presents }: { wishlist: Wishlist; presents: Present[] }) {
  const look = pageLook(wishlist.settings)
  return (
    <aside className="hidden space-y-3 lg:sticky lg:top-4 lg:block lg:self-start">
      <span className="text-xs text-muted-foreground">Так увидят гости</span>
      <div className={cn('rounded-3xl border-4 bg-background p-4 text-foreground', look.className)} style={look.style}>
        <div className="heading mb-3 text-[22px] font-extrabold tracking-tight text-primary">Вишлист</div>
        {presents.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Подарков пока нет</p>
        ) : (
          presents.slice(0, 6).map(present => (
            <div key={present.id} className="flex items-center gap-2.5 border-t py-2.5">
              <CardCover cover={present.images?.[0] || present.cover} letter={present.title} title={present.title} className="h-10 w-10 shrink-0 rounded-lg" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold">{present.isMain && '★ '}{present.title}</span>
                {present.price != null && <span className="block text-xs text-primary">{formatPrice(present.price)}</span>}
              </span>
              <span className="shrink-0 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground">
                {present.gifted ? 'подарено' : present.reserved ? 'занят' : 'Беру'}
              </span>
            </div>
          ))
        )}
        {presents.length > 6 && <p className="border-t pt-2.5 text-center text-xs text-muted-foreground">и ещё {presents.length - 6}</p>}
      </div>
    </aside>
  )
}
