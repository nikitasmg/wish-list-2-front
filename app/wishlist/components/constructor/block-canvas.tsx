// app/wishlist/components/constructor/block-canvas.tsx
'use client'

import { BlockItem } from '@/app/wishlist/components/constructor/block-item'
import { BlockPalette } from '@/app/wishlist/components/constructor/block-palette'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { Block } from '@/shared/types'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Monitor, Smartphone } from 'lucide-react'
import React, { useCallback, useMemo, useRef, useState } from 'react'

type ViewMode = 'desktop' | 'mobile'

/* ── Grid layout computation ──────────────────────────────────────── */

function computeGridPositions(blocks: Block[]) {
  const occupied = new Set<string>()
  const isOcc = (r: number, c: number) => occupied.has(`${r},${c}`)
  const markOcc = (r: number, c: number) => occupied.add(`${r},${c}`)

  function canFit(startRow: number, startCol: number, rowSpan: number, colSpan: number) {
    for (let r = 0; r < rowSpan; r++)
      for (let c = 0; c < colSpan; c++)
        if (startCol + c > 2 || isOcc(startRow + r, startCol + c)) return false
    return true
  }

  let totalRows = 0

  const positions = blocks.map((block) => {
    const cs = block.colSpan ?? 1
    const rs = block.rowSpan ?? 1
    let row: number
    let col: number

    if (block.columnStart === 2 && cs === 1) {
      col = 2
      row = 1
      while (isOcc(row, 2)) row++
      if (!isOcc(row, 1)) markOcc(row, 1)
    } else {
      row = 1
      col = 1
      while (!canFit(row, col, rs, cs)) {
        col++
        if (col + cs - 1 > 2) { col = 1; row++ }
      }
    }

    for (let r = 0; r < rs; r++)
      for (let c = 0; c < cs; c++)
        markOcc(row + r, col + c)

    totalRows = Math.max(totalRows, row + rs - 1)

    return {
      block,
      gridColumn: `${col} / span ${cs}`,
      gridRow: `${row} / span ${rs}`,
    }
  })

  return { positions, totalRows }
}

/* ── EndDropZone ──────────────────────────────────────────────────── */

function EndDropZone({ gridRow }: { gridRow?: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: '__end__' })
  return (
    <div
      ref={setNodeRef}
      style={gridRow ? { gridColumn: '1 / span 2', gridRow: `${gridRow} / span 1` } : undefined}
      className={`col-span-2 h-12 rounded-lg border-2 border-dashed transition-colors ${
        isOver ? 'border-primary/60 bg-primary/5' : 'border-border/40'
      }`}
    />
  )
}

/* ── BlockCanvas ──────────────────────────────────────────────────── */

type Props = {
  initialBlocks: Block[]
  onBlocksChange: (blocks: Block[]) => void
}

