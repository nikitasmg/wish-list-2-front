# Landing Block Grid + Constructor Cover Upload — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the public landing page to respect block `colSpan`/`rowSpan`/`mobilePosition` from the constructor, and add a cover upload UI to the constructor editor.

**Architecture:** Three independent changes — a one-line Go backend fix to allow cover removal, a CSS + BlockRenderer update that introduces a responsive grid, and a new `CoverSection` React component wired into the constructor editor.

**Tech Stack:** Next.js 15 App Router, React, Tailwind CSS, TanStack Query (`useMutation`), `next/image`, Go (backend)

**Spec:** `docs/superpowers/specs/2026-03-12-landing-grid-and-cover-design.md`

---

## Chunk 1: Backend Fix + Landing Block Grid

### Task 1: Backend — allow clearing cover with empty string

**Files:**
- Modify: `C:\Users\nvsma\OneDrive\Документы\projects\wish-list-2-back\internal\usecase\wishlist\wishlist.go:139-141`

Context: the backend currently ignores an empty `cover_url` field, so the frontend can never clear a cover. We remove the guard.

- [ ] **Step 1: Open the file and find the cover guard**

In `wish-list-2-back/internal/usecase/wishlist/wishlist.go` around line 139, find:

```go
coverURL, err := uc.resolveCover(input.CoverData, input.CoverName, input.CoverURL)
if err != nil {
    return entity.Wishlist{}, err
}
if coverURL != "" {
    w.Cover = coverURL
}
```

- [ ] **Step 2: Remove the `!= ""` guard**

Replace with:

```go
coverURL, err := uc.resolveCover(input.CoverData, input.CoverName, input.CoverURL)
if err != nil {
    return entity.Wishlist{}, err
}
w.Cover = coverURL
```

- [ ] **Step 3: Build the backend to verify no compile errors**

```bash
cd "C:\Users\nvsma\OneDrive\Документы\projects\wish-list-2-back"
go build ./...
```

Expected: no output (successful build).

- [ ] **Step 4: Commit**

```bash
cd "C:\Users\nvsma\OneDrive\Документы\projects\wish-list-2-back"
git add internal/usecase/wishlist/wishlist.go
git commit -m "fix: allow clearing wishlist cover by sending empty cover_url"
```

---

### Task 2: globals.css — add block-grid-item utility class

**Files:**
- Modify: `app/globals.css` (append after the closing `}` of the last `@layer base` block, around line 292)

Context: CSS custom properties set on each block wrapper (`--col-span`, `--row-span`, `--mobile-order`) need to be consumed by CSS rules. Tailwind can't generate these dynamically, so we add them to globals.

- [ ] **Step 1: Append the CSS rule to `app/globals.css`**

Add at the very end of the file (after line 292):

```css
/* Block grid layout for landing page */
.block-grid-item {
  order: var(--mobile-order, 0);
}
@media (min-width: 768px) {
  .block-grid-item {
    grid-column: var(--col-span, span 1);
    grid-row: var(--row-span, span 1);
    order: unset;
  }
}
```

- [ ] **Step 2: Verify lint passes**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: add block-grid-item CSS utility for landing block grid"
```

---

### Task 3: BlockRenderer — switch to responsive CSS grid

**Files:**
- Modify: `app/s/[shortId]/components/blocks/block-renderer.tsx`

Context: currently renders all blocks as a `space-y-12` vertical list. Need to switch to a 2-column grid on desktop that respects `colSpan`, `rowSpan`, and `mobilePosition` from each block.

- [ ] **Step 1: Replace the BlockRenderer implementation**

Open `app/s/[shortId]/components/blocks/block-renderer.tsx` and replace the entire file content:

```tsx
import { AgendaBlockView } from '@/app/s/[shortId]/components/blocks/agenda-block-view'
import { ChecklistBlockView } from '@/app/s/[shortId]/components/blocks/checklist-block-view'
import { ColorSchemeBlockView } from '@/app/s/[shortId]/components/blocks/color-scheme-block-view'
import { ContactBlockView } from '@/app/s/[shortId]/components/blocks/contact-block-view'
import { DateBlockView } from '@/app/s/[shortId]/components/blocks/date-block-view'
import { DividerBlockView } from '@/app/s/[shortId]/components/blocks/divider-block-view'
import { GalleryBlockView } from '@/app/s/[shortId]/components/blocks/gallery-block-view'
import { ImageBlockView } from '@/app/s/[shortId]/components/blocks/image-block-view'
import { LocationBlockView } from '@/app/s/[shortId]/components/blocks/location-block-view'
import { QuoteBlockView } from '@/app/s/[shortId]/components/blocks/quote-block-view'
import { TextBlockView } from '@/app/s/[shortId]/components/blocks/text-block-view'
import { TextImageBlockView } from '@/app/s/[shortId]/components/blocks/text-image-block-view'
import { TimingBlockView } from '@/app/s/[shortId]/components/blocks/timing-block-view'
import { VideoBlockView } from '@/app/s/[shortId]/components/blocks/video-block-view'
import { Block } from '@/shared/types'
import React from 'react'

