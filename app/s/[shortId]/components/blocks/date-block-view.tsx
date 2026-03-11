import { Block } from '@/shared/types'
import { CalendarIcon } from 'lucide-react'
import React from 'react'

export function DateBlockView({ block }: { block: Block }) {
  const datetime = block.data.datetime as string
  const label = block.data.label as string | undefined
  if (!datetime) return null
  return (
    <div className="flex gap-4 items-center bg-card p-6 rounded-2xl shadow-md max-w-sm">
      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
        <CalendarIcon className="w-6 h-6 text-primary" />
      </div>
      <div>
        {label && <p className="text-sm text-muted-foreground">{label}</p>}
        <p className="text-xl font-medium text-foreground">
          {new Date(datetime).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}
