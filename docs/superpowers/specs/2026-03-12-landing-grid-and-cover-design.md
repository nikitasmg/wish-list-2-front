# Design: Landing Block Grid + Constructor Cover Upload

**Date:** 2026-03-12
**Branch:** feature/constructor-wishlist

---

## Problem

Two gaps between the constructor and the public landing page:

1. **Block layout**: The constructor editor places blocks in a 2-column CSS grid with per-block `colSpan` (1–2) and `rowSpan` (1–3). The public landing's `BlockRenderer` ignores these properties and renders all blocks as a vertical `space-y-12` list.

2. **Cover upload**: The `Wishlist` type has a `cover` field and `HeroHeader` already displays it, but the constructor has no UI for uploading or removing the cover image.

---

## Solution

### 1. BlockRenderer — Responsive Grid

**File:** `app/s/[shortId]/components/blocks/block-renderer.tsx`

Replace the `space-y-12` wrapper div with a CSS grid:

```
className="grid grid-cols-1 md:grid-cols-2 gap-8 md:auto-rows-[minmax(100px,auto)]"
```

Blocks are sorted by `position` in the DOM before rendering (desktop order). Each block wrapper:
- Gets `key={block.position}` (stable key, not array index)
- Gets `className="block-grid-item"`
- Gets inline CSS custom properties computed with explicit defaults:
  - `--mobile-order`: `block.mobilePosition ?? block.position` (`position` is always set)
  - `--col-span`: `span ${block.colSpan ?? 1}` (CSS custom property stores full value e.g. `"span 2"`, valid CSS)
  - `--row-span`: `span ${block.rowSpan ?? 1}`

Mobile reordering is handled purely by CSS `order`. The grid stays 2-column at all desktop breakpoints (`md` and above); no wider grid variant is needed as the landing is already constrained by `max-w-5xl`.

FormData field order is not significant for multipart parsing.

**`globals.css` addition** (~6 lines):
```css
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

**Behaviour summary:**
- Mobile (`< md`): single column, blocks ordered by `mobilePosition ?? position`; `rowSpan` has no effect (blocks stack naturally)
- Desktop (`≥ md`): 2-column grid, `colSpan`/`rowSpan` respected, ordered by `position`
- A block with `colSpan: 2` spans both columns (full row) — correct and intentional

`position` values are immutable after assignment (reassigned only on save), making them stable React keys.

---

### 2. CoverSection — Constructor Cover Upload

**New file:** `app/wishlist/components/constructor/cover-section.tsx`
**Placement:** In `constructor-editor.tsx`, between `<ConstructorHeader>` and `<BlockCanvas>` (editor mode only)

#### States

**No cover:**
- Hero-like preview area (~200px height)
- Gradient fallback background (`from-primary/30 via-background to-accent/20`)
- Wishlist title shown (so user sees how it looks)
- Dashed border around the area
- Centered "Добавить обложку" button → triggers `<input type="file" accept="image/*">`

**Has cover:**
- Image displayed as background (`object-cover`)
- Gradient overlay using `getSchemeConfig(wishlist.settings.colorScheme).heroOverlay` (same variable as `HeroHeader`)
- Wishlist title shown at bottom-left (title only, not location/description — this is an editor preview, not a full hero replica)
- Two buttons in top-right corner:
  - "Изменить" → triggers file picker
  - Trash icon → removes cover

#### Local state
- `previewUrl: string | null` — shows `URL.createObjectURL(file)` immediately on select for optimistic UI
- On new file select: revoke previous `previewUrl` before creating new one (avoid memory leak)
- On unmount: revoke current `previewUrl` via `useEffect` cleanup

#### Saving
- Uses `useApiUpdateConstructorMeta(wishlist.id)` directly (own mutation call, independent from `ConstructorHeader`)
- `CoverSection` must NOT reuse `ConstructorHeader.saveMeta()` — that function has fallback logic that re-sends `wishlist.cover`, which would prevent deletion
- No race condition concern: cover and meta edits are separate user actions; simultaneous calls are not a realistic scenario
- On file select: build `FormData`, append `file`, append all current meta fields (title, colorScheme, presentsLayout, showGiftAvailability) from `wishlist` prop, call `mutate(fd)`
- On delete: build `FormData` with same meta fields, append `cover_url=""` (empty string), call `mutate(fd)` → backend stores `""` which clears the cover
- During `isPending`: disable "Изменить" and trash buttons, show spinner or subtle loading indicator on the cover area
- On error: show toast "Ошибка сохранения обложки"

---

### 3. Backend Change (wish-list-2-back)

**File:** `internal/usecase/wishlist/wishlist.go`

**Current:**
```go
if coverURL != "" {
    w.Cover = coverURL
}
```

**Change to:**
```go
w.Cover = coverURL
```

This allows an empty `cover_url=""` from the frontend to clear the cover field. No other backend changes needed.

---

## Files Changed

### Frontend (`wish-list-2-front`)
| File | Change |
|------|--------|
| `app/s/[shortId]/components/blocks/block-renderer.tsx` | Replace `space-y-12` list with CSS grid; add CSS custom properties per block |
| `app/globals.css` | Add `.block-grid-item` CSS rule (~6 lines) |
| `app/wishlist/components/constructor/cover-section.tsx` | New component |
| `app/wishlist/components/constructor-editor.tsx` | Import and render `<CoverSection>` in editor mode |

### Backend (`wish-list-2-back`)
| File | Change |
|------|--------|
| `internal/usecase/wishlist/wishlist.go` | Remove `!= ""` guard on cover assignment |

---

## Out of Scope
- Mobile view in the constructor editor (already handled by `BlockCanvas`)
- Changes to block view components themselves
- Cover upload for non-constructor wishlists
