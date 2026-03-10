// app/wishlist/components/constructor/block-toolbar.tsx
'use client'

import { Block } from '@/shared/types'
import { Pencil, Trash2, GripVertical } from 'lucide-react'
import React from 'react'
import { useSortable } from '@dnd-kit/sortable'

type Size = { colSpan: 1 | 2; rowSpan: 1 | 2 | 3; label: string }

const SIZES: Size[] = [
  { colSpan: 1, rowSpan: 1, label: '1×1' },
  { colSpan: 2, rowSpan: 1, label: '2×1' },
  { colSpan: 1, rowSpan: 2, label: '1×2' },
  { colSpan: 2, rowSpan: 2, label: '2×2' },
  { colSpan: 1, rowSpan: 3, label: '1×3' },
  { colSpan: 2, rowSpan: 3, label: '2×3' },
]

type Props = {
  block: Block
  dragListeners: ReturnType<typeof useSortable>['listeners']
  dragAttributes: ReturnType<typeof useSortable>['attributes']
  onResize: (colSpan: 1 | 2, rowSpan: 1 | 2 | 3) => void
  onEdit: () => void
  onDelete: () => void
}

export function BlockToolbar({ block, dragListeners, dragAttributes, onResize, onEdit, onDelete }: Props) {
  const currentCol = (block.colSpan ?? 1) as 1 | 2
  const currentRow = (block.rowSpan ?? 1) as 1 | 2 | 3

  return (
    <div className="absolute -top-9 left-0 z-20 flex items-center gap-1 bg-popover border border-border rounded-lg px-2 py-1 shadow-md">
      {/* Drag handle */}
      <button
        type="button"
        className="cursor-grab text-muted-foreground hover:text-foreground p-0.5"
        {...dragAttributes}
        {...dragListeners}
      >
        <GripVertical size={14} />
      </button>

      <div className="w-px h-4 bg-border mx-1" />

      {/* Size pills */}
      {SIZES.map((s) => {
        const active = s.colSpan === currentCol && s.rowSpan === currentRow
        return (
          <button
            key={s.label}
            type="button"
            onClick={() => onResize(s.colSpan, s.rowSpan)}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {s.label}
          </button>
        )
      })}

      <div className="w-px h-4 bg-border mx-1" />

      {/* Edit */}
      <button
        type="button"
        onClick={onEdit}
        className="p-0.5 text-muted-foreground hover:text-foreground"
      >
        <Pencil size={14} />
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={onDelete}
        className="p-0.5 text-muted-foreground hover:text-destructive"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
