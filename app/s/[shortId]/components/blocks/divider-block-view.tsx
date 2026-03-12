import { Block } from '@/shared/types'
import React from 'react'

export function DividerBlockView({ block }: { block: Block }) {
  const style = (block.data.style as string) ?? 'line'

  if (style === 'blank') {
    return <div className="h-8" />
  }

  if (style === 'dots') {
    return (
      <div className="flex justify-center gap-2 py-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
        ))}
      </div>
    )
  }

  if (style === 'stars') {
    return (
      <div className="flex justify-center gap-3 py-2 text-muted-foreground/60 text-sm">
        ✦ ✦ ✦
      </div>
    )
  }

  // default: line
  return <hr className="border-border" />
}
