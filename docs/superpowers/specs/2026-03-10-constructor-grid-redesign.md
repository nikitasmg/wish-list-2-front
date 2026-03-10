# Constructor Grid Redesign — Design Spec

**Date:** 2026-03-10
**Status:** Approved

---

## Goal

Redesign the wishlist constructor editor to use a grid-based canvas with resizable blocks, a palette with live block-type previews, an inline-editable hero header (no separate meta form), a desktop/mobile view switcher, and a share bottom sheet with environment-aware URLs.

---

## Design Decisions

### 1. Layout — Two-Column (B)

- **Left panel (palette):** list of addable block types, each with a mini-preview showing how the block looks when rendered
- **Right canvas:** a CSS 2-column grid that renders the wishlist as it will appear to the guest — blocks live in the grid with their real dimensions

### 2. Block Resize — Contextual Toolbar (C)

When a block is clicked/focused, a floating toolbar appears above it containing:
- Size pills: `1×1` / `2×1` / `1×2` / `2×2` / `1×3` / `2×3` (colSpan × rowSpan)
- Edit button → opens the existing block editor modal
- Delete button
- Drag handle (for reordering)

Size changes update `colSpan` and `rowSpan` on the block and re-render the grid immediately.

### 3. Meta Integration — Editable Hero Header (C)

The canvas starts with an always-present, non-deletable **hero header block** above the sortable blocks grid. It contains:
- Inline title input (click to edit, auto-saves with 600ms debounce via `PUT /wishlists/:id`)
- Cover image (file upload or URL, same `ImageUpload` component)
- Settings chips: color scheme + show gift availability — click chip opens selector inline

### 4. Desktop / Mobile Switcher

A toggle in the canvas header switches between:
- **Desktop view:** 2-column CSS grid, blocks positioned by `position` / `colSpan` / `rowSpan`
- **Mobile view:** 1-column list, blocks ordered by `mobilePosition` (falls back to `position`). Drag reorders `mobilePosition`.

### 5. Creation Flow — Instant Create (A)

The "Конструктор" button on `/wishlist` page calls `POST /wishlists/constructor` with `{ title: "Новый вишлист", blocks: [] }` directly (no intermediate form page). On success, redirects to `/wishlist/edit/:id`. The hero header prompts the user to click and rename.

The old `create-constructor/page.tsx` and `constructor-meta-form.tsx` are deleted.

### 6. Share Bottom Sheet (C, dev-only env badge)

A `ShareSheet` component (shadcn `Sheet` from bottom) triggered by a "Поделиться" button on each wishlist card:
- Short link display with one-click copy (constructed as `${NEXT_PUBLIC_APP_URL}/s/${shortId}`)
- QR code via `qrcode.react`
- Env badge (`dev · localhost:3000`) only when `process.env.NODE_ENV === 'development'`

---

## Data Model Changes

### Block (frontend + backend)

Add two optional integer fields:

```
colSpan:  1 | 2        (default 1)  — how many grid columns the block occupies
rowSpan:  1 | 2 | 3   (default 1)  — how many grid rows the block occupies
```

Stored in the existing JSONB `blocks` column — no DB migration required.

### NEXT_PUBLIC_APP_URL env var

- `.env.local` (dev): `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- Production env: `NEXT_PUBLIC_APP_URL=https://get-my-wishlist.ru`

---

## Files Affected

### Backend (wish-list-2-back)
- `internal/entity/wishlist.go` — add `ColSpan`, `RowSpan` to `Block`
- `internal/repo/persistent/models.go` — add fields to `blockJSON`
- `internal/repo/persistent/converters.go` — map new fields in both directions

### Frontend (wish-list-2-front)
- **Delete:** `app/wishlist/create-constructor/page.tsx`
- **Delete:** `app/wishlist/components/constructor-meta-form.tsx`
- **Modify:** `shared/types.ts` — add `colSpan?`, `rowSpan?` to `Block`
- **Modify:** `api/wishlist/index.ts` — add `useApiUpdateConstructorMeta` hook
- **Modify:** `app/wishlist/page.tsx` — instant-create button
- **Modify:** `app/wishlist/components/wishlist-card.tsx` — add share button
- **Modify:** `app/wishlist/components/constructor-editor.tsx` — integrate hero header
- **Modify:** `app/wishlist/components/constructor/block-canvas.tsx` — CSS grid + switcher
- **Modify:** `app/wishlist/components/constructor/block-item.tsx` — grid styles + toolbar integration
- **Modify:** `app/wishlist/components/constructor/block-palette.tsx` — mini-previews
- **Create:** `app/wishlist/components/constructor/block-toolbar.tsx`
- **Create:** `app/wishlist/components/constructor/constructor-header.tsx`
- **Create:** `components/share-sheet.tsx`
