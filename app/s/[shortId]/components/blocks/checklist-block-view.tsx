import { Block } from '@/shared/types'
import React from 'react'

type ChecklistItem = { text: string }

export function ChecklistBlockView({ block }: { block: Block }) {
  const title = block.data.title as string | undefined
  const items = block.data.items as ChecklistItem[] | undefined

  if (!items?.length) return null

  return (
    <div className="space-y-3">
      {title && <p className="text-base font-semibold text-foreground">{title}</p>}
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className="mt-0.5 w-5 h-5 rounded border-2 border-muted-foreground/40 shrink-0" />
            <span className="text-base text-foreground">{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
