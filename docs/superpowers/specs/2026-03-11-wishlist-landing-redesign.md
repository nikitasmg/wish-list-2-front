# Wishlist Landing Redesign + Short Links Migration

**Date:** 2026-03-11
**Branch:** feature/constructor-wishlist

---

## Scope

Two interconnected tasks:
1. **Short links migration** — replace all `/{userId}/{wishlistId}` URLs with `/s/{shortId}` throughout the app
2. **Public wishlist page redesign** — beautiful, customizable landing page at `app/s/[shortId]/page.tsx`

---

## Short Links Migration

### Problem
- Current share URLs: `https://get-my-wishlist.ru/{userId}/{wishlistId}` — exposes userId, ugly, long
- Backend already supports short IDs: `GET /wishlists/s/:shortId` exists, `shortId` is in the `Wishlist` type
- `app/s/[shortId]/page.tsx` already exists but is a copy of the old page

### Changes Required
- `app/wishlist/[id]/components/share-buttons.tsx` — change URL from `/{userId}/{wishlistId}` to `/s/{wishlist.shortId}` (no longer needs `useApiGetMe`)
- `app/wishlist/components/constructor/constructor-header.tsx` — if it generates share links, update to short URL
- `app/[userId]/[wishlistId]/page.tsx` — add redirect to `/s/{shortId}` (or keep for backwards compat)
- All other places generating public wishlist URLs → `/s/{shortId}`

### Components to Move/Cleanup
- `app/[userId]/[wishlistId]/components/` → move to `app/s/[shortId]/components/` (these are the shared block renderers and present-item)
- Update all imports accordingly
- Old `app/[userId]/[wishlistId]/page.tsx` → redirect to `/s/{shortId}` if wishlist has shortId, else keep

---

## Public Wishlist Page Redesign

### Settings
Add to `Wishlist.settings`:
```ts
settings: {
  colorScheme: string         // existing
  showGiftAvailability: boolean // existing
  presentsLayout: 'grid3' | 'grid2' | 'list'  // NEW, default: 'list'
  headerStyle: 'hero'          // NEW, only hero for now (extensible)
}
```

### Architecture: `WishlistLanding` component
Extract public page into `app/s/[shortId]/components/wishlist-landing.tsx`
The page (`app/s/[shortId]/page.tsx`) stays thin — fetches data, renders `<WishlistLanding />`.

### Design System: Scheme Config
Each color scheme gets a visual character config:
```ts
type SchemeConfig = {
  heroOverlayGradient: string   // e.g. "from-black/80 via-black/40 to-transparent"
  titleSize: string              // e.g. "text-6xl md:text-8xl"
  fontWeight: string             // e.g. "font-black" or "font-bold"
  cardRadius: string             // e.g. "rounded-2xl" or "rounded-none" (monochrome)
  decorativeElement?: string     // e.g. emoji or SVG pattern per scheme
}
```

### Hero Header (full-screen)
- Cover image fills full first viewport (`100vh`)
- Dark gradient overlay from bottom
- Title + subtitle + event details (date, location) pinned to bottom-left
- Scroll indicator (↓) at bottom center
- If no cover image: gradient background using scheme colors

### Presents Layout Options
Stored in `settings.presentsLayout`, user selects in constructor/edit settings:
- `list` — horizontal rows: thumbnail (60×60) + name + description + price chip + "Хочу подарить" button
- `grid3` — 3 columns (2 on mobile): card with image, name, price
- `grid2` — 2 columns (1 on mobile): larger cards with full description

### Constructor Blocks
Blocks render between hero and presents — unchanged logic, same `BlockRenderer`.

### Presents Layout Setting UI
Add a "Раскладка подарков" selector in the wishlist settings (edit page / constructor settings panel).
Options stored in `Wishlist.settings.presentsLayout`, saved via existing edit API.

---

## File Structure After

```
app/
  s/
    [shortId]/
      page.tsx                    ← thin: fetch + <WishlistLanding />
      components/
        wishlist-landing.tsx      ← main component
        hero-header.tsx           ← full-screen hero
        presents-list.tsx         ← list layout
        presents-grid.tsx         ← grid layout
        present-item.tsx          ← moved from [userId]/[wishlistId]/
        confirm-modal.tsx         ← moved from [userId]/[wishlistId]/
        blocks/                   ← moved from [userId]/[wishlistId]/
          block-renderer.tsx
          ...block views
  [userId]/
    [wishlistId]/
      page.tsx                    ← redirects to /s/{shortId}
```

---

## Out of Scope
- WYSIWYG inline editing in the constructor (separate task)
- New color scheme designs (improve existing CSS variables)
- Backend changes (shortId already works)
