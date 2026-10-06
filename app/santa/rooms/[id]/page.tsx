'use client'

import {
  useApiDeleteSantaRoom, useApiRemoveSantaParticipant, useApiSantaDraw, useApiSantaRedraw, useApiSantaRoom,
} from '@/api/santa'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { MIN_PARTICIPANTS, apiErrorMessage, formatDay, participantsLabel } from '@/shared/santa'
import { SANTA_ORIGIN, santaHref } from '@/shared/santa-route'
import { Settings, Shuffle, Trash2 } from 'lucide-react'
import { isAxiosError } from 'axios'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ConfirmAction } from '../../components/confirm-action'
import { CopyField } from '../../components/copy-field'
import { RoomChips } from '../../components/room-chips'

export default function SantaRoomPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data, isError, error, refetch } = useApiSantaRoom(id)
  const draw = useApiSantaDraw(id)
  const redraw = useApiSantaRedraw(id)
  const remove = useApiRemoveSantaParticipant(id)
  const del = useApiDeleteSantaRoom(id)
  // На проде адрес известен из env; в разработке берём origin браузера после монтирования (без рассинхрона SSR).
  const [origin, setOrigin] = useState(SANTA_ORIGIN)
  useEffect(() => {
    if (!SANTA_ORIGIN) setOrigin(window.location.origin)
  }, [])

  if (isError) {
    const notFound = isAxiosError(error) && error.response?.status === 404
    return (
      <div className="space-y-4">
        <p className="text-body text-muted-foreground">{notFound ? 'Комната не найдена.' : 'Не удалось загрузить комнату'}</p>
        <div className="flex flex-wrap items-center gap-4">
          {!notFound && <Button variant="secondary" onClick={() => refetch()}>Повторить</Button>}
          <Link href={santaHref('/rooms')} className="text-body-sm text-muted-foreground hover:text-foreground">← Мои комнаты</Link>
        </div>
      </div>
    )
  }
  const details = data?.data
  if (!details) return null

  const { room, participants } = details
  const open = room.status === 'open'
  const enough = participants.length >= MIN_PARTICIPANTS
  const ownerJoined = participants.some(p => p.isOwner)
  const invitePath = santaHref(`/r/${room.slug}`)
  const inviteLink = `${origin}${invitePath}`
  const onError = (err: unknown) => toast({ variant: 'destructive', title: apiErrorMessage(err) })

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-4">
          <Link href={santaHref('/rooms')} className="text-body-sm text-muted-foreground hover:text-foreground">← Мои комнаты</Link>
          <h1 className="text-title-lg md:text-display-sm">{room.title}</h1>
          <RoomChips budget={room.budget} exchangeDate={room.exchangeDate} />
        </div>
        {open && (
          <Button asChild variant="secondary">
            <Link href={santaHref(`/rooms/${id}/edit`)}><Settings aria-hidden />Настройки</Link>
          </Button>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <section className="overflow-hidden rounded-card border border-border bg-card lg:col-span-2" aria-labelledby="people">
          <div className="flex items-center justify-between border-b border-border px-6 py-5">
            <h2 id="people" className="text-title-sm">Участники · {participants.length}</h2>
          </div>
          {participants.length === 0 && (
            <p className="px-6 py-5 text-body text-muted-foreground">Пока никого. Отправьте ссылку-приглашение.</p>
          )}
          <ul>
            {participants.map(p => (
              <li key={p.id} className="flex items-center gap-3 border-b border-border px-6 py-3.5 last:border-b-0">
                <span className="flex size-control-sm shrink-0 items-center justify-center rounded-full bg-accent text-label font-bold text-accent-foreground">
                  {p.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-semibold">{p.name}{p.isOwner ? ' · вы' : ''}</span>
                  <span className="block text-caption text-muted-foreground">
                    {[p.hasWishes && 'пожелания', p.hasWishlist && 'вишлист'].filter(Boolean).join(' + ') || 'пожеланий нет'}
                  </span>
                </span>
                {open && (
                  <ConfirmAction
                    trigger={<Button variant="ghost" size="icon-sm" loading={remove.isPending} aria-label={`Убрать ${p.name}`}><Trash2 aria-hidden /></Button>}
                    title={`Убрать ${p.name}?`}
                    description="Его имя и пожелания удалятся. Он сможет вступить снова по ссылке, пока не прошла жеребьёвка."
                    confirmLabel="Убрать"
                    onConfirm={() => remove.mutate(p.id, { onError })}
                  />
                )}
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-4">
          <section className="space-y-4 rounded-card border border-border bg-card p-6">
            <h2 className="text-title-xs">Позвать людей</h2>
            {origin && <CopyField label="Ссылка-приглашение" value={inviteLink} />}
            {!ownerJoined && open && (
              <p className="text-body-sm text-muted-foreground">
                Вы не участвуете. Чтобы участвовать, откройте{' '}
                <Link href={invitePath} className="text-primary underline-offset-4 hover:underline">приглашение</Link>.
              </p>
            )}
          </section>

          <section className="space-y-4 rounded-card border border-border bg-card p-6">
            <div className="flex items-center gap-2.5">
              <Shuffle className="size-5 text-tone-pink" aria-hidden />
              <h2 className="text-title-xs">Жеребьёвка</h2>
            </div>
            {open ? (
              <>
                <p className="text-body-sm text-muted-foreground">
                  {enough
                    ? 'Каждый получит одного подопечного. После жеребьёвки вступить в комнату и убрать участника будет нельзя.'
                    : `Нужно минимум ${participantsLabel(MIN_PARTICIPANTS)}, сейчас ${participantsLabel(participants.length)}.`}
                </p>
                <ConfirmAction
                  trigger={<Button variant="festive" size="lg" className="w-full" disabled={!enough} loading={draw.isPending}>Провести жеребьёвку</Button>}
                  title="Провести жеребьёвку?"
                  description="Пары сложатся в один круг. Состав комнаты после этого не меняется."
                  confirmLabel="Тянуть пары"
                  onConfirm={() => draw.mutate(undefined, { onError })}
                />
              </>
            ) : (
              <>
                <p className="text-body-sm text-muted-foreground">
                  Жеребьёвка прошла{room.drawnAt ? ` ${formatDay(room.drawnAt)}` : ''}. Каждый откроет своего
                  подопечного по ссылке-приглашению.
                </p>
                <ConfirmAction
                  trigger={<Button variant="secondary" className="w-full" loading={redraw.isPending}>Перезапустить жеребьёвку</Button>}
                  title="Перезапустить жеребьёвку?"
                  description="Все получат новых подопечных, старые пары пропадут. Кто уже купил подарок — расстроится."
                  confirmLabel="Перезапустить"
                  onConfirm={() => redraw.mutate(undefined, { onError })}
                />
              </>
            )}
          </section>

          <ConfirmAction
            trigger={<Button variant="ghost" className="w-full text-destructive" loading={del.isPending}>Удалить комнату</Button>}
            title="Удалить комнату?"
            description="Участники, пожелания и пары удалятся навсегда."
            confirmLabel="Удалить"
            onConfirm={() => del.mutate(undefined, { onSuccess: () => router.push(santaHref('/rooms')), onError })}
          />
        </aside>
      </div>
    </div>
  )
}
