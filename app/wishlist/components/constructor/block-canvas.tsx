// app/wishlist/components/constructor/block-canvas.tsx
'use client'

import { BlockItem } from '@/app/wishlist/components/constructor/block-item'
import { BlockPalette } from '@/app/wishlist/components/constructor/block-palette'
import { Block } from '@/shared/types'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { Monitor, Smartphone } from 'lucide-react'
import React, { useCallback, useState } from 'react'

type ViewMode = 'desktop' | 'mobile'

type Props = {
  initialBlocks: Block[]
  onBlocksChange: (blocks: Block[]) => void
}

export function BlockCanvas({ initialBlocks, onBlocksChange }: Props) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks)
  const [viewMode, setViewMode] = useState<ViewMode>('desktop')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const syncBlocks = useCallback(
    (next: Block[]) => {
      const normalized = next.map((b, i) => ({ ...b, position: i }))
      setBlocks(normalized)
      onBlocksChange(normalized)
    },
    [onBlocksChange]
  )

  const displayBlocks =
    viewMode === 'mobile'
      ? [...blocks].sort(
          (a, b) => (a.mobilePosition ?? a.position) - (b.mobilePosition ?? b.position)
        )
      : blocks

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    if (viewMode === 'mobile') {
      // active.id/over.id are positions from displayBlocks (sorted by mobilePosition)
      const oldIdx = displayBlocks.findIndex((b) => String(b.position) === String(active.id))
      const newIdx = displayBlocks.findIndex((b) => String(b.position) === String(over.id))
      const reordered = arrayMove(displayBlocks, oldIdx, newIdx).map((b, i) => ({
        ...b,
        mobilePosition: i,
      }))
      // merge updated mobilePositions back into blocks (keyed by position)
      const next = blocks.map((b) => {
        const updated = reordered.find((r) => r.position === b.position)
        return updated ? { ...b, mobilePosition: updated.mobilePosition } : b
      })
      syncBlocks(next)
    } else {
      const oldIndex = blocks.findIndex((b) => String(b.position) === String(active.id))
      const newIndex = blocks.findIndex((b) => String(b.position) === String(over.id))
      syncBlocks(arrayMove(blocks, oldIndex, newIndex))
    }
  }, [blocks, displayBlocks, syncBlocks, viewMode])

  const handleAdd = (block: Block) => {
    syncBlocks([...blocks, block])
  }

  const handleUpdate = (index: number, data: Record<string, unknown>) => {
    syncBlocks(blocks.map((b, i) => (i === index ? { ...b, data } : b)))
  }

  const handleResize = (index: number, colSpan: 1 | 2, rowSpan: 1 | 2 | 3) => {
    syncBlocks(blocks.map((b, i) => (i === index ? { ...b, colSpan, rowSpan } : b)))
  }

  const handleDelete = (index: number) => {
    syncBlocks(blocks.filter((_, i) => i !== index))
  }

  const ids = displayBlocks.map((b) => String(b.position))

  return (
    <div className="flex gap-6 items-start">
      {/* Left palette */}
      <BlockPalette onAdd={handleAdd} existingCount={blocks.length} />

      {/* Canvas */}
      <div className="flex-1 space-y-4">
        {/* View switcher */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setViewMode('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'desktop'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            <Monitor size={14} /> Десктоп
          </button>
          <button
            type="button"
            onClick={() => setViewMode('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'mobile'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            <Smartphone size={14} /> Мобила
          </button>
        </div>

        {/* Grid / list */}
        {blocks.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-lg p-12 text-center text-muted-foreground text-sm">
            Добавь блоки из панели слева
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={ids} strategy={rectSortingStrategy}>
              <div
                className={
                  viewMode === 'desktop'
                    ? 'grid grid-cols-2 gap-4 auto-rows-[minmax(80px,auto)]'
                    : 'flex flex-col gap-3 max-w-sm'
                }
              >
                {displayBlocks.map((block) => (
                  <BlockItem
                    key={viewMode === 'desktop' ? block.position : (block.mobilePosition ?? block.position)}
                    id={String(block.position)}
                    block={viewMode === 'mobile' ? { ...block, colSpan: 1, rowSpan: 1 } : block}
                    onUpdate={(data) => handleUpdate(
                      blocks.findIndex((b) => b.position === block.position),
                      data
                    )}
                    onResize={(cs, rs) => handleResize(
                      blocks.findIndex((b) => b.position === block.position),
                      cs, rs
                    )}
                    onDelete={() => handleDelete(
                      blocks.findIndex((b) => b.position === block.position)
                    )}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}
