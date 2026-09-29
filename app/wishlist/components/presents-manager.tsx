'use client'

import { useApiRemovePresent } from '@/api/present'
import { PresentModal } from '@/app/wishlist/components/present-modal'
import { CardCover } from '@/components/card-cover'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ToastAction } from '@/components/ui/toast'
import { toast } from '@/hooks/use-toast'
import { cn, linkHostname, pluralizeRu } from '@/lib/utils'
import { Present, Wishlist } from '@/shared/types'
import { Ellipsis, Gift, Plus } from 'lucide-react'
import * as React from 'react'
import { useState } from 'react'

/**
 * Управление подарками.
 *
 * Список стал таблицей: цена, магазин и статус видны сразу, без раскрытия
 * карточек — владелец приходит сюда проверить, что уже занято, а не любоваться
 * обложками. Обложки остаются в превью справа, там они и нужны.
 */
export function PresentsManager({ wishlist, presents }: { wishlist: Wishlist; presents: Present[] }) {
  const [editing, setEditing] = useState<Present | undefined>()
  const [open, setOpen] = useState(false)
  const { mutate: removePresent } = useApiRemovePresent(wishlist.id)

  // Подарки, добавленные в этот заход: помечаем «новый», чтобы в длинном
  // списке было видно, что именно только что появилось.
  const [freshIds, setFreshIds] = useState<string[]>([])

  const add = () => { setEditing(undefined); setOpen(true) }

  const afterCreate = (present: Present) => {
    setFreshIds(ids => [...ids, present.id])
    toast({
      title: 'Подарок добавлен в вишлист',
      action: (
        <div className="flex gap-2">
          <ToastAction
            altText="Отменить добавление"
            onClick={() => {
              removePresent({ presentId: present.id })
              setFreshIds(ids => ids.filter(id => id !== present.id))
            }}
          >
            Отменить
          </ToastAction>
          <ToastAction altText="Добавить ещё подарок" onClick={add}>
            Добавить ещё
          </ToastAction>
        </div>
      ),
    })
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight">Подарки</h2>
          <span className="text-sm text-muted-foreground">
            {presents.length} {pluralizeRu(presents.length, ['подарок', 'подарка', 'подарков'])} в списке
          </span>
          <Button className="ml-auto" onClick={add}>
            <Plus size={17} className="mr-1.5" aria-hidden />
            Добавить подарок
          </Button>
        </div>

        {presents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
            <Gift size={28} className="text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Подарков пока нет. Гость увидит пустой список, пока вы не добавите первый.
            </p>
            <Button variant="outline" onClick={add}>Добавить подарок</Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border">
            <div className="hidden grid-cols-[minmax(0,1fr)_120px_140px_140px_44px] gap-3 border-b px-4 py-2.5 text-xs font-semibold text-muted-foreground md:grid">
              <span>Подарок</span>
              <span>Цена</span>
              <span>Магазин</span>
              <span>Статус</span>
              <span />
            </div>
            {presents.map(present => (
              <PresentRow
                key={present.id}
                present={present}
                fresh={freshIds.includes(present.id)}
                onEdit={() => { setEditing(present); setOpen(true) }}
                onDelete={() => removePresent({ presentId: present.id })}
              />
            ))}
          </div>
        )}
      </section>

      <GuestPreview presents={presents} />

      <PresentModal
        wishlistId={wishlist.id}
        present={editing}
        open={open}
        onOpenChange={setOpen}
        onCreated={afterCreate}
      />
    </div>
  )
}

function PresentRow({ present, fresh, onEdit, onDelete }: {
  present: Present
  fresh: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const cover = present.images?.[0] || present.cover
  const link = present.links?.[0] ?? present.link
  const shop = link ? linkHostname(link) : null

  const status = present.type === 'group'
    ? `${present.participantsCount ?? 0} ${pluralizeRu(present.participantsCount ?? 0, ['участник', 'участника', 'участников'])}`
    : present.reserved ? 'занят' : 'свободен'

  return (
    <div className={cn(
      'grid grid-cols-1 items-center gap-2 border-b px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1fr)_120px_140px_140px_44px] md:gap-3',
      fresh && 'bg-primary/5',
    )}>
      <div className="flex min-w-0 items-center gap-3">
        {cover ? (
          <CardCover cover={cover} title={present.title} className="h-11 w-11 shrink-0 rounded-lg" />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Gift size={18} aria-hidden />
          </span>
        )}
        <span className="truncate text-[15px] font-semibold">{present.title}</span>
        {present.type && present.type !== 'single' && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {present.type === 'group' ? 'групповой' : 'набор'}
          </span>
        )}
        {fresh && (
          <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">
            новый
          </span>
        )}
      </div>

      <span className="text-[15px] font-semibold text-primary">
        {present.price != null ? `${present.price.toLocaleString('ru-RU')} ₽` : '—'}
      </span>

      <span className="truncate text-sm text-muted-foreground">
        {shop ?? '—'}
      </span>

      <span className={cn('text-sm', present.reserved ? 'text-muted-foreground' : 'text-foreground')}>
        {status}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger aria-label={`Действия с подарком «${present.title}»`} className="justify-self-start md:justify-self-center">
          <Ellipsis size={18} className="text-muted-foreground" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>Редактировать</DropdownMenuItem>
          {link && (
            <DropdownMenuItem asChild>
              <a href={link} target="_blank" rel="noopener noreferrer">Открыть в магазине</a>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => {
              if (window.confirm(`Удалить «${present.title}»? Бронь гостя тоже пропадёт.`)) onDelete()
            }}
          >
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/** «Так увидят гости» — чтобы правка списка сразу была видна в том же виде. */
function GuestPreview({ presents }: { presents: Present[] }) {
  return (
    <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
      <span className="text-xs text-muted-foreground">Так увидят гости</span>
      <div className="rounded-3xl border-4 bg-card p-4">
        <div className="mb-3 text-xl font-extrabold tracking-tight text-primary">Вишлист</div>
        {presents.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Подарков пока нет</p>
        ) : (
          presents.slice(0, 6).map(present => (
            <div key={present.id} className="flex items-center gap-2.5 border-t py-2.5">
              <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                {(present.images?.[0] || present.cover) && (
                  <CardCover
                    cover={present.images?.[0] || present.cover}
                    title={present.title}
                    className="h-10 w-10 rounded-lg"
                  />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold">{present.title}</span>
                {present.price != null && (
                  <span className="block text-xs text-primary">{present.price.toLocaleString('ru-RU')} ₽</span>
                )}
              </span>
              <span className="shrink-0 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground">
                {present.reserved ? 'занят' : 'Беру'}
              </span>
            </div>
          ))
        )}
        {presents.length > 6 && (
          <p className="border-t pt-2.5 text-center text-xs text-muted-foreground">
            и ещё {presents.length - 6}
          </p>
        )}
      </div>
    </aside>
  )
}