type Props = {
  blocks: Block[]
}

export function BlockRenderer({ blocks }: Props) {
  const sorted = [...blocks].sort((a, b) => a.position - b.position)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:auto-rows-[minmax(100px,auto)]">
      {sorted.map((block) => (
        <div
          key={block.position}
          className="block-grid-item"
          style={{
            '--mobile-order': block.mobilePosition ?? block.position,
            '--col-span': `span ${block.colSpan ?? 1}`,
            '--row-span': `span ${block.rowSpan ?? 1}`,
          } as React.CSSProperties}
        >
          {block.type === 'text' && <TextBlockView block={block} />}
          {block.type === 'text_image' && <TextImageBlockView block={block} />}
          {block.type === 'image' && <ImageBlockView block={block} />}
          {block.type === 'date' && <DateBlockView block={block} />}
          {block.type === 'location' && <LocationBlockView block={block} />}
          {block.type === 'color_scheme' && <ColorSchemeBlockView block={block} />}
          {block.type === 'timing' && <TimingBlockView block={block} />}
          {block.type === 'agenda' && <AgendaBlockView block={block} />}
          {block.type === 'gallery' && <GalleryBlockView block={block} />}
          {block.type === 'quote' && <QuoteBlockView block={block} />}
          {block.type === 'divider' && <DividerBlockView block={block} />}
          {block.type === 'contact' && <ContactBlockView block={block} />}
          {block.type === 'video' && <VideoBlockView block={block} />}
          {block.type === 'checklist' && <ChecklistBlockView block={block} />}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify lint passes**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 3: Manual smoke test**

Start dev server (`pnpm dev`), open a wishlist landing page that has blocks. Verify:
- On desktop: blocks are in a 2-column grid, wide blocks (colSpan 2) span full width
- On mobile: blocks stack single-column

- [ ] **Step 4: Commit**

```bash
git add app/s/[shortId]/components/blocks/block-renderer.tsx
git commit -m "feat: respect colSpan/rowSpan/mobilePosition in landing BlockRenderer"
```

---

## Chunk 2: CoverSection Component

### Task 4: Create CoverSection component

**Files:**
- Create: `app/wishlist/components/constructor/cover-section.tsx`

Context: new component that lets the user add/change/remove the wishlist cover directly in the constructor editor. It shows a hero-like preview, handles optimistic UI via `URL.createObjectURL`, calls `useApiUpdateConstructorMeta` independently.

Key constraints:
- Must NOT reuse `ConstructorHeader.saveMeta()` — that function re-sends the existing cover when no override is given, which would prevent deletion
- On delete: sends `cover_url=""` (empty string) to the backend — this works after Task 1's backend fix
- Must include all meta fields (title, colorScheme, presentsLayout, showGiftAvailability) in every FormData call, to avoid accidentally clearing them
- Uses `getSchemeConfig` from `@/app/s/[shortId]/components/scheme-config` to get the `heroOverlay` gradient class for the cover preview

- [ ] **Step 1: Create the file**

Create `app/wishlist/components/constructor/cover-section.tsx`:

```tsx
'use client'

import { useApiUpdateConstructorMeta } from '@/api/wishlist'
import { getSchemeConfig } from '@/app/s/[shortId]/components/scheme-config'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Wishlist } from '@/shared/types'
import { ImageIcon, Loader2, Trash2, Upload } from 'lucide-react'
import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'

type Props = {
  wishlist: Wishlist
}

export function CoverSection({ wishlist }: Props) {
  const { mutate, isPending } = useApiUpdateConstructorMeta(wishlist.id)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const config = getSchemeConfig(wishlist.settings.colorScheme)
  const displayUrl = previewUrl ?? wishlist.cover ?? null

  function buildBaseMeta(): FormData {
    const fd = new FormData()
    fd.append('title', wishlist.title)
    fd.append('settings[colorScheme]', wishlist.settings.colorScheme ?? '')
    fd.append('settings[showGiftAvailability]', String(wishlist.settings.showGiftAvailability))
    fd.append('settings[presentsLayout]', wishlist.settings.presentsLayout ?? 'list')
    return fd
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Revoke previous preview before creating new one
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    const fd = buildBaseMeta()
    fd.append('file', file)
    mutate(fd, {
      onError: () => {
        toast({ title: 'Ошибка сохранения обложки', variant: 'destructive' })
        setPreviewUrl(null)
      },
    })

    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  function handleDelete() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    const fd = buildBaseMeta()
    fd.append('cover_url', '')
    mutate(fd, {
      onError: () => toast({ title: 'Ошибка сохранения обложки', variant: 'destructive' }),
    })
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden mb-6">
      <div className="px-6 pt-4 pb-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Обложка вишлиста</p>
      </div>

      {/* Preview area */}
      <div className="relative h-48 w-full">
        {displayUrl ? (
          <>
            <Image
              src={displayUrl}
              alt="Обложка вишлиста"
              fill
              unoptimized
              className="object-cover"
            />
            {/* Gradient overlay */}
            <div className={cn('absolute inset-0 bg-gradient-to-t', config.heroOverlay)} />

            {/* Title */}
            <div className="absolute bottom-0 left-0 px-5 pb-4">
              <p className="text-white font-bold text-xl drop-shadow">{wishlist.title}</p>
            </div>

            {/* Action buttons */}
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-black/50 text-white hover:bg-black/70 transition-colors disabled:opacity-50"
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Изменить
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-black/50 text-white hover:bg-destructive transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </>
        ) : (
          /* No cover state */
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/30 via-background to-accent/20 border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors"
            onClick={() => !isPending && fileInputRef.current?.click()}
          >
            {isPending ? (
              <Loader2 size={24} className="text-muted-foreground animate-spin" />
            ) : (
              <>
                <ImageIcon size={32} className="text-muted-foreground" />
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Upload size={14} />
                  Добавить обложку
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
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

---

### Task 5: Wire CoverSection into constructor-editor

**Files:**
- Modify: `app/wishlist/components/constructor-editor.tsx`

Context: add `<CoverSection>` in the editor mode, between `<ConstructorHeader>` and `<BlockCanvas>`.

- [ ] **Step 1: Add import**

In `app/wishlist/components/constructor-editor.tsx`, add the import after the existing `ConstructorHeader` import:

```tsx
import { CoverSection } from '@/app/wishlist/components/constructor/cover-section'
```

- [ ] **Step 2: Render CoverSection in editor mode**

In the same file, find:

```tsx
      {mode === 'editor' && (
        <div className="space-y-6">
          <ConstructorHeader wishlist={wishlist} />
          <BlockCanvas
```

Replace with:

```tsx
      {mode === 'editor' && (
        <div className="space-y-6">
          <ConstructorHeader wishlist={wishlist} />
          <CoverSection wishlist={wishlist} />
          <BlockCanvas
```

- [ ] **Step 3: Verify lint**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 4: Manual smoke test**

Start dev server (`pnpm dev`) and open the constructor for a wishlist:

1. **No cover**: verify the dashed upload area shows with "Добавить обложку" button and wishlist title overlaid on the gradient
2. **Add cover**: click "Добавить обложку", pick an image → verify optimistic preview appears immediately, then persists after save
3. **Change cover**: click "Изменить", pick a new image → verify preview updates
4. **Delete cover**: click the trash button → verify preview disappears and the dashed placeholder is shown; reload page to confirm the backend persisted the deletion
5. **Loading state**: during upload, verify buttons are disabled and spinner shows

- [ ] **Step 5: Commit**

```bash
git add app/wishlist/components/constructor/cover-section.tsx app/wishlist/components/constructor-editor.tsx
git commit -m "feat: add cover upload/delete UI to constructor editor"
```
