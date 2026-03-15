# Visual Fixes & Mobile Adaptation — Design Spec

**Date:** 2026-03-15
**Branch:** feature/constructor-wishlist

## Overview

Eight UI/visual fixes across the app: mobile layout bugs, constructor mobile adaptation, header redesign, dark-only theme enforcement, and minor spacing/style fixes.

---

## 1. Present Cards — Mobile Layout Fix

**File:** `app/s/[shortId]/components/present-item.tsx`

**Problem:** Bottom row `flex items-center justify-between flex-row gap-6` causes overflow on narrow screens when "Забронировать" button and "В магазин" link are both present.

**Fix:**
- Change bottom row to `flex flex-col sm:flex-row` with `gap-3`
- Remove `md:max-w-[350px]` from the card wrapper (let the grid control width)

---

## 2. Constructor — Mobile Adaptation (Variant B)

**Files:** `app/wishlist/components/constructor/block-canvas.tsx`, `app/wishlist/components/constructor/block-palette.tsx`

**Problem:** `BlockPalette` is `w-56 shrink-0` in a `flex-row` layout — on mobile it occupies half the screen, canvas gets no room. `PointerSensor` doesn't fire on touch.

**Fix:**

`BlockCanvas` outer wrapper (line 96): change from `flex gap-6 items-start` to:
```
flex flex-col gap-4 items-start md:flex-row md:gap-6
```

`BlockPalette` wrapper (line 178): change from `w-56 shrink-0 space-y-2` to:
```
w-full overflow-x-auto flex flex-row gap-2 pb-2 md:w-56 md:shrink-0 md:flex-col md:overflow-x-visible md:pb-0
```

Each palette button on mobile: add `shrink-0 w-28 md:w-full` to the button className.

`TouchSensor` — add **only in `block-canvas.tsx`** alongside `PointerSensor`:
```ts
import { PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'

const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
)
```
The 250ms delay and 8px tolerance give enough room to distinguish scroll from drag on touch devices.

Note: `header.tsx` is already `'use client'` (uses `useApiGetMe` hook), so scroll detection works without changes to its directive.

---

## 3. Header — Sticky + Blur on Scroll + Navigation

**Files:** `components/header.tsx`, `components/user-avatar.tsx`

**Problem:** Header is not sticky, no visual feedback on scroll, navigation hidden in dropdown. `ModeToggle` must be removed (dark theme is now forced).

**Design:**

Desktop:
```
Logo  |  [Мои вишлисты]  [Примеры]  |  [Войти / Avatar]
```

Mobile:
```
Logo  |  [icon: LayoutList]  [icon: Sparkles]  |  [Avatar]
```

**Scroll behavior:**
- Outer `<header>` always: `sticky top-0 z-50 transition-all duration-200`
- `scrollY === 0`: no extra classes (transparent)
- `scrollY > 0`: add `backdrop-blur-md bg-background/80 border-b border-border/50`
- Implement via `useEffect` with `window.addEventListener('scroll', handler)` + `useState<boolean>` for `isScrolled`

**Implementation:**
- "Мои вишлисты" link → `/wishlist`, text hidden on mobile (`hidden md:inline`), `LayoutList` icon visible on mobile
- "Примеры" link → `/example`, text hidden on mobile (`hidden md:inline`), `Sparkles` icon visible on mobile
- Navigation links: show for both authenticated and unauthenticated users
- Remove `<ModeToggle />` import and usage entirely
- `UserAvatar` dropdown retains "Мои вишлисты" + "Выйти"

---

## 4. Example Page — Header & Breadcrumbs

**New file:** `app/example/layout.tsx`

Create a layout wrapping the example page with `<Header />` and the standard container (same pattern as `app/wishlist/layout.tsx`):
```tsx
import { Header } from '@/components/header'
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="p-5 max-w-[90rem] mx-auto">{children}</div>
    </>
  )
}
```

**In `app/example/page.tsx`:** `Breadcrumbs` already has a hardcoded "Главная" root. Pass `items={[]}` (no intermediate crumbs) and `page="Примеры вишлистов"`:
```tsx
<Breadcrumbs items={[]} page="Примеры вишлистов" />
```

