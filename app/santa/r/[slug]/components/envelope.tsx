'use client'

import { Button } from '@/components/ui/button'
import type { SantaInvite, SantaReceiver } from '@/shared/types'
import { Star } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { RoomChips } from '../../../components/room-chips'
import { WardWishlist } from './ward-wishlist'

export function Envelope({ slug, room, receiver, ready, children }: {
  slug: string
  room: SantaInvite
  receiver: SantaReceiver | null
  ready: boolean
  /** Показывается только после вскрытия: там имя подопечного. */
  children?: ReactNode
}) {
  // Флаг привязан к жеребьёвке: после перезапуска drawnAt другой, конверт снова закрыт.
  const prefix = `santa:${slug}:opened`
  const key = `${prefix}:${room.drawnAt ?? ''}`
  const [opened, setOpened] = useState<boolean | null>(null)
  const [restarted, setRestarted] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(key) === '1') {
        setOpened(true)
        return
      }
      // Флага для текущей жеребьёвки нет, но этот конверт открывали раньше
      // (старый ключ, в том числе без drawnAt) — организатор перезапустил её.
      let hadOlder = false
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k !== key && (k === prefix || k.startsWith(`${prefix}:`))) {
          hadOlder = true
          break
        }
      }
      setRestarted(hadOlder)
      setOpened(false)
    } catch {
      setOpened(false)
    }
  }, [key, prefix])

  const reveal = () => {
    setOpened(true)
    try {
      localStorage.setItem(key, '1')
    } catch {
      // откроется снова при следующем визите — не страшно
    }
  }

  if (!receiver) {
    return (
      <p className="text-body text-muted-foreground">
        {ready
          ? 'Вы не попали в жеребьёвку: канал подключён уже после неё. Напишите организатору — пусть перезапустит жеребьёвку, и вы попадёте в пары.'
          : 'Вы не попали в жеребьёвку: к её началу не была подтверждена почта или Telegram. Подключите канал ниже и напишите организатору — он может перезапустить жеребьёвку.'}
      </p>
    )
  }

  if (opened === null) return null

  if (!opened) {
    return (
      <section className="flex flex-col items-center gap-7 py-10 text-center">
        {restarted && (
          <p role="status" className="max-w-sm rounded-control border border-border bg-card px-4 py-3 text-body-sm">
            Организатор перезапустил жеребьёвку — у вас новый подопечный.
          </p>
        )}
        <div aria-hidden className="flex h-40 w-60 items-center justify-center rounded-card bg-festive shadow-overlay">
          <Star className="size-12 text-tone-gold" fill="currentColor" />
        </div>
        <h1 className="text-title-lg">Жеребьёвка прошла</h1>
        <p className="max-w-sm text-lead text-muted-foreground">
          Внутри — имя того, кому вы дарите. Откройте, когда никто не подглядывает.
        </p>
        <Button variant="festive" size="xl" onClick={reveal}>Открыть конверт</Button>
      </section>
    )
  }

  return (
    <>
      <section className="space-y-6" aria-live="polite">
        <div>
          <p className="text-lead text-muted-foreground">Вы — Тайный Санта для</p>
          <h1 className="mt-2 text-display-sm">{receiver.name}</h1>
        </div>
        <RoomChips budget={room.budget} exchangeDate={room.exchangeDate} />
        {receiver.wishes ? (
          <div className="space-y-2 rounded-card border border-border bg-card p-5">
            <p className="text-eyebrow uppercase text-muted-foreground">Пожелания</p>
            <p className="whitespace-pre-line break-words text-body">{receiver.wishes}</p>
          </div>
        ) : (
          <p className="text-body text-muted-foreground">Пожеланий нет — придётся угадывать. Посмотрите, нет ли вишлиста.</p>
        )}
        <WardWishlist name={receiver.name} url={receiver.wishlistUrl} />
      </section>
      {children}
    </>
  )
}
