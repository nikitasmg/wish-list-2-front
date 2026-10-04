'use client'

import { pluralRu } from '@/shared/event-date'
import * as React from 'react'
import { useEffect, useState } from 'react'

/**
 * Обратный отсчёт до праздника.
 *
 * Считается только на клиенте: на сервере «осталось» вычислилось бы в момент
 * рендера и приехало бы к гостю уже неверным, а расхождение разметки дало бы
 * ошибку гидратации.
 */
export function Countdown({ target, live = false }: { target: string; live?: boolean }) {
  const [left, setLeft] = useState<number | null>(null)

  useEffect(() => {
    const date = new Date(target).getTime()
    if (Number.isNaN(date)) return

    const tick = () => setLeft(date - Date.now())
    tick()
    // Раз в минуту, если организатор не включил «живой таймер»: без секунд
    // будить вкладку каждую секунду незачем.
    const timer = setInterval(tick, live ? 1000 : 60_000)
    return () => clearInterval(timer)
  }, [target, live])

  if (left === null || left <= 0) return null

  const minutes = Math.floor(left / 60_000)
  const parts = [
    { value: Math.floor(minutes / (60 * 24)), forms: ['день', 'дня', 'дней'] as [string, string, string] },
    { value: Math.floor(minutes / 60) % 24, forms: ['час', 'часа', 'часов'] as [string, string, string] },
    { value: minutes % 60, forms: ['минута', 'минуты', 'минут'] as [string, string, string] },
    ...(live ? [{ value: Math.floor(left / 1000) % 60, forms: ['секунда', 'секунды', 'секунд'] as [string, string, string] }] : []),
  ]

  return (
    <div className="flex items-center gap-6 sm:gap-10">
      {parts.map((part, index) => (
        <React.Fragment key={part.forms[0]}>
          {index > 0 && <span className="w-px h-10 bg-border" aria-hidden />}
          <div className="text-center">
            <div className="heading text-title-lg font-extrabold tabular-nums">
              {String(part.value).padStart(2, '0')}
            </div>
            <div className="text-caption text-muted-foreground">{pluralRu(part.value, part.forms)}</div>
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}
