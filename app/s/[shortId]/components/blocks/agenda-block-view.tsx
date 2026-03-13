import { Block } from '@/shared/types'
import React from 'react'

type AgendaItem = { time: string; text: string }

export function AgendaBlockView({ block }: { block: Block }) {
  const items = block.data.items as AgendaItem[] | undefined
  const title = block.data.title as string | undefined

  if (!items?.length) return null

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-xl font-semibold">{title}</h3>
      )}
      <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex gap-4 items-baseline">
          <span className="text-sm font-mono text-muted-foreground shrink-0 w-16 text-right">
            {item.time}
          </span>
          <div className="flex items-baseline gap-3 flex-1">
            <div className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" />
            <span className="text-base text-foreground">{item.text}</span>
          </div>
        </div>
      ))}
      </div>
    </div>
  )
}
