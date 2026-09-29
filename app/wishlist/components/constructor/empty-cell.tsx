'use client'

import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'

type Props = {
  row: number
  col: 0 | 1
  isDragActive: boolean
  onAdd?: () => void
}

export function EmptyCell({ row, col, isDragActive, onAdd }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${row}-${col}`,
    data: { row, col },
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        gridRow: row + 1,
        gridColumn: col + 1,
      }}
      className={`group relative rounded-lg border-2 border-dashed min-h-[80px] transition-colors ${
        isOver
          ? 'border-green-500/60 bg-green-500/10'
          : isDragActive
            ? 'border-primary/40 bg-primary/5'
            : 'border-border/40 bg-muted/20 hover:border-primary/50'
      }`}
    >
      {!isDragActive && onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="absolute inset-0 flex items-center justify-center rounded-lg cursor-pointer"
          aria-label="Добавить блок"
        >
          <Plus className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
        </button>
      )}
    </div>
  )
}
