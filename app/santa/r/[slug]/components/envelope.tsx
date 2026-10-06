'use client'

import { Button } from '@/components/ui/button'
import type { SantaInvite, SantaReceiver } from '@/shared/types'
import { ExternalLink, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RoomChips } from '../../../components/room-chips'

const isHttpUrl = (value: string) => /^https?:\/\/[^\s/]+/i.test(value)

export function Envelope({ slug, room, receiver }: { slug: string; room: SantaInvite; receiver: SantaReceiver | null }) {
  const key = `santa:${slug}:opened`
  const [opened, setOpened] = useState(false)

  useEffect(() => {
    try {
      setOpened(localStorage.getItem(key) === '1')
    } catch {
      setOpened(false)
    }
  }, [key])

  const reveal = () => {
    setOpened(true)
    try {
      localStorage.setItem(key, '1')
    } catch {
      // откроется снова при следующем визите — не страшно
    }
  }

  if (!receiver) {
    return <p className="text-body text-muted-foreground">Пары обновляются — загляните чуть позже.</p>
  }

  if (!opened) {
    return (
      <section className="flex flex-col items-center gap-7 py-10 text-center">
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
      {receiver.wishlistUrl && isHttpUrl(receiver.wishlistUrl) && (
        <Button asChild variant="secondary" size="lg">
          <a href={receiver.wishlistUrl} target="_blank" rel="noopener noreferrer nofollow">
            <ExternalLink aria-hidden />
            Открыть вишлист
          </a>
        </Button>
      )}
    </section>
  )
}
