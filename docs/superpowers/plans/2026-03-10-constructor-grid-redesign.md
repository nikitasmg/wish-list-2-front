# Constructor Grid Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the constructor editor to a 2-column grid canvas with resizable blocks (colSpan/rowSpan), contextual toolbar, inline-editable hero header, desktop/mobile switcher, and a share bottom sheet.

**Architecture:** Backend gets `colSpan`/`rowSpan` added to the Block JSONB struct (no DB migration). Frontend drops the separate meta-form step in favour of instant wishlist creation + inline hero header editing. The canvas becomes a real CSS grid; the palette shows mini-previews; a new `ShareSheet` component handles sharing.

**Tech Stack:** Next.js 16 App Router, @dnd-kit/core + @dnd-kit/sortable, react-hook-form + zod, TanStack Query, shadcn/ui, Tailwind CSS, qrcode.react

**Spec:** `docs/superpowers/specs/2026-03-10-constructor-grid-redesign.md`

---

## Chunk 1: Backend — add colSpan / rowSpan to Block

> Backend root: `C:\Users\nvsma\OneDrive\Документы\projects\wish-list-2-back`

### Task 1: Add colSpan/rowSpan to entity.Block

**Files:**
- Modify: `internal/entity/wishlist.go`

- [ ] **Step 1: Add fields to Block struct**

In `internal/entity/wishlist.go`, replace the `Block` struct:

```go
// Block — один блок конструктора вишлиста
type Block struct {
	Type           string          `json:"type"`
	Position       int             `json:"position"`
	MobilePosition *int            `json:"mobilePosition"`
	ColSpan        int             `json:"colSpan"`   // 1 or 2, default 1
	RowSpan        int             `json:"rowSpan"`   // 1–3, default 1
	Data           json.RawMessage `json:"data"`
}
```

- [ ] **Step 2: Build to verify no compile errors**

```bash
cd C:\Users\nvsma\OneDrive\Документы\projects\wish-list-2-back && go build ./...
```

Expected: no errors.

---

### Task 2: Update blockJSON model and converters

**Files:**
- Modify: `internal/repo/persistent/models.go`
- Modify: `internal/repo/persistent/converters.go`

- [ ] **Step 1: Add fields to blockJSON**

In `internal/repo/persistent/models.go`, replace `blockJSON`:

```go
type blockJSON struct {
	Type           string          `json:"type"`
	Position       int             `json:"position"`
	MobilePosition *int            `json:"mobile_position"`
	ColSpan        int             `json:"col_span"`
	RowSpan        int             `json:"row_span"`
	Data           json.RawMessage `json:"data"`
}
```

- [ ] **Step 2: Update toWishlistEntity converter**

In `internal/repo/persistent/converters.go`, inside the block mapping loop in `toWishlistEntity`, replace:

```go
		blocks = append(blocks, entity.Block{
			Type:           b.Type,
			Position:       b.Position,
			MobilePosition: b.MobilePosition,
			Data:           b.Data,
		})
```

with:

```go
		colSpan := b.ColSpan
		if colSpan < 1 {
			colSpan = 1
		}
		rowSpan := b.RowSpan
		if rowSpan < 1 {
			rowSpan = 1
		}
		blocks = append(blocks, entity.Block{
			Type:           b.Type,
			Position:       b.Position,
			MobilePosition: b.MobilePosition,
			ColSpan:        colSpan,
			RowSpan:        rowSpan,
			Data:           b.Data,
		})
```

- [ ] **Step 3: Update toWishlistModel converter**

In `internal/repo/persistent/converters.go`, inside the block mapping loop in `toWishlistModel`, replace:

```go
		blocks = append(blocks, blockJSON{
			Type:           b.Type,
			Position:       b.Position,
			MobilePosition: b.MobilePosition,
			Data:           data,
		})
```

with:

```go
		blocks = append(blocks, blockJSON{
			Type:           b.Type,
			Position:       b.Position,
			MobilePosition: b.MobilePosition,
			ColSpan:        b.ColSpan,
			RowSpan:        b.RowSpan,
			Data:           data,
		})
```

