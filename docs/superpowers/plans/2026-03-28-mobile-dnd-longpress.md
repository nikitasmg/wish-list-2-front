# Mobile DnD Long-Press Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the wishlist constructor drag-and-drop usable on mobile via long-press on the full card, with haptic feedback and page scroll lock during drag.

**Architecture:** Three file changes, no new files. Move drag listeners from the toolbar grip button to the card div in `block-item.tsx`, remove the now-redundant grip handle from `block-toolbar.tsx`, and update `block-canvas.tsx` to lock scroll + vibrate on drag start and restore on drag end/cancel.

**Tech Stack:** dnd-kit/core (already installed), Tailwind CSS `select-none`, Web Vibration API

---

### Task 1: Move drag handle from toolbar button to card div

**Files:**
- Modify: `app/wishlist/components/constructor/block-toolbar.tsx`
- Modify: `app/wishlist/components/constructor/block-item.tsx`

- [ ] **Step 1: Rewrite `block-toolbar.tsx` — remove grip button and its props**

Replace the entire file with:

```tsx
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
```

- [ ] **Step 2: Update `block-item.tsx` — move listeners to card, add `select-none`**

Replace the `return` block (starting at `return (` on line 62, ending at line 109) with:

```tsx
  return (
    <>
      <div
        ref={(node) => { setDragRef(node); setDropRef(node) }}
        style={style}
        className={`relative rounded-lg border bg-card p-4 min-h-[80px] cursor-pointer transition-all select-none ${
          isDragging
            ? 'shadow-lg border-primary/60'
            : isOver
              ? 'border-yellow-500/60 bg-yellow-500/5'
              : focused
                ? 'border-primary shadow-md'
                : 'border-border hover:border-primary/50'
        }`}
        onClick={() => onFocusChange(!focused)}
        onBlur={(e) => {
          const related = e.relatedTarget
          if (!e.currentTarget.contains(related)) {
            setTimeout(() => onFocusChange(false), 0)
          }
        }}
        tabIndex={0}
        {...listeners}
        {...attributes}
      >
        {focused && (
          <BlockToolbar
            block={block}
            onResize={onResize}
            onEdit={() => { setEditOpen(true); onFocusChange(false) }}
            onDelete={onDelete}
          />
        )}

        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          {label}
        </p>
        <div className="text-sm text-foreground line-clamp-3">{preview}</div>
      </div>

      <BlockEditorModal
        block={block}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={onUpdate}
      />
    </>
  )
```

- [ ] **Step 3: Verify lint passes**

Run: `pnpm lint`
Expected: no errors (unused `Pencil`/`Trash2` imports in `block-item.tsx` were pre-existing — ignore if lint doesn't flag them; if it does, remove those two from the import line)

- [ ] **Step 4: Commit**

```bash
git add app/wishlist/components/constructor/block-toolbar.tsx app/wishlist/components/constructor/block-item.tsx
git commit -m "feat: move drag handle to full card, disable text selection"
```

---

### Task 2: Long-press delay (500ms), scroll lock, haptic feedback

**Files:**
- Modify: `app/wishlist/components/constructor/block-canvas.tsx`

- [ ] **Step 1: Rewrite `block-canvas.tsx`**

Replace the entire file with:

```tsx
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
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import React, { useCallback, useMemo, useState } from 'react'

type Props = {
  initialBlocks: Block[]
  onBlocksChange: (blocks: Block[]) => void
}

export function BlockCanvas({ initialBlocks, onBlocksChange }: Props) {
  const [blocks, setBlocks] = useState<Block[]>(() => ensureCoords(initialBlocks))
  const [isDragActive, setIsDragActive] = useState(false)
  const [focusedId, setFocusedId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
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
    navigator.vibrate?.(40)
    document.body.style.overflow = 'hidden'
  }, [])

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
      setFocusedId(null)
    },
    [blocks, syncBlocks],
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
```

- [ ] **Step 2: Verify lint passes**

Run: `pnpm lint`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/components/constructor/block-canvas.tsx
git commit -m "feat: 500ms long-press drag, scroll lock, haptic feedback on mobile"
```
