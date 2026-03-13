'use client'

import { Block } from '@/shared/types'
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
    <div className="flex flex-col gap-4 bg-card p-6 rounded-2xl shadow-md max-w-md">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
          <TimerIcon className="w-5 h-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">{formattedDate}</p>
      </div>

      {!past && timeLeft && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: timeLeft.days, label: 'дней' },
            { value: timeLeft.hours, label: 'часов' },
            { value: timeLeft.minutes, label: 'минут' },
            { value: timeLeft.seconds, label: 'секунд' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-primary/10 rounded-xl px-4 py-2 text-center min-w-[60px]">
              <p className="text-2xl font-bold text-primary tabular-nums">{String(value).padStart(2, '0')}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      )}

      {past && (
        <p className="text-lg font-semibold text-muted-foreground">Уже прошло</p>
      )}
    </div>
  )
}
