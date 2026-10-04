'use client'

import { Block } from '@/shared/types'
import { pluralizeRu } from '@/lib/utils'
import { TimerIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'

function getTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return null
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return { days, hours, minutes, seconds }
}

export function TimingBlockView({ block }: { block: Block }) {
  const end = block.data.end as string | undefined
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(null)
  const [past, setPast] = useState(false)

  useEffect(() => {
    if (!end) return
    const endDate = new Date(end)

    const tick = () => {
      const tl = getTimeLeft(endDate)
      setTimeLeft(tl)
      setPast(tl === null)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [end])

  if (!end) return null

  const endDate = new Date(end)
  const formattedDate = endDate.toLocaleString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="flex flex-col gap-4 bg-card p-6 rounded-block shadow-float max-w-md">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-block flex items-center justify-center shrink-0">
          <TimerIcon className="w-5 h-5 text-primary" />
        </div>
        <p className="text-body-sm text-muted-foreground">{formattedDate}</p>
      </div>

      {!past && timeLeft && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { unit: 'days', value: timeLeft.days, label: pluralizeRu(timeLeft.days, ['день', 'дня', 'дней']) },
            { unit: 'hours', value: timeLeft.hours, label: pluralizeRu(timeLeft.hours, ['час', 'часа', 'часов']) },
            { unit: 'minutes', value: timeLeft.minutes, label: pluralizeRu(timeLeft.minutes, ['минута', 'минуты', 'минут']) },
            { unit: 'seconds', value: timeLeft.seconds, label: pluralizeRu(timeLeft.seconds, ['секунда', 'секунды', 'секунд']) },
          ].map(({ unit, value, label }) => (
            <div key={unit} className="bg-primary/10 rounded-block px-4 py-2 text-center min-w-[60px]">
              <p className="text-title font-bold text-primary tabular-nums">{String(value).padStart(2, '0')}</p>
              <p className="text-caption text-muted-foreground uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      )}

      {past && (
        <p className="text-title-xs font-semibold text-muted-foreground">Уже прошло</p>
      )}
    </div>
  )
}
