'use client'

import { Block } from '@/shared/types'
import { Pencil, Trash2 } from 'lucide-react'
import React from 'react'

type Props = {
  block: Block
  onResize: (colSpan: 1 | 2) => void
  onEdit: () => void
  onDelete: () => void
}

export function BlockToolbar({ block, onResize, onEdit, onDelete }: Props) {
  const currentCol = block.colSpan ?? 1

  return (
    <div className="absolute -top-9 right-0 z-20 flex items-center gap-1 bg-popover border border-border rounded-lg px-2 py-1 shadow-md">
      {/* Width toggle */}
      {([1, 2] as const).map((cs) => {
        const active = cs === currentCol
        return (
          <button
            key={cs}
            type="button"
            onClick={() => onResize(cs)}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {cs === 1 ? '1 кол.' : 'Вся шир.'}
          </button>
        )
      })}

      <div className="w-px h-4 bg-border mx-1" />

      {/* Edit */}
      <button type="button" onClick={onEdit} className="p-0.5 text-muted-foreground hover:text-foreground">
        <Pencil size={14} />
      </button>

      {/* Delete */}
      <button type="button" onClick={onDelete} className="p-0.5 text-muted-foreground hover:text-destructive">
        <Trash2 size={14} />
      </button>
    </div>
  )
}