- [ ] **Step 4: Build to verify no compile errors**

```bash
cd C:\Users\nvsma\OneDrive\Документы\projects\wish-list-2-back && go build ./...
```

Expected: no errors.

- [ ] **Step 5: Run backend tests**

```bash
cd C:\Users\nvsma\OneDrive\Документы\projects\wish-list-2-back && go test ./internal/repo/persistent/... ./internal/usecase/wishlist/...
```

Expected: PASS (or skip if integration tests require a running DB).

- [ ] **Step 6: Commit**

```bash
cd C:\Users\nvsma\OneDrive\Документы\projects\wish-list-2-back
git add internal/entity/wishlist.go internal/repo/persistent/models.go internal/repo/persistent/converters.go
git commit -m "feat: add colSpan/rowSpan to Block entity and JSONB model"
```

---

## Chunk 2: Frontend — types, API hooks, env var

### Task 3: Update shared/types.ts

**Files:**
- Modify: `shared/types.ts`

- [ ] **Step 1: Add colSpan and rowSpan to Block**

In `shared/types.ts`, replace the `Block` type:

```typescript
export type Block = {
  type: BlockType
  position: number
  mobilePosition?: number
  colSpan?: 1 | 2         // grid columns occupied, default 1
  rowSpan?: 1 | 2 | 3    // grid rows occupied, default 1
  data: Record<string, unknown>
}
```

