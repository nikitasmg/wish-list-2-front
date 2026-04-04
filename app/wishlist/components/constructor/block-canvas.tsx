'use client'

import { BlockItem } from '@/app/wishlist/components/constructor/block-item'
import { BlockPalette } from '@/app/wishlist/components/constructor/block-palette'
import { EmptyCell } from '@/app/wishlist/components/constructor/empty-cell'
import {
  ensureCoords,
  getGridRowCount,
  findFirstEmptyCell,
  moveBlock,
  buildCellMap,
  pushBlocksDown,
} from '@/app/wishlist/components/constructor/grid-helpers'
import { Block } from '@/shared/types'
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useWebHaptics } from 'web-haptics/react'
import React, { useCallback, useMemo, useState } from 'react'

type Props = {
  initialBlocks: Block[]
  onBlocksChange: (blocks: Block[]) => void
}

export function BlockCanvas({ initialBlocks, onBlocksChange }: Props) {
  const [blocks, setBlocks] = useState<Block[]>(() => ensureCoords(initialBlocks))
  const [isDragActive, setIsDragActive] = useState(false)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const { trigger: haptic } = useWebHaptics()

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 500, tolerance: 8 } }),
  )

  const syncBlocks = useCallback(
    (next: Block[]) => {
      setBlocks(next)
      onBlocksChange(next)
    },
    [onBlocksChange],
  )

  const rowCount = useMemo(() => getGridRowCount(blocks), [blocks])
  const cellMap = useMemo(() => buildCellMap(blocks), [blocks])

  const emptyCells = useMemo(() => {
    const cells: { row: number; col: 0 | 1 }[] = []
    for (let r = 0; r < rowCount; r++) {
      if (!cellMap.has(`${r},0`)) cells.push({ row: r, col: 0 })
      if (!cellMap.has(`${r},1`)) cells.push({ row: r, col: 1 })
    }
    return cells
  }, [rowCount, cellMap])

  const handleDragStart = useCallback(() => {
    setIsDragActive(true)
    haptic([{ duration: 10 }], { intensity: 0.7 })
    document.body.style.overflow = 'hidden'
  }, [haptic])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setIsDragActive(false)
      document.body.style.overflow = ''
      const { active, over } = event
      if (!over) return

      const activeData = active.data.current as { index: number; block: Block } | undefined
      if (!activeData) return

      const overData = over.data.current as { row: number; col: number; occupied?: boolean } | undefined
      if (!overData) return

      const targetRow = overData.row
      const targetCol = overData.col as 0 | 1

      const movingBlock = activeData.block
      if (movingBlock.row === targetRow && movingBlock.col === targetCol) return

      const blockIndex = blocks.findIndex(
        (b) => b.row === movingBlock.row && b.col === movingBlock.col && b.type === movingBlock.type,
      )
      if (blockIndex === -1) return

      const newBlocks = moveBlock(blocks, blockIndex, targetRow, targetCol)
      syncBlocks(newBlocks)
      haptic([{ duration: 15 }], { intensity: 0.4 })
      setFocusedId(null)
    },
    [blocks, syncBlocks, haptic],
  )

  const handleDragCancel = useCallback(() => {
    setIsDragActive(false)
    document.body.style.overflow = ''
  }, [])

  const handleAdd = useCallback(
    (block: Block) => {
      const { row, col } = findFirstEmptyCell(blocks)
      const newBlock: Block = { ...block, row, col, colSpan: block.colSpan ?? 1 }
      syncBlocks([...blocks, newBlock])
    },
    [blocks, syncBlocks],
  )

  const handleUpdate = useCallback(
    (index: number, data: Record<string, unknown>) => {
      syncBlocks(blocks.map((b, i) => (i === index ? { ...b, data } : b)))
    },
    [blocks, syncBlocks],
  )

  const handleResize = useCallback(
    (index: number, colSpan: 1 | 2) => {
      const block = blocks[index]
      if (colSpan === 2) {
        const others = blocks.filter((_, i) => i !== index)
        const rowHasOtherBlock = others.some((b) => b.row === block.row)
        const shifted = rowHasOtherBlock ? pushBlocksDown(others, block.row) : others
        syncBlocks([...shifted, { ...block, colSpan: 2 as const, col: 0 as const }])
      } else {
        syncBlocks(blocks.map((b, i) => (i === index ? { ...b, colSpan: 1 as const } : b)))
      }
    },
    [blocks, syncBlocks],
  )

  const handleDelete = useCallback(
    (index: number) => {
      syncBlocks(blocks.filter((_, i) => i !== index))
    },
    [blocks, syncBlocks],
  )

  return (
    <div className="flex flex-col gap-4 md:flex-row md:gap-6">
      <BlockPalette onAdd={handleAdd} existingCount={blocks.length} />

      <div className="flex-1">
        {blocks.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-lg p-12 text-center text-muted-foreground text-sm">
            Добавь блоки из палитры
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div
              className="grid grid-cols-2 gap-3"
              style={{ gridAutoRows: 'minmax(80px, auto)' }}
            >
              {blocks.map((block, index) => (
                <BlockItem
                  key={`${block.row}-${block.col}`}
                  id={`${block.row}-${block.col}`}
                  block={block}
                  index={index}
                  focused={focusedId === `${block.row}-${block.col}`}
                  onFocusChange={(v) =>
                    setFocusedId(v ? `${block.row}-${block.col}` : null)
                  }
                  onUpdate={(data) => handleUpdate(index, data)}
                  onResize={(cs) => handleResize(index, cs)}
                  onDelete={() => handleDelete(index)}
                />
              ))}

              {emptyCells.map(({ row, col }) => (
                <EmptyCell
                  key={`empty-${row}-${col}`}
                  row={row}
                  col={col}
                  isDragActive={isDragActive}
                />
              ))}
            </div>
          </DndContext>
        )}
      </div>
    </div>
  )
}
