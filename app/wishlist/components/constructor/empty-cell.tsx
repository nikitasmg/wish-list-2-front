'use client'

import { useDroppable } from '@dnd-kit/core'

type Props = {
  row: number
  col: 0 | 1
  isDragActive: boolean
}

export function EmptyCell({ row, col, isDragActive }: Props) {
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
      className={`rounded-lg border-2 border-dashed min-h-[80px] transition-colors ${
        isOver
          ? 'border-green-500/60 bg-green-500/10'
          : isDragActive
            ? 'border-primary/40 bg-primary/5'
            : 'border-border/40 bg-muted/20'
      }`}
    />
  )
}
