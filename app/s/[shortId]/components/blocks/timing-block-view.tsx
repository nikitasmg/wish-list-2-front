import { Block } from '@/shared/types'
import { TimerIcon } from 'lucide-react'
import React from 'react'

export function TimingBlockView({ block }: { block: Block }) {
  const start = block.data.start as string
  const end = block.data.end as string | undefined
  if (!start) return null
  return (
    <div className="flex gap-4 items-center bg-card p-6 rounded-2xl shadow-md max-w-sm">
      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
        <TimerIcon className="w-6 h-6 text-primary" />
      </div>
      <div>
        <p className="text-xl font-medium text-foreground">
          {new Date(start).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          {end && ` — ${new Date(end).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`}
        </p>
      </div>
    </div>
  )
}