---

## 5. Text Block Editor — Text Too Dark

**File:** `app/wishlist/components/constructor/blocks/text-block-editor.tsx`

**Problem:** `prose prose-sm` applies hardcoded `color: #111827` (Tailwind Typography default) ignoring CSS theme variables. Since dark mode is now always active, use `dark:prose-invert`.

**Fix:** Change `EditorContent` className from:
```
prose prose-sm max-w-none ...
```
to:
```
prose prose-sm dark:prose-invert max-w-none ...
```

Do NOT add a global `.ProseMirror { color: inherit; }` CSS rule — it would only affect the root element and conflict with `prose-invert` color assignments on nested elements (`p`, `h2`, `h3`, etc.). `dark:prose-invert` alone is sufficient and correct.

---

## 6. Always Dark Theme

**Files:** `app/providers.tsx`, `components/header.tsx`, `app/page.tsx`

**Problem:** App supports light/dark toggle but landing page hardcodes dark bg with `style={{ background: '#000d1a' }}`. User wants permanently dark UI. Custom color scheme themes (pink, green, etc.) are being abandoned in this change.

**Fix:**

`app/providers.tsx` — replace ThemeProvider props:
```tsx
<ThemeProvider
  attribute="class"
  forcedTheme="dark"
  disableTransitionOnChange
>
```
Remove: `defaultTheme="system"`, `enableSystem`, `themes={[...]}` — all irrelevant with `forcedTheme`.

`app/page.tsx` — remove `style={{ background: '#000d1a' }}` from the outer div. The CSS `--background` variable (dark theme) handles the dark background.

`components/header.tsx` — remove `<ModeToggle />` and its import (handled in Item 3).

---

## 7. Spacing Under Breadcrumbs in Constructor

**Files:** `app/wishlist/edit/[id]/page.tsx`, `components/breadcrumbs.tsx`

**Fix:** Add `className` prop support to `Breadcrumbs`, then use it at the call site.

`components/breadcrumbs.tsx` — update Props and pass through:
```tsx
type Props = {
  page: string
  items: { name: string; url: string }[]
  className?: string
}

export const Breadcrumbs = ({ page, items, className }: Props) => (
  <Breadcrumb className={className}>
    ...
  </Breadcrumb>
)
```

`app/wishlist/edit/[id]/page.tsx`:
```tsx
<Breadcrumbs className="mb-4" items={[{ name: 'Мои вишлисты', url: '/wishlist' }]} page={wishlist.title} />
```

---

## 8. Wishlist Page — Mobile Layout

**Files:** `app/wishlist/page.tsx`, `app/wishlist/components/wishlist-card.tsx`, `components/share-button.tsx`

**Problems:**
- Grid `grid-cols-2` on mobile is too tight with action buttons
- `ShareButtons` renders text buttons that overflow on small cards

**Fix:**

`app/wishlist/page.tsx` grid: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`

`components/share-button.tsx` — hide button text on mobile:
```tsx
<Button variant="outline" size="sm" onClick={handleShare}>
  <Share2 size={14} />
  <span className="hidden sm:inline ml-1.5">Поделиться</span>
</Button>
<Button variant="ghost" size="sm" onClick={copyToClipboard}>
  <Copy size={14} />
  <span className="hidden sm:inline ml-1.5">Скопировать</span>
</Button>
```

---

## Implementation Order

1. Dark theme enforcement (`providers.tsx`, `app/page.tsx`) — unblocks header
2. Header redesign (`header.tsx`) — most visible change
3. Spacing fix (`breadcrumbs.tsx` + `edit/[id]/page.tsx`) — trivial
4. Example page layout + breadcrumbs (`app/example/layout.tsx`, `page.tsx`) — trivial
5. Text block editor fix (`text-block-editor.tsx`) — isolated
6. Wishlist page mobile (`wishlist/page.tsx`, `share-button.tsx`) — isolated
7. Present cards mobile fix (`present-item.tsx`) — isolated
8. Constructor mobile adaptation (`block-canvas.tsx`, `block-palette.tsx`) — most complex
