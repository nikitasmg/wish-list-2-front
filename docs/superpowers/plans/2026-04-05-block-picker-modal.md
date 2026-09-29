# Block Picker Modal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `+` button to every empty canvas cell that opens a modal for picking a block type and places it at that exact position.

**Architecture:** Export `PALETTE_ITEMS` from `block-palette.tsx` as the single source of truth; create a new `BlockPickerModal` that renders them as large cards; update `EmptyCell` with a `+` button; lift modal open-state into `BlockCanvas` which manages which cell is targeted and calls a new `handleAddAt` handler.

**Tech Stack:** Next.js 16 App Router, React 19, @dnd-kit/core, shadcn/ui (`Dialog`), lucide-react, TypeScript, pnpm

---

## File Map

| Action | File |
|--------|------|
| Modify | `app/wishlist/components/constructor/block-palette.tsx` — export `PALETTE_ITEMS` |
| Create | `app/wishlist/components/constructor/block-picker-modal.tsx` — new modal component |
| Modify | `app/wishlist/components/constructor/empty-cell.tsx` — add `+` button |
| Modify | `app/wishlist/components/constructor/block-canvas.tsx` — modal state + `handleAddAt` |

---

### Task 1: Export PALETTE_ITEMS from block-palette.tsx

**Files:**
- Modify: `app/wishlist/components/constructor/block-palette.tsx`

- [ ] **Step 1: Change `const` to `export const` on line 13**

In `block-palette.tsx`, find:
```ts
const PALETTE_ITEMS: PaletteItem[] = [
```
Change to:
```ts
export const PALETTE_ITEMS: PaletteItem[] = [
```

No other changes in this file.

- [ ] **Step 2: Run lint to verify no errors**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/components/constructor/block-palette.tsx
git commit -m "feat: export PALETTE_ITEMS from block-palette"
```

---

### Task 2: Create BlockPickerModal

**Files:**
- Create: `app/wishlist/components/constructor/block-picker-modal.tsx`

- [ ] **Step 1: Create the file with the full implementation**

```tsx
'use client'

import { PALETTE_ITEMS } from '@/app/wishlist/components/constructor/block-palette'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BlockType } from '@/shared/types'

type Props = {
  open: boolean
  onClose: () => void
  onSelect: (type: BlockType) => void
}

export function BlockPickerModal({ open, onClose, onSelect }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Выберите блок</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {PALETTE_ITEMS.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => onSelect(item.type)}
              className="text-left rounded-lg border bg-card p-4 hover:border-primary/50 hover:bg-accent/30 transition-colors space-y-2 overflow-hidden"
            >
              <span className="text-sm font-semibold text-foreground">{item.label}</span>
              <div>{item.preview}</div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Run lint**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/components/constructor/block-picker-modal.tsx
git commit -m "feat: add BlockPickerModal component"
```

---

### Task 3: Update EmptyCell with + button

**Files:**
- Modify: `app/wishlist/components/constructor/empty-cell.tsx`

- [ ] **Step 1: Replace the full file content**

```tsx
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
          className="absolute inset-0 flex items-center justify-center w-full h-full rounded-lg cursor-pointer"
          aria-label="Добавить блок"
        >
          <Plus className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run lint**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/components/constructor/empty-cell.tsx
git commit -m "feat: add + button to EmptyCell"
```

---

### Task 4: Wire everything in BlockCanvas

**Files:**
- Modify: `app/wishlist/components/constructor/block-canvas.tsx`

- [ ] **Step 1: Add imports at the top of block-canvas.tsx**

After the existing imports, add:
```tsx
import { BlockPickerModal } from '@/app/wishlist/components/constructor/block-picker-modal'
import { BlockType } from '@/shared/types'
```

The full imports section should look like:
```tsx
import { BlockItem } from '@/app/wishlist/components/constructor/block-item'
import { BlockPalette } from '@/app/wishlist/components/constructor/block-palette'
import { BlockPickerModal } from '@/app/wishlist/components/constructor/block-picker-modal'
import { EmptyCell } from '@/app/wishlist/components/constructor/empty-cell'
import {
  ensureCoords,
  getGridRowCount,
  findFirstEmptyCell,
  moveBlock,
  buildCellMap,
  pushBlocksDown,
} from '@/app/wishlist/components/constructor/grid-helpers'
import { Block, BlockType } from '@/shared/types'
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useHaptic } from '@/hooks/use-haptic'
import React, { useCallback, useMemo, useState } from 'react'
```

- [ ] **Step 2: Add pickerTarget state inside BlockCanvas, after the existing state declarations**

After `const [focusedId, setFocusedId] = useState<string | null>(null)`, add:
```tsx
const [pickerTarget, setPickerTarget] = useState<{ row: number; col: 0 | 1 } | null>(null)
```

- [ ] **Step 3: Add handleAddAt callback, after the existing handleAdd callback**

After the `handleAdd` callback (ends around line 114), add:
```tsx
const handleAddAt = useCallback(
  (blockType: BlockType, row: number, col: 0 | 1) => {
    const newBlock: Block = { type: blockType, row, col, colSpan: 1, data: {} }
    syncBlocks([...blocks, newBlock])
  },
  [blocks, syncBlocks],
)
```

- [ ] **Step 4: Pass onAdd to each EmptyCell**

Find the `emptyCells.map` section:
```tsx
{emptyCells.map(({ row, col }) => (
  <EmptyCell
    key={`empty-${row}-${col}`}
    row={row}
    col={col}
    isDragActive={isDragActive}
  />
))}
```

Replace with:
```tsx
{emptyCells.map(({ row, col }) => (
  <EmptyCell
    key={`empty-${row}-${col}`}
    row={row}
    col={col}
    isDragActive={isDragActive}
    onAdd={() => setPickerTarget({ row, col })}
  />
))}
```

- [ ] **Step 5: Add BlockPickerModal just before the closing `</div>` of the flex container**

Find the closing structure of the return:
```tsx
      </div>
    </div>
  )
}
```

Replace with:
```tsx
      </div>

      <BlockPickerModal
        open={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelect={(type) => {
          if (pickerTarget) {
            handleAddAt(type, pickerTarget.row, pickerTarget.col)
            setPickerTarget(null)
          }
        }}
      />
    </div>
  )
}
```

- [ ] **Step 6: Run lint**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 7: Start dev server and manually verify**

```bash
pnpm dev
```

Manual checks:
1. Open the constructor editor for any wishlist
2. Every empty cell shows a `+` icon
3. During DnD drag the `+` icons disappear
4. Clicking `+` opens "Выберите блок" modal with a 2-col grid of block cards
5. Clicking a block card closes the modal and places the block at the correct cell
6. The palette sidebar still works as before (adds to first empty cell)
7. The bottom of the canvas always has at least one empty row with `+` buttons

- [ ] **Step 8: Commit**

```bash
git add app/wishlist/components/constructor/block-canvas.tsx
git commit -m "feat: wire BlockPickerModal into BlockCanvas"
```