- [ ] **Step 2: Verify lint**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add shared/types.ts
git commit -m "feat: add colSpan/rowSpan to Block type"
```

---

### Task 4: Add useApiUpdateConstructorMeta hook + install qrcode.react

**Files:**
- Modify: `api/wishlist/index.ts`
- Modify: `package.json` (via pnpm)

- [ ] **Step 1: Install qrcode.react**

```bash
pnpm add qrcode.react
pnpm add -D @types/qrcode.react
```

Expected: packages added.

- [ ] **Step 2: Add useApiUpdateConstructorMeta to api/wishlist/index.ts**

Add the following hook after `useApiEditWishlist` in `api/wishlist/index.ts`:

```typescript
// Updates title, cover, settings for a constructor wishlist (multipart, reuses existing PUT endpoint)
export const useApiUpdateConstructorMeta = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation<{ data: Wishlist }, AxiosError, FormData>({
    mutationFn: async (data) => {
      return api.put(`wishlists/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wishlist', id] })
      await queryClient.invalidateQueries({ queryKey: ['wishlists'] })
    },
  })
}
```

- [ ] **Step 3: Verify lint**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 4: Add NEXT_PUBLIC_APP_URL to .env.local**

Create / update `.env.local` in project root (if it doesn't exist):

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> In production deployment, set `NEXT_PUBLIC_APP_URL=https://get-my-wishlist.ru`

- [ ] **Step 5: Commit**

```bash
git add api/wishlist/index.ts package.json pnpm-lock.yaml
git commit -m "feat: add useApiUpdateConstructorMeta hook and install qrcode.react"
```

---

## Chunk 3: Block toolbar + canvas grid rebuild

### Task 5: Create block-toolbar.tsx

**Files:**
- Create: `app/wishlist/components/constructor/block-toolbar.tsx`

- [ ] **Step 1: Create the component**

```typescript
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
```

- [ ] **Step 2: Verify lint**

```bash
pnpm lint
```

Expected: no errors.

---

### Task 6: Rewrite block-item.tsx

**Files:**
- Modify: `app/wishlist/components/constructor/block-item.tsx`

- [ ] **Step 1: Replace contents of block-item.tsx**

```typescript
// app/wishlist/components/constructor/block-item.tsx
'use client'

import { BlockEditorModal } from '@/app/wishlist/components/constructor/block-editor-modal'
import { BlockToolbar } from '@/app/wishlist/components/constructor/block-toolbar'
import { Block } from '@/shared/types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import React, { useState } from 'react'

const BLOCK_LABELS: Record<string, string> = {
  text: 'Текст',
  text_image: 'Текст + картинка',
  image: 'Картинка',
  date: 'Дата',
  location: 'Место',
  color_scheme: 'Цветовая схема',
  timing: 'Таймер',
}

type Props = {
  block: Block
  id: string
  onUpdate: (data: Record<string, unknown>) => void
  onResize: (colSpan: 1 | 2, rowSpan: 1 | 2 | 3) => void
  onDelete: () => void
}

export function BlockItem({ block, id, onUpdate, onResize, onDelete }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [focused, setFocused] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    gridColumn: `span ${block.colSpan ?? 1}`,
    gridRow: `span ${block.rowSpan ?? 1}`,
  }

  const preview = getPreview(block)

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`relative rounded-lg border bg-card p-4 min-h-[80px] cursor-pointer transition-shadow ${
          focused ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'
        }`}
        onClick={() => setFocused((v) => !v)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false)
        }}
        tabIndex={0}
      >
        {/* Contextual toolbar — visible when focused */}
        {focused && (
          <BlockToolbar
            block={block}
            dragListeners={listeners}
            dragAttributes={attributes}
            onResize={onResize}
            onEdit={() => { setEditOpen(true); setFocused(false) }}
            onDelete={onDelete}
          />
        )}

        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          {BLOCK_LABELS[block.type] ?? block.type}
        </p>
        <p className="text-sm text-foreground line-clamp-3">{preview}</p>
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

function getPreview(block: Block): string {
  const d = block.data
  switch (block.type) {
    case 'text': return (d.content as string) || 'Нет текста'
    case 'text_image': return (d.content as string) || 'Текст + картинка'
    case 'image': return (d.url as string) ? 'Картинка загружена' : 'Нет картинки'
    case 'date': return (d.datetime as string) || 'Дата не указана'
    case 'location': return (d.name as string) || 'Место не указано'
    case 'color_scheme': return (d.scheme as string) || 'main'
    case 'timing': return (d.start as string) || 'Время не указано'
    default: return ''
  }
}
```

- [ ] **Step 2: Verify lint**

```bash
pnpm lint
```

Expected: no errors.

---

### Task 7: Rewrite block-canvas.tsx

**Files:**
- Modify: `app/wishlist/components/constructor/block-canvas.tsx`

- [ ] **Step 1: Replace contents of block-canvas.tsx**

```typescript
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

  const sensors = useSensors(useSensor(PointerSensor))

  const syncBlocks = useCallback(
    (next: Block[]) => {
      const normalized = next.map((b, i) => ({ ...b, position: i }))
      setBlocks(normalized)
      onBlocksChange(normalized)
    },
    [onBlocksChange]
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    if (viewMode === 'mobile') {
      // displayBlocks is sorted by mobilePosition; active.id/over.id are indices into it
      const oldIdx = Number(active.id)
      const newIdx = Number(over.id)
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
      const oldIndex = Number(active.id)
      const newIndex = Number(over.id)
      syncBlocks(arrayMove(blocks, oldIndex, newIndex))
    }
  }

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

  const displayBlocks =
    viewMode === 'mobile'
      ? [...blocks].sort(
          (a, b) => (a.mobilePosition ?? a.position) - (b.mobilePosition ?? b.position)
        )
      : blocks

  const ids = displayBlocks.map((_, i) => String(i))

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
                {displayBlocks.map((block, i) => (
                  <BlockItem
                    key={viewMode === 'desktop' ? block.position : (block.mobilePosition ?? block.position)}
                    id={String(i)}
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
```

- [ ] **Step 2: Verify lint**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 3: Commit chunk 3**

```bash
git add app/wishlist/components/constructor/block-toolbar.tsx app/wishlist/components/constructor/block-item.tsx app/wishlist/components/constructor/block-canvas.tsx
git commit -m "feat: rebuild canvas as CSS grid with contextual toolbar and desktop/mobile switcher"
```

---

## Chunk 4: Palette with previews + hero header

### Task 8: Rewrite block-palette.tsx with mini-previews

**Files:**
- Modify: `app/wishlist/components/constructor/block-palette.tsx`

- [ ] **Step 1: Replace contents of block-palette.tsx**

```typescript
// app/wishlist/components/constructor/block-palette.tsx
'use client'

import { Block, BlockType } from '@/shared/types'
import React from 'react'

type PaletteItem = {
  type: BlockType
  label: string
  preview: React.ReactNode
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'text',
    label: 'Текст',
    preview: (
      <p className="text-xs text-muted-foreground border-l-2 border-primary pl-2 leading-snug">
        Здесь будет текст вашего блока...
      </p>
    ),
  },
  {
    type: 'image',
    label: 'Картинка',
    preview: (
      <div className="w-full h-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
        [ изображение ]
      </div>
    ),
  },
  {
    type: 'text_image',
    label: 'Текст + фото',
    preview: (
      <div className="flex gap-2 items-center">
        <p className="text-xs text-muted-foreground flex-1 leading-snug border-l-2 border-primary pl-2">Текст...</p>
        <div className="w-8 h-8 rounded bg-muted shrink-0" />
      </div>
    ),
  },
  {
    type: 'date',
    label: 'Дата',
    preview: (
      <p className="text-xs text-primary font-medium">📅 15 марта 2025, 18:00</p>
    ),
  },
  {
    type: 'location',
    label: 'Место',
    preview: (
      <p className="text-xs text-primary font-medium">📍 Кафе «Уют», Москва</p>
    ),
  },
  {
    type: 'color_scheme',
    label: 'Цветовая схема',
    preview: (
      <div className="flex gap-1">
        {['bg-violet-500', 'bg-pink-500', 'bg-blue-500', 'bg-green-500'].map((c) => (
          <div key={c} className={`w-4 h-4 rounded-full ${c}`} />
        ))}
      </div>
    ),
  },
  {
    type: 'timing',
    label: 'Таймер',
    preview: (
      <p className="text-xs text-primary font-medium">⏱ 18:00 — 23:00</p>
    ),
  },
]

type Props = {
  onAdd: (block: Block) => void
  existingCount: number
}

export function BlockPalette({ onAdd, existingCount }: Props) {
  const handleAdd = (type: BlockType) => {
    onAdd({ type, position: existingCount, colSpan: 1, rowSpan: 1, data: {} })
  }

  return (
    <div className="w-56 shrink-0 space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Блоки
      </h3>
      {PALETTE_ITEMS.map((item) => (
        <button
          key={item.type}
          type="button"
          onClick={() => handleAdd(item.type)}
          className="w-full text-left rounded-lg border bg-card p-3 hover:border-primary/50 hover:bg-accent/30 transition-colors space-y-1.5"
        >
          <span className="text-xs font-semibold text-foreground">{item.label}</span>
          <div>{item.preview}</div>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify lint**

```bash
pnpm lint
```

Expected: no errors.

---

### Task 9: Create constructor-header.tsx

**Files:**
- Create: `app/wishlist/components/constructor/constructor-header.tsx`

- [ ] **Step 1: Create the component**

```typescript
// app/wishlist/components/constructor/constructor-header.tsx
'use client'

import { useApiUpdateConstructorMeta } from '@/api/wishlist'
import { ImageUpload, ImageUploadValue } from '@/components/image-upload'
import { ColorsSelect } from '@/app/wishlist/components/colors-select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Wishlist } from '@/shared/types'
import React, { useEffect, useRef, useState } from 'react'
import { useToast } from '@/hooks/use-toast'

type Props = {
  wishlist: Wishlist
}

export function ConstructorHeader({ wishlist }: Props) {
  const { mutate } = useApiUpdateConstructorMeta(wishlist.id)
  const { toast } = useToast()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [title, setTitle] = useState(wishlist.title)
  const [showSettings, setShowSettings] = useState(false)
  const [colorScheme, setColorScheme] = useState(wishlist.settings.colorScheme)
  const [showGiftAvailability, setShowGiftAvailability] = useState(
    wishlist.settings.showGiftAvailability
  )

  const saveMeta = (overrides: Partial<{
    title: string
    coverValue: ImageUploadValue | null
    colorScheme: string
    showGiftAvailability: boolean
  }> = {}) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const fd = new FormData()
      fd.append('title', overrides.title ?? title)
      fd.append('settings[colorScheme]', overrides.colorScheme ?? colorScheme)
      fd.append('settings[showGiftAvailability]', String(overrides.showGiftAvailability ?? showGiftAvailability))
      // preserve existing cover if not changing
      const cv = overrides.coverValue
      if (cv?.type === 'file') {
        fd.append('file', cv.value)
      } else if (cv?.type === 'url') {
        fd.append('cover_url', cv.value)
      } else if (wishlist.cover) {
        fd.append('cover_url', wishlist.cover)
      }
      mutate(fd, {
        onError: () => toast({ title: 'Ошибка сохранения', variant: 'destructive' }),
      })
    }, 600)
  }

  // Keep local state in sync if wishlist prop changes externally
  useEffect(() => { setTitle(wishlist.title) }, [wishlist.title])
  useEffect(() => { setColorScheme(wishlist.settings.colorScheme) }, [wishlist.settings.colorScheme])
  useEffect(() => { setShowGiftAvailability(wishlist.settings.showGiftAvailability) }, [wishlist.settings.showGiftAvailability])

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4 mb-6">
      {/* Title inline edit */}
      <div>
        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Название</p>
        <input
          className="w-full text-2xl font-bold bg-transparent border-0 border-b border-dashed border-border focus:border-primary focus:outline-none pb-1 transition-colors"
          value={title}
          placeholder="Новый вишлист"
          onChange={(e) => {
            setTitle(e.target.value)
            saveMeta({ title: e.target.value })
          }}
        />
      </div>

      {/* Cover upload */}
      <ImageUpload
        label="Обложка"
        onChange={(cv) => saveMeta({ coverValue: cv })}
        previewUrl={wishlist.cover || undefined}
      />

      {/* Settings toggle */}
      <button
        type="button"
        className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
        onClick={() => setShowSettings((v) => !v)}
      >
        {showSettings ? 'Скрыть настройки ↑' : 'Настройки ↓'}
      </button>

      {showSettings && (
        <div className="space-y-4 pt-2 border-t border-border">
          <ColorsSelect
            value={colorScheme}
            onChange={(v) => {
              setColorScheme(v)
              saveMeta({ colorScheme: v })
            }}
          />
          <div className="flex items-center justify-between">
            <Label>Показывать забронированные подарки</Label>
            <Switch
              checked={showGiftAvailability}
              onCheckedChange={(v) => {
                setShowGiftAvailability(v)
                saveMeta({ showGiftAvailability: v })
              }}
            />
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">Сохраняется автоматически</p>
    </div>
  )
}
```

- [ ] **Step 2: Verify lint**

```bash
pnpm lint
```

Expected: no errors.

---

### Task 10: Update constructor-editor.tsx to include header

**Files:**
- Modify: `app/wishlist/components/constructor-editor.tsx`

- [ ] **Step 1: Replace contents of constructor-editor.tsx**

```typescript
// app/wishlist/components/constructor-editor.tsx
'use client'

import { useApiUpdateWishlistBlocks } from '@/api/wishlist'
import { BlockCanvas } from '@/app/wishlist/components/constructor/block-canvas'
import { ConstructorHeader } from '@/app/wishlist/components/constructor/constructor-header'
import { Block, Wishlist } from '@/shared/types'
import { useCallback, useRef } from 'react'
import React from 'react'
import { useToast } from '@/hooks/use-toast'

type Props = {
  wishlist: Wishlist
}

export function ConstructorEditor({ wishlist }: Props) {
  const { mutate } = useApiUpdateWishlistBlocks(wishlist.id)
  const { toast } = useToast()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleBlocksChange = useCallback(
    (blocks: Block[]) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        mutate(blocks, {
          onError: () => {
            toast({ title: 'Ошибка сохранения блоков', variant: 'destructive' })
          },
        })
      }, 500)
    },
    [mutate, toast]
  )

  return (
    <div className="space-y-6">
      <ConstructorHeader wishlist={wishlist} />
      <BlockCanvas
        initialBlocks={wishlist.blocks ?? []}
        onBlocksChange={handleBlocksChange}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify lint**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 3: Commit chunk 4**

```bash
git add app/wishlist/components/constructor/block-palette.tsx app/wishlist/components/constructor/constructor-header.tsx app/wishlist/components/constructor-editor.tsx
git commit -m "feat: add block palette with mini-previews and inline-editable constructor header"
```

---

## Chunk 5: Share sheet + instant creation

### Task 11: Create share-sheet.tsx

**Files:**
- Create: `components/share-sheet.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/share-sheet.tsx
'use client'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Wishlist } from '@/shared/types'
import { Check, Copy } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import React, { useState } from 'react'

type Props = {
  wishlist: Wishlist
  open: boolean
  onClose: () => void
}

export function ShareSheet({ wishlist, open, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://get-my-wishlist.ru'
  const shareUrl = wishlist.shortId
    ? `${base}/s/${wishlist.shortId}`
    : `${base}/${wishlist.userId}/${wishlist.id}`

  const isDev = process.env.NODE_ENV === 'development'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Поделиться вишлистом</SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* URL row */}
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
            <span className="flex-1 text-sm font-mono text-muted-foreground truncate">
              {shareUrl}
            </span>
            <Button size="sm" variant="ghost" onClick={handleCopy} className="shrink-0">
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              {copied ? 'Скопировано' : 'Копировать'}
            </Button>
          </div>

          {/* QR */}
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-xl">
              <QRCodeSVG value={shareUrl} size={160} />
            </div>
          </div>

          {/* Dev env badge */}
          {isDev && (
            <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400 px-3 py-2 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              dev · {base}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Verify lint**

```bash
pnpm lint
```

Expected: no errors.

---

### Task 12: Add share button to wishlist-card.tsx

**Files:**
- Modify: `app/wishlist/components/wishlist-card.tsx`

- [ ] **Step 1: Add ShareSheet import and share button**

Replace contents of `app/wishlist/components/wishlist-card.tsx`:

```typescript
'use client'

import { WishlistMenu } from '@/app/wishlist/[id]/components/wishlist-menu'
import { CardCover } from '@/components/card-cover'
import { ShareSheet } from '@/components/share-sheet'
import { Button } from '@/components/ui/button'
import { Wishlist } from '@/shared/types'
import { toDate } from 'date-fns'
import { Gift, Share2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

interface WishlistCardProps {
  wishlist: Wishlist
}

export const WishlistCard = ({ wishlist }: WishlistCardProps) => {
  const navigate = useRouter()
  const [shareOpen, setShareOpen] = React.useState(false)

  return (
    <>
      <div className="group w-[350px] relative border text-card-foreground rounded-xl shadow-lg hover:shadow-xl">
        <CardCover className="h-[200px]" cover={wishlist.cover} title={wishlist.title} />
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-lg font-semibold line-clamp-1">{wishlist.title}</h3>
              {Array.isArray(wishlist.blocks) && (
                <span className="shrink-0 text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Конструктор
                </span>
              )}
            </div>
            <WishlistMenu wishlist={wishlist} />
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{wishlist.description}</p>

          <div className="flex gap-2 mb-4">
            <Button
              className="flex-1"
              onClick={() => navigate.push(`/wishlist/${wishlist.id}`)}
            >
              Добавить подарки <Gift className="ml-2" size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShareOpen(true)}
              title="Поделиться"
            >
              <Share2 size={16} />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {wishlist.location.time && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {toDate(wishlist.location.time).toLocaleDateString()}
              </span>
            )}
            <span>•</span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {wishlist.presentsCount} подарков
            </span>
          </div>
        </div>
      </div>

      <ShareSheet
        wishlist={wishlist}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </>
  )
}
```

- [ ] **Step 2: Verify lint**

```bash
pnpm lint
```

Expected: no errors.

---

### Task 13: Instant constructor creation in wishlist/page.tsx

**Files:**
- Modify: `app/wishlist/page.tsx`
- Delete: `app/wishlist/create-constructor/page.tsx`
- Delete: `app/wishlist/components/constructor-meta-form.tsx`

- [ ] **Step 1: Replace contents of app/wishlist/page.tsx**

```typescript
'use client'

import { useApiCreateConstructorWishlist, useApiGetAllWishlists } from '@/api/wishlist'
import { WishlistCard } from '@/app/wishlist/components/wishlist-card'
import { Button } from '@/components/ui/button'
import { Gift, LayoutTemplate, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

export default function Page() {
  const { data } = useApiGetAllWishlists()
  const { mutate: createConstructor, isPending } = useApiCreateConstructorWishlist()
  const router = useRouter()

  const handleCreateConstructor = () => {
    createConstructor(
      { title: 'Новый вишлист', blocks: [] },
      {
        onSuccess: (res) => {
          router.push(`/wishlist/edit/${res.data.id}`)
        },
      }
    )
  }

  return (
    <div>
      <h2 className="text-4xl mb-5">Мои вишлисты</h2>
      <div className="flex gap-3 mb-6">
        <Button asChild variant="default">
          <Link href="/wishlist/create">
            <Gift className="mr-2" size={18} />
            Обычный вишлист
          </Link>
        </Button>
        <Button
          variant="outline"
          onClick={handleCreateConstructor}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="mr-2 animate-spin" size={18} />
          ) : (
            <LayoutTemplate className="mr-2" size={18} />
          )}
          Конструктор
        </Button>
      </div>
      <div className="flex flex-wrap gap-4 items-center">
        {data?.data?.map((wishlist) => (
          <WishlistCard key={wishlist.id} wishlist={wishlist} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Check for any other importers before deleting**

```bash
grep -r "constructor-meta-form\|create-constructor" app/ --include="*.tsx" --include="*.ts" -l
```

Expected: only `app/wishlist/create-constructor/page.tsx` (which imports `constructor-meta-form`). If other files appear, remove the imports from those files first.

- [ ] **Step 3: Delete old files**

```bash
git rm "app/wishlist/create-constructor/page.tsx"
rmdir "app/wishlist/create-constructor"
git rm "app/wishlist/components/constructor-meta-form.tsx"
```

- [ ] **Step 4: Verify lint**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 5: Commit chunk 5**

```bash
git add components/share-sheet.tsx app/wishlist/components/wishlist-card.tsx app/wishlist/page.tsx
git commit -m "feat: add share bottom sheet with QR, instant constructor creation, remove meta form step"
```

---

## Chunk 6: Final verification

### Task 14: Build check

- [ ] **Step 1: Run production build**

```bash
pnpm build
```

Expected: completes with no errors. Warnings about `img` element are acceptable.

- [ ] **Step 2: Manual smoke test checklist**

1. Go to `/wishlist` — click **Конструктор** — should redirect to `/wishlist/edit/:id` with the canvas open
2. Canvas shows **hero header** with "Новый вишлист" — click title, type new name — wait 1s — refresh — title should be saved
3. Click a block type in the left palette — block appears in 2-column grid
4. Click the block — **contextual toolbar** appears above with size pills, edit, delete, drag
5. Click `2×1` pill — block spans 2 columns
6. Toggle **Мобила** — grid switches to single column
7. Click **Поделиться** on a wishlist card — bottom sheet opens with URL, copy button, QR code
8. In dev: env badge shown. In prod build: env badge absent.

- [ ] **Step 3: Commit final build fix (if needed)**

```bash
git add <files-changed-to-fix-build>
git commit -m "fix: resolve build issues after constructor grid redesign"
```
