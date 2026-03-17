# Grid Editor Redesign — Cell-Based DnD Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace auto-fill grid editor with cell-based (row, col) grid supporting free block placement, push-based DnD, and visible grid structure.

**Architecture:** Coordinate-based model where each block stores `(row, col, colSpan)`. CSS Grid renders blocks at explicit positions. Empty cells are droppable zones. DnD uses `@dnd-kit/core` (no sortable). Push logic shifts blocks down when dropping into occupied cells.

**Tech Stack:** Next.js 16, @dnd-kit/core, TypeScript, Tailwind CSS

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `shared/types.ts` | Modify | Update Block type: add row/col, remove position/mobilePosition/columnStart/rowSpan |
| `app/wishlist/components/constructor/grid-helpers.ts` | Create | Pure functions: migrateBlock, findFirstEmpty, pushBlocksDown, computeGridDimensions, mobileOrder |
| `app/wishlist/components/constructor/empty-cell.tsx` | Create | Droppable empty cell component |
| `app/wishlist/components/constructor/block-canvas.tsx` | Rewrite | Cell-based grid with DndContext, droppable cells, drag highlights |
| `app/wishlist/components/constructor/block-item.tsx` | Modify | useDraggable instead of useSortable, remove viewMode prop |
| `app/wishlist/components/constructor/block-toolbar.tsx` | Modify | Remove rowSpan sizes, only 1×1 and 2×1 toggle |
| `app/wishlist/components/constructor/block-palette.tsx` | Modify | Use row/col instead of position when creating blocks |
| `app/wishlist/components/constructor-editor.tsx` | Modify | Remove mobile/desktop viewMode switching |

---

### Task 1: Update Block type

**Files:**
- Modify: `shared/types.ts:22-30`

- [ ] **Step 1: Update Block type definition**

Replace the Block type with coordinate-based fields:

```typescript
export type Block = {
  type: BlockType
  row: number       // 0-based row in grid
  col: 0 | 1        // 0 = left, 1 = right (ignored when colSpan: 2)
  colSpan: 1 | 2    // 1 = one cell, 2 = full width
  data: Record<string, unknown>
  // Legacy fields kept for migration compatibility (read-only)
  position?: number
  mobilePosition?: number
  columnStart?: 1 | 2
  rowSpan?: 1 | 2 | 3
}
```

- [ ] **Step 2: Run lint to verify**

