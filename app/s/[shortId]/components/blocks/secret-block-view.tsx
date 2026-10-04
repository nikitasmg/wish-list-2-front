'use client'
import { Button } from '@/components/ui/button'
import { pluralRu } from '@/shared/event-date'
import { Block } from '@/shared/types'
import { LockKeyhole } from 'lucide-react'
import { useEffect, useState } from 'react'

/**
 * Секрет до даты. «Замок и таймер» показывает отсчёт, «только замок» — одну
 * надпись: дату бэк в этом режиме не отдаёт вовсе. Режим «ничего» сюда не
 * доходит — такой блок бэк не присылает.
 */
export function SecretBlockView({ block }: { block: Pick<Block, 'revealAt' | 'secretMode' | 'secretText'> }) {
  const [now, setNow] = useState<number | null>(null)
  const timed = Boolean(block.revealAt) && block.secretMode !== 'lock'
  useEffect(() => {
    if (!timed) return
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [timed])
  const seconds = !timed || now === null ? null : Math.max(0, Math.floor((new Date(block.revealAt!).getTime() - now) / 1000))
  const parts: [number, [string, string, string]][] = seconds === null ? [] : [
    [Math.floor(seconds / 86400), ['день', 'дня', 'дней']],
    [Math.floor(seconds / 3600) % 24, ['час', 'часа', 'часов']],
    [Math.floor(seconds / 60) % 60, ['минута', 'минуты', 'минут']],
  ]

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 rounded-block border bg-card p-8 text-center text-card-foreground">
      <LockKeyhole className="text-muted-foreground" size={26} aria-hidden />
      <p className="heading text-title-xs font-bold">{block.secretText || 'Секрет откроется на празднике'}</p>
      {seconds === 0 && <Button onClick={() => window.location.reload()}>Открыть сюрприз</Button>}
      {seconds !== null && seconds > 0 && (
        <div className="flex gap-5">
          {parts.map(([value, forms]) => (
            <div key={forms[0]}>
              <div className="heading text-title font-extrabold tabular-nums">{String(value).padStart(2, '0')}</div>
              <div className="text-caption text-muted-foreground">{pluralRu(value, forms)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
