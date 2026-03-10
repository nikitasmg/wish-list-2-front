# Constructor Wishlist — Design Spec
Date: 2026-03-10

## Overview

Add a second wishlist creation mode — a drag-and-drop block constructor. Users compose their wishlist from predefined blocks (text, image, date, location, etc.) via a sidebar + canvas editor. The existing simple wishlist creation flow remains unchanged. Also adds short links (`/s/abc-def-ghi`) and a dual file/URL image upload component.

## Decisions

| Topic | Decision |
|---|---|
| DnD library | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Constructor layout | Sidebar (block palette) + canvas (sortable blocks) |
| Short links | Both `/s/[shortId]` and `/[userId]/[wishlistId]` work |
| Image upload | Drag&drop zone + "or" separator + URL input below |
| Presents in constructor | Yes — blocks on top, presents section below |
| Architecture | Separate pages, old flow untouched |

## Section 1 — Routing

| Route | Description |
|---|---|
| `/wishlist/create` | Unchanged |
| `/wishlist/create-constructor` | New — step 1 meta + step 2 block editor |
| `/wishlist/edit/[id]` | Auto-detects type: if `wishlist.blocks != null` renders constructor editor, else regular form |
| `/s/[shortId]` | New — public view via short link |
| `/[userId]/[wishlistId]` | Unchanged, now also renders blocks if present |

**`/wishlist` list page:** add two create buttons — "Обычный вишлист" and "Конструктор".

## Section 2 — Types & API

### New types (`shared/types.ts`)

```typescript
type BlockType = 'text' | 'text_image' | 'image' | 'date' | 'location' | 'color_scheme' | 'timing'

type Block = {
  type: BlockType
  position: number
  mobilePosition?: number
  data: Record<string, unknown>
}

// Added to Wishlist:
shortId?: string
blocks?: Block[]  // undefined = regular wishlist
```

### Block data shapes (per type)

```typescript
// text:        { content: string }
// text_image:  { content: string, imageUrl: string }
// image:       { url: string }
// date:        { datetime: string, label?: string }
// location:    { name: string, link?: string }
// color_scheme:{ scheme: string }
// timing:      { start: string, end?: string }
```

### New API hooks (`api/wishlist/index.ts`)

- `useApiCreateConstructorWishlist` — `POST api/v1/wishlists/constructor` (JSON body)
- `useApiUpdateWishlistBlocks(id)` — `PUT api/v1/wishlists/:id/blocks` (JSON array)
- `useApiGetWishlistByShortId(shortId)` — `GET api/v1/wishlists/s/:shortId`

### Updated hooks

- `useApiCreateWishlist` and `useApiEditWishlist` — support `cover_url` field in FormData (when user provided URL instead of file)

## Section 3 — Constructor Components

### Create flow (`/wishlist/create-constructor`)

Two steps:
1. **Meta** — title, description, cover (`ImageUpload`), color scheme → "Далее"
2. **Redirect** — calls `POST wishlists/constructor`, redirects to `/wishlist/edit/[id]` in constructor mode

### Editor layout (`/wishlist/edit/[id]` in constructor mode)

Sidebar + canvas layout:
- **Left sidebar** (`BlockPalette`) — list of 7 block types, each draggable onto canvas
- **Right canvas** (`BlockCanvas`) — sortable list of added blocks, each with drag handle, inline preview, edit and delete buttons
- Auto-save on change — debounce 500ms → `PUT wishlists/:id/blocks`

### Component structure

```
app/wishlist/components/
  constructor/
    block-canvas.tsx          — @dnd-kit/sortable sortable list
    block-palette.tsx         — sidebar with draggable block type tiles
    block-item.tsx            — single block: drag handle + preview + actions
    block-editor-modal.tsx    — modal for editing block data
    blocks/
      text-block.tsx
      image-block.tsx
      date-block.tsx
      location-block.tsx
      color-scheme-block.tsx
      timing-block.tsx
      text-image-block.tsx
```

### ImageUpload component (`components/image-upload.tsx`)

Reused in regular create/edit form and constructor blocks that have images.

- Drag&drop zone for file upload
- "или" divider
- URL text input
- Returns `{ type: 'file', value: File } | { type: 'url', value: string }`

## Section 4 — Public View

### Block rendering

Both `/[userId]/[wishlistId]` and `/s/[shortId]` use the same rendering logic:
- If `wishlist.blocks` exists → render blocks first, then presents section
- If not → existing behavior unchanged

```
app/[userId]/[wishlistId]/components/
  blocks/
    block-renderer.tsx         — switch by type
    text-block-view.tsx
    image-block-view.tsx
    date-block-view.tsx
    location-block-view.tsx
    color-scheme-block-view.tsx
    timing-block-view.tsx
    text-image-block-view.tsx
```

### Short link page

`app/s/[shortId]/page.tsx` — calls `useApiGetWishlistByShortId`, renders the same public view component as `/[userId]/[wishlistId]`.

### Wishlist list cards

Add "Конструктор" badge to `wishlist-card.tsx` when `wishlist.blocks != null`.

## Backend Reference

- Constructor create: `POST /api/v1/wishlists/constructor` — JSON body (not multipart)
- Update blocks: `PUT /api/v1/wishlists/:id/blocks` — JSON array of blocks
- Short ID lookup: `GET /api/v1/wishlists/s/:shortId`
- Block types: `text`, `text_image`, `image`, `date`, `location`, `color_scheme`, `timing`
- Short ID format: `abc-def-ghi` (11 chars, generated server-side)