Run: `pnpm lint`
Expected: No new errors (existing refs to position/rowSpan will still compile since they're optional)

- [ ] **Step 3: Commit**

```bash
git add shared/types.ts
git commit -m "refactor: update Block type with (row, col) coordinate model"
```

---

### Task 2: Create grid helper functions

**Files:**
- Create: `app/wishlist/components/constructor/grid-helpers.ts`

- [ ] **Step 1: Create grid-helpers.ts with all pure functions**

```typescript
import { Block } from '@/shared/types'

/**
 * Migrate a legacy block (position-based) to coordinate model.
 * Uses computeGridPositions-style logic to derive row/col from position + columnStart.
 */
export function migrateBlocks(blocks: Block[]): Block[] {
  if (blocks.length === 0) return []
  // If first block already has row defined, no migration needed
  if (blocks[0].row !== undefined && blocks[0].row !== null) return blocks

  const sorted = [...blocks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  const occupied = new Set<string>()

  return sorted.map((block) => {
    const cs = block.colSpan ?? 1

    if (cs === 2) {
      let row = 0
      while (occupied.has(`${row},0`) || occupied.has(`${row},1`)) row++
      occupied.add(`${row},0`)
      occupied.add(`${row},1`)
      return { ...block, row, col: 0 as const, colSpan: 2 }
    }

    // Single-column block
    const wantRight = block.columnStart === 2
    let row = 0
    let col: 0 | 1 = wantRight ? 1 : 0

    if (wantRight) {
      while (occupied.has(`${row},1`)) row++
      col = 1
    } else {
      // Find first free cell scanning row by row, left to right
      while (occupied.has(`${row},${col}`)) {
        col = col === 0 ? 1 : 0
        if (col === 0) row++
      }
    }

    occupied.add(`${row},${col}`)
    return { ...block, row, col, colSpan: 1 }
  })
}

/**
 * Get the max row index among all blocks. Returns -1 if no blocks.
 */
export function getMaxRow(blocks: Block[]): number {
  if (blocks.length === 0) return -1
  return Math.max(...blocks.map((b) => b.row))
}

/**
 * Total rows to render = maxRow + 2 (always one empty row at bottom).
 */
export function getGridRowCount(blocks: Block[]): number {
  return getMaxRow(blocks) + 2
}

/**
 * Check if a cell is occupied by any block.
 */
export function isCellOccupied(blocks: Block[], row: number, col: number): boolean {
  return blocks.some((b) => {
    if (b.row === row) {
      if (b.colSpan === 2) return true
      return b.col === col
    }
    return false
  })
}

/**
 * Check if an entire row is occupied by a wide block.
 */
export function isRowFullWidth(blocks: Block[], row: number): boolean {
  return blocks.some((b) => b.row === row && b.colSpan === 2)
}

/**
 * Find the first empty cell scanning top-to-bottom, left-to-right.
 */
export function findFirstEmptyCell(blocks: Block[]): { row: number; col: 0 | 1 } {
  const maxRow = getMaxRow(blocks)
  for (let r = 0; r <= maxRow + 1; r++) {
    if (!isCellOccupied(blocks, r, 0)) return { row: r, col: 0 }
    if (!isCellOccupied(blocks, r, 1)) return { row: r, col: 1 }
  }
  return { row: maxRow + 1, col: 0 }
}

/**
 * Push blocks down: all blocks at targetRow or below get row += 1.
 * Used when dropping into an occupied cell.
 */
export function pushBlocksDown(blocks: Block[], targetRow: number): Block[] {
  return blocks.map((b) => (b.row >= targetRow ? { ...b, row: b.row + 1 } : b))
}

/**
 * Move a block to a new cell. Handles:
 * 1. Drop to empty cell — just move
 * 2. Drop to occupied cell — push down, then move
 * 3. Wide block drop — push entire row down if needed
 */
export function moveBlock(
  blocks: Block[],
  blockIndex: number,
  targetRow: number,
  targetCol: 0 | 1,
): Block[] {
  const moving = blocks[blockIndex]
  // Remove the moving block from the grid temporarily
  const others = blocks.filter((_, i) => i !== blockIndex)

  if (moving.colSpan === 2) {
    // Wide block: check if target row has any blocks
    const rowHasBlocks = others.some((b) => b.row === targetRow)
    const shifted = rowHasBlocks ? pushBlocksDown(others, targetRow) : others
    return [...shifted, { ...moving, row: targetRow, col: 0 as const }]
  }

  // Single-column block
  const cellTaken = others.some((b) => {
    if (b.row === targetRow) {
      if (b.colSpan === 2) return true
      return b.col === targetCol
    }
    return false
  })

  const shifted = cellTaken ? pushBlocksDown(others, targetRow) : others
  return [...shifted, { ...moving, row: targetRow, col: targetCol }]
}

/**
 * Mobile order: sort by row then col, skip empty cells.
 */
export function mobileOrder(blocks: Block[]): Block[] {
  return [...blocks].sort((a, b) => a.row - b.row || a.col - b.col)
}

/**
 * Build a lookup map: "row,col" -> block index for quick access.
 */
export function buildCellMap(blocks: Block[]): Map<string, number> {
  const map = new Map<string, number>()
  blocks.forEach((b, i) => {
    map.set(`${b.row},${b.col}`, i)
    if (b.colSpan === 2) {
      map.set(`${b.row},1`, i)
    }
  })
  return map
}
```

- [ ] **Step 2: Run lint**

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/components/constructor/grid-helpers.ts
git commit -m "feat: add grid helper functions for coordinate-based block model"
```

---

### Task 3: Create EmptyCell component

**Files:**
- Create: `app/wishlist/components/constructor/empty-cell.tsx`

- [ ] **Step 1: Create empty-cell.tsx**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add app/wishlist/components/constructor/empty-cell.tsx
git commit -m "feat: add EmptyCell droppable component"
```

---

### Task 4: Update BlockToolbar — remove rowSpan sizes

**Files:**
- Modify: `app/wishlist/components/constructor/block-toolbar.tsx`

- [ ] **Step 1: Simplify toolbar to only colSpan toggle**

Replace the SIZES array and size pills with a single width toggle (1×1 / full width). Replace `useSortable` import with `useDraggable`. Update the `onResize` callback to only accept `colSpan`.

Changes:
- Remove `Size` type and `SIZES` array
- Remove `rowSpan` from `onResize` prop: `onResize: (colSpan: 1 | 2) => void`
- Replace 6 size pills with 2 buttons: "1 колонка" / "На всю ширину"
- Change `useSortable` import to `useDraggable` from `@dnd-kit/core`
- Update `dragListeners`/`dragAttributes` types to use `useDraggable` return types

```typescript
'use client'

import { Block } from '@/shared/types'
import { Pencil, Trash2, GripVertical } from 'lucide-react'
import React from 'react'
import { useDraggable } from '@dnd-kit/core'

type Props = {
  block: Block
  dragListeners: ReturnType<typeof useDraggable>['listeners'] | undefined
  dragAttributes: ReturnType<typeof useDraggable>['attributes'] | undefined
  onResize: (colSpan: 1 | 2) => void
  onEdit: () => void
  onDelete: () => void
}

export function BlockToolbar({ block, dragListeners, dragAttributes, onResize, onEdit, onDelete }: Props) {
  const currentCol = block.colSpan ?? 1

  return (
    <div className="absolute -top-9 right-0 z-20 flex items-center gap-1 bg-popover border border-border rounded-lg px-2 py-1 shadow-md">
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

- [ ] **Step 2: Run lint**

Run: `pnpm lint`
Expected: May show errors in block-canvas.tsx (expected — will fix in Task 6)

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/components/constructor/block-toolbar.tsx
git commit -m "refactor: simplify BlockToolbar to colSpan-only toggle"
```

---

### Task 5: Update BlockItem — useDraggable instead of useSortable

**Files:**
- Modify: `app/wishlist/components/constructor/block-item.tsx`

- [ ] **Step 1: Replace useSortable with useDraggable**

Key changes:
- Import `useDraggable` from `@dnd-kit/core` instead of `useSortable` from `@dnd-kit/sortable`
- Remove `CSS` import from `@dnd-kit/utilities`
- Remove `viewMode` prop — no more mobile/desktop distinction in editor
- Update `onResize` prop to `(colSpan: 1 | 2) => void` (no rowSpan)
- Use `useDraggable` hook: `const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })`
- Style transform: `transform: transform ? \`translate(\${transform.x}px, \${transform.y}px)\` : undefined`
- Remove the mobile device branch — editor is always desktop-style
- Add `useDroppable` for the block itself (so you can drop onto occupied cells)

```typescript
'use client'

import { BlockEditorModal } from '@/app/wishlist/components/constructor/block-editor-modal'
import { BlockToolbar } from '@/app/wishlist/components/constructor/block-toolbar'
import { Block } from '@/shared/types'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import React, { useState } from 'react'

const BLOCK_LABELS: Record<string, string> = {
  text: 'Текст',
  text_image: 'Текст + картинка',
  image: 'Картинка',
  date: 'Дата',
  location: 'Место',
  color_scheme: 'Дресс-код / Цвета',
  timing: 'Таймер',
  agenda: 'Программа вечера',
  gallery: 'Галерея',
  quote: 'Цитата',
  divider: 'Разделитель',
  contact: 'Контакт',
  video: 'Видео',
  checklist: 'Чеклист',
}

type Props = {
  block: Block
  id: string
  index: number
  focused: boolean
  onFocusChange: (focused: boolean) => void
  onUpdate: (data: Record<string, unknown>) => void
  onResize: (colSpan: 1 | 2) => void
  onDelete: () => void
}

export function BlockItem({ block, id, index, focused, onFocusChange, onUpdate, onResize, onDelete }: Props) {
  const [editOpen, setEditOpen] = useState(false)

  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id,
    data: { index, block },
  })

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `block-${id}`,
    data: { row: block.row, col: block.col, occupied: true },
  })

  const style: React.CSSProperties = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.4 : 1,
    gridRow: block.row + 1,
    gridColumn: `${block.col + 1} / span ${block.colSpan ?? 1}`,
    zIndex: isDragging ? 50 : undefined,
  }

  const preview = getPreview(block)
  const label = BLOCK_LABELS[block.type] ?? block.type

  return (
    <>
      <div
        ref={(node) => { setDragRef(node); setDropRef(node) }}
        style={style}
        className={`relative rounded-lg border bg-card p-4 min-h-[80px] cursor-pointer transition-all ${
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
      >
        {focused && (
          <BlockToolbar
            block={block}
            dragListeners={listeners}
            dragAttributes={attributes}
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
}

// getPreview function stays exactly the same as current
function getPreview(block: Block): React.ReactNode {
  const d = block.data
  switch (block.type) {
    case 'text':
      return (d.html as string)
        ? <span className="text-muted-foreground italic text-xs">Текст (HTML)</span>
        : ((d.content as string) || 'Нет текста')
    case 'text_image':
      return (d.content as string) || 'Текст + картинка'
    case 'image':
      return (d.url as string)
        ? <img src={d.url as string} alt="preview" className="w-full h-20 object-cover rounded mt-1" />
        : <span className="text-muted-foreground">Нет картинки</span>
    case 'date':
      return (d.datetime as string) || 'Дата не указана'
    case 'location':
      return (d.name as string) || 'Место не указано'
    case 'color_scheme': {
      const colors = d.colors as string[] | undefined
      if (!colors?.length) return <span className="text-muted-foreground">Нет цветов</span>
      return (
        <div className="flex gap-1 flex-wrap mt-1">
          {colors.map((c, i) => (
            <div key={i} className="w-5 h-5 rounded-full border border-border" style={{ background: c }} />
          ))}
        </div>
      )
    }
    case 'timing':
      return (d.start as string) ? `До: ${new Date(d.start as string).toLocaleString('ru-RU')}` : 'Время не указано'
    case 'agenda': {
      const items = d.items as { time: string; text: string }[] | undefined
      return items?.length ? `${items.length} пунктов программы` : 'Нет пунктов'
    }
    case 'gallery': {
      const imgs = d.images as string[] | undefined
      if (!imgs?.length) return <span className="text-muted-foreground">Нет фото</span>
      return (
        <div className="flex gap-1 mt-1">
          {imgs.slice(0, 4).map((url, i) => (
            <img key={i} src={url} alt="" className="w-10 h-10 object-cover rounded" />
          ))}
          {imgs.length > 4 && <span className="text-xs text-muted-foreground self-center">+{imgs.length - 4}</span>}
        </div>
      )
    }
    case 'quote':
      return (d.text as string) || 'Нет текста'
    case 'divider':
      return `Разделитель: ${(d.style as string) || 'line'}`
    case 'contact':
      return (d.name as string) || 'Нет имени'
    case 'video':
      return (d.url as string) ? `Видео: ${d.url as string}` : 'Нет ссылки'
    case 'checklist': {
      const items = d.items as string[] | undefined
      return items?.length ? `${items.length} пунктов` : 'Нет пунктов'
    }
    default:
      return ''
  }
}
```

- [ ] **Step 2: Run lint**

Run: `pnpm lint`

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/components/constructor/block-item.tsx
git commit -m "refactor: BlockItem uses useDraggable+useDroppable, remove viewMode"
```

---

### Task 6: Rewrite BlockCanvas — cell-based grid

**Files:**
- Rewrite: `app/wishlist/components/constructor/block-canvas.tsx`

- [ ] **Step 1: Complete rewrite of block-canvas.tsx**

This is the core change. The new BlockCanvas:
- Uses coordinate-based grid (no computeGridPositions)
- Renders explicit empty cells as droppable zones
- DnD with `@dnd-kit/core` only (no sortable)
- Push logic via grid-helpers
- Drag highlights: green (target), blue dashed (available), yellow (will shift)
- No mobile/desktop view switcher
- Always shows grid lines via empty cells

```typescript
'use client'

import { BlockItem } from '@/app/wishlist/components/constructor/block-item'
import { BlockPalette } from '@/app/wishlist/components/constructor/block-palette'
import { EmptyCell } from '@/app/wishlist/components/constructor/empty-cell'
import {
  migrateBlocks,
  getGridRowCount,
  findFirstEmptyCell,
  moveBlock,
  buildCellMap,
} from '@/app/wishlist/components/constructor/grid-helpers'
import { Block } from '@/shared/types'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
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
  const [blocks, setBlocks] = useState<Block[]>(() => migrateBlocks(initialBlocks))
  const [isDragActive, setIsDragActive] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  )

  const [focusedId, setFocusedId] = useState<string | null>(null)

  const syncBlocks = useCallback(
    (next: Block[]) => {
      setBlocks(next)
      onBlocksChange(next)
    },
    [onBlocksChange],
  )

  const rowCount = useMemo(() => getGridRowCount(blocks), [blocks])
  const cellMap = useMemo(() => buildCellMap(blocks), [blocks])

  // Build list of empty cells to render
  const emptyCells = useMemo(() => {
    const cells: { row: number; col: 0 | 1 }[] = []
    for (let r = 0; r < rowCount; r++) {
      if (!cellMap.has(`${r},0`)) cells.push({ row: r, col: 0 })
      if (!cellMap.has(`${r},1`)) cells.push({ row: r, col: 1 })
    }
    return cells
  }, [rowCount, cellMap])

  const handleDragStart = useCallback((_event: DragStartEvent) => {
    setIsDragActive(true)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setIsDragActive(false)
      const { active, over } = event
      if (!over) return

      const activeData = active.data.current as { index: number; block: Block } | undefined
      if (!activeData) return

      const overData = over.data.current as { row: number; col: number; occupied?: boolean } | undefined
      if (!overData) return

      const targetRow = overData.row
      const targetCol = overData.col as 0 | 1

      // Don't drop on self
      const movingBlock = activeData.block
      if (movingBlock.row === targetRow && movingBlock.col === targetCol) return

      const blockIndex = blocks.findIndex(
        (b) => b.row === movingBlock.row && b.col === movingBlock.col && b.type === movingBlock.type
      )
      if (blockIndex === -1) return

      const newBlocks = moveBlock(blocks, blockIndex, targetRow, targetCol)
      syncBlocks(newBlocks)
      setFocusedId(null)
    },
    [blocks, syncBlocks],
  )

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
      const updated = { ...block, colSpan, col: colSpan === 2 ? (0 as const) : block.col }
      syncBlocks(blocks.map((b, i) => (i === index ? updated : b)))
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
          >
            <div
              className="grid grid-cols-2 gap-3"
              style={{ gridAutoRows: 'minmax(80px, auto)' }}
            >
              {/* Render blocks */}
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

              {/* Render empty cells */}
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

- [ ] **Step 2: Run lint**

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/components/constructor/block-canvas.tsx
git commit -m "feat: rewrite BlockCanvas with cell-based coordinate grid and DnD"
```

---

### Task 7: Update BlockPalette — use row/col

**Files:**
- Modify: `app/wishlist/components/constructor/block-palette.tsx:173`

- [ ] **Step 1: Update handleAdd to use row/col instead of position**

Change the `handleAdd` function:

```typescript
const handleAdd = (type: BlockType) => {
  onAdd({ type, row: 0, col: 0, colSpan: 1, data: {} })
}
```

The actual row/col will be overridden by BlockCanvas.handleAdd which calls findFirstEmptyCell. We just need valid defaults here.

- [ ] **Step 2: Run lint**

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/components/constructor/block-palette.tsx
git commit -m "refactor: BlockPalette uses row/col in new block defaults"
```

---

### Task 8: Update ConstructorEditor — remove view mode switching

**Files:**
- Modify: `app/wishlist/components/constructor-editor.tsx`

- [ ] **Step 1: Remove mobile/desktop view mode from editor**

No changes needed in constructor-editor.tsx itself — it doesn't have the view switcher (it's in block-canvas.tsx which was already rewritten without it). Verify no stale imports or references.

- [ ] **Step 2: Run lint**

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 3: Commit (if changes needed)**

```bash
git add app/wishlist/components/constructor-editor.tsx
git commit -m "chore: verify constructor-editor after grid redesign"
```

---

### Task 9: Remove @dnd-kit/sortable dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Uninstall @dnd-kit/sortable**

Run: `pnpm remove @dnd-kit/sortable`

- [ ] **Step 2: Verify no remaining imports**

Search for any remaining `@dnd-kit/sortable` imports across the codebase. There should be none after Tasks 4-6.

- [ ] **Step 3: Run build to verify everything compiles**

Run: `pnpm build`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: remove @dnd-kit/sortable dependency"
```

---

### Task 10: Build verification and smoke test

- [ ] **Step 1: Run full build**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 2: Start dev server and manually verify**

Run: `pnpm dev`

Verify:
1. Open wishlist editor — grid visible with 2 columns
2. Add block from palette — appears in first empty cell
3. Drag block to empty cell — moves there, old cell becomes empty
4. Drag block to occupied cell — push: target and below shift down
5. Resize block to full width (2×1) — spans both columns
6. Delete block — cell becomes empty
7. Empty row at bottom always visible
8. Grid lines (dashed borders) visible on empty cells

- [ ] **Step 3: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address issues found during smoke testing"
```
