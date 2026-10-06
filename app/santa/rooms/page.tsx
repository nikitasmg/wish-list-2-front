'use client'

import { useApiSantaRooms } from '@/api/santa'
import { Button } from '@/components/ui/button'
import { formatBudget, formatDay, participantsLabel } from '@/shared/santa'
import { santaHref } from '@/shared/santa-route'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function SantaRoomsPage() {
  const { data, isLoading, isError } = useApiSantaRooms()
  const rooms = data?.data ?? []

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-title-lg">Мои комнаты</h1>
        <Button asChild variant="festive" size="lg">
          <Link href={santaHref('/rooms/new')}><Plus aria-hidden />Новая комната</Link>
        </Button>
      </div>

      {isLoading && <p className="text-body text-muted-foreground">Загружаем комнаты…</p>}

      {isError && (
        <p className="text-body text-muted-foreground">
          Не удалось загрузить комнаты. Обновите страницу и попробуйте ещё раз.
        </p>
      )}

      {!isLoading && !isError && rooms.length === 0 && (
        <p className="text-body text-muted-foreground">
          Комнат пока нет. Создайте первую и отправьте ссылку друзьям.
        </p>
      )}

      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map(room => {
          const day = formatDay(room.exchangeDate)
          // Участнику — его карточка с конвертом, организатору — управление.
          const href = room.isOwner ? `/rooms/${room.id}` : `/r/${room.slug}`
          return (
            <li key={room.id}>
              <Link
                href={santaHref(href)}
                className="flex h-full flex-col gap-3 rounded-card border border-border bg-card p-6 transition-colors duration-fast hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="text-label text-muted-foreground">
                  {room.isOwner ? 'Вы организатор' : 'Вы участник'} · {room.status === 'drawn' ? 'жеребьёвка прошла' : 'идёт сбор'}
                </span>
                <span className="text-title">{room.title}</span>
                <span className="text-body-sm text-muted-foreground">
                  {participantsLabel(room.participantsCount)} · {formatBudget(room.budget)}{day ? ` · обмен ${day}` : ''}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
