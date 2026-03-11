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
  const start = block.data.start as string
  const end = block.data.end as string | undefined
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(null)
  const [status, setStatus] = useState<'upcoming' | 'ongoing' | 'past'>('upcoming')

  useEffect(() => {
    if (!start) return
    const startDate = new Date(start)
    const endDate = end ? new Date(end) : null

    const tick = () => {
      const now = Date.now()
      if (now < startDate.getTime()) {
        setStatus('upcoming')
        setTimeLeft(getTimeLeft(startDate))
      } else if (endDate && now < endDate.getTime()) {
        setStatus('ongoing')
        setTimeLeft(null)
      } else {
        setStatus('past')
        setTimeLeft(null)
      }
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [start, end])

  if (!start) return null

  const startDate = new Date(start)
  const formattedDate = startDate.toLocaleString('ru-RU', {
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

      {status === 'upcoming' && timeLeft && (
        <div className="flex gap-3 flex-wrap">
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

      {status === 'ongoing' && (
        <p className="text-lg font-semibold text-primary">Уже идёт! 🎉</p>
      )}

      {status === 'past' && (
        <p className="text-lg font-semibold text-muted-foreground">Уже прошло</p>
      )}
    </div>
  )
}