export function BlockCanvas({ initialBlocks, onBlocksChange }: Props) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks)
  const [viewMode, setViewMode] = useState<ViewMode>('desktop')
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const isMobileDevice = useIsMobile()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  )

  const syncBlocks = useCallback(
    (next: Block[]) => {
      const normalized = next.map((b, i) => ({ ...b, position: i }))
      setBlocks(normalized)
      onBlocksChange(normalized)
    },
    [onBlocksChange],
  )

  const displayBlocks =
    viewMode === 'mobile'
      ? [...blocks].sort(
          (a, b) => (a.mobilePosition ?? a.position) - (b.mobilePosition ?? b.position),
        )
      : blocks

  const gridLayout = useMemo(
    () => (viewMode === 'desktop' ? computeGridPositions(displayBlocks) : null),
    [displayBlocks, viewMode],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over) return

      if (String(over.id) === '__end__') {
        const oldIndex = blocks.findIndex((b) => String(b.position) === String(active.id))
        if (oldIndex !== -1 && oldIndex !== blocks.length - 1) {
          const reordered = [...blocks]
          const [moved] = reordered.splice(oldIndex, 1)
          reordered.push(moved)
          syncBlocks(reordered)
        }
        setFocusedId(null)
        return
      }

      if (active.id === over.id) return

      if (viewMode === 'mobile') {
        const oldIdx = displayBlocks.findIndex(
          (b) => String(b.position) === String(active.id),
        )
        const newIdx = displayBlocks.findIndex(
          (b) => String(b.position) === String(over.id),
        )
        const reordered = arrayMove(displayBlocks, oldIdx, newIdx).map((b, i) => ({
          ...b,
          mobilePosition: i,
        }))
        const next = blocks.map((b) => {
          const updated = reordered.find((r) => r.position === b.position)
          return updated ? { ...b, mobilePosition: updated.mobilePosition } : b
        })
        syncBlocks(next)
      } else {
        const oldIndex = blocks.findIndex((b) => String(b.position) === String(active.id))
        const newIndex = blocks.findIndex((b) => String(b.position) === String(over.id))
        const reordered = arrayMove(blocks, oldIndex, newIndex)

        // Detect target column from pointer position
        const activeBlock = blocks[oldIndex]
        if ((activeBlock.colSpan ?? 1) === 1 && gridRef.current) {
          const gridRect = gridRef.current.getBoundingClientRect()
          const gridCenterX = gridRect.left + gridRect.width / 2
          const startX = (event.activatorEvent as PointerEvent).clientX ?? 0
          const finalX = startX + event.delta.x
          const columnStart: 1 | 2 | undefined = finalX >= gridCenterX ? 2 : undefined
          reordered[newIndex] = { ...reordered[newIndex], columnStart }
        }

        syncBlocks(reordered)
      }
      setFocusedId(null)
    },
    [blocks, displayBlocks, syncBlocks, viewMode],
  )

  const handleAdd = (block: Block) => {
    syncBlocks([...blocks, block])
  }

  const handleUpdate = (index: number, data: Record<string, unknown>) => {
    syncBlocks(blocks.map((b, i) => (i === index ? { ...b, data } : b)))
  }

  const handleResize = (index: number, colSpan: 1 | 2, rowSpan: 1 | 2 | 3) => {
    syncBlocks(
      blocks.map((b, i) =>
        i === index
          ? { ...b, colSpan, rowSpan, columnStart: colSpan === 2 ? undefined : b.columnStart }
          : b,
      ),
    )
  }

  const handleDelete = (index: number) => {
    syncBlocks(blocks.filter((_, i) => i !== index))
  }

  const ids = displayBlocks.map((b) => String(b.position))

  return (
    <div className="flex flex-col gap-4 md:flex-row md:gap-6">
      <BlockPalette onAdd={handleAdd} existingCount={blocks.length} />

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
            Добавь блоки из палитры
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={ids}
              strategy={viewMode === 'mobile' ? verticalListSortingStrategy : rectSortingStrategy}
            >
              {viewMode === 'desktop' ? (
                <div
                  ref={gridRef}
                  className="grid grid-cols-2 gap-4"
                  style={{ gridAutoRows: 'minmax(80px, auto)' }}
                >
                  {gridLayout!.positions.map(({ block, gridColumn, gridRow }) => (
                    <BlockItem
                      key={block.position}
                      id={String(block.position)}
                      block={block}
                      viewMode="desktop"
                      isMobileDevice={isMobileDevice}
                      focused={focusedId === String(block.position)}
                      onFocusChange={(v) => setFocusedId(v ? String(block.position) : null)}
                      onUpdate={(data) =>
                        handleUpdate(
                          blocks.findIndex((b) => b.position === block.position),
                          data,
                        )
                      }
                      onResize={(cs, rs) =>
                        handleResize(
                          blocks.findIndex((b) => b.position === block.position),
                          cs,
                          rs,
                        )
                      }
                      onDelete={() =>
                        handleDelete(blocks.findIndex((b) => b.position === block.position))
                      }
                      gridStyle={{ gridColumn, gridRow }}
                    />
                  ))}
                  <EndDropZone gridRow={gridLayout!.totalRows + 1} />
                </div>
              ) : (
                <div className="flex flex-col gap-3 w-full">
                  {displayBlocks.map((block) => (
                    <BlockItem
                      key={block.mobilePosition ?? block.position}
                      id={String(block.position)}
                      block={{ ...block, colSpan: 1, rowSpan: 1 }}
                      viewMode="mobile"
                      isMobileDevice={isMobileDevice}
                      focused={focusedId === String(block.position)}
                      onFocusChange={(v) => setFocusedId(v ? String(block.position) : null)}
                      onUpdate={(data) =>
                        handleUpdate(
                          blocks.findIndex((b) => b.position === block.position),
                          data,
                        )
                      }
                      onResize={(cs, rs) =>
                        handleResize(
                          blocks.findIndex((b) => b.position === block.position),
                          cs,
                          rs,
                        )
                      }
                      onDelete={() =>
                        handleDelete(blocks.findIndex((b) => b.position === block.position))
                      }
                    />
                  ))}
                </div>
              )}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}
