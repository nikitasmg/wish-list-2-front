import { Block } from '@/shared/types'
import React from 'react'

export function ColorSchemeBlockView({ block }: { block: Block }) {
  const colors = block.data.colors as string[] | undefined
  const label = block.data.label as string | undefined

  if (!colors?.length) return null

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      )}
      <div className="flex gap-3 flex-wrap">
        {colors.map((color, i) => (
          <div
            key={i}
            className="w-12 h-12 rounded-full shadow-md border-2 border-background"
            style={{ background: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  )
}
