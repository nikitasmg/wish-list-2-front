# Wishlist Landing Redesign + Short Links Migration

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all public wishlist URLs to `/s/{shortId}`, redesign the public landing page with a hero header, list/grid presents layout, and per-scheme visual character.

**Architecture:** Three-chunk delivery — (1) migrate short links + move shared components, (2) extend backend Settings with `presentsLayout`, (3) redesign public page with `WishlistLanding` component and design system.

**Tech Stack:** Next.js 16 App Router, React, TanStack Query, Tailwind CSS, shadcn/ui, Go (Fiber) backend

---

## File Map

### Chunk 1 — Short Links Migration

| Action | Path |
|--------|------|
| Modify | `app/[userId]/[wishlistId]/page.tsx` — redirect to `/s/{shortId}` |
| Modify | `app/wishlist/[id]/components/share-buttons.tsx` — use `shortId` |
| Move → | `app/[userId]/[wishlistId]/components/` → `app/s/[shortId]/components/` |
| Modify | `app/s/[shortId]/page.tsx` — update imports after move |

### Chunk 2 — Backend: presentsLayout setting

| Action | Path |
|--------|------|
| Modify | `internal/entity/wishlist.go` — add `PresentsLayout` to `Settings` |
| Modify | `internal/repo/persistent/models.go` — add `PresentsLayout` to `SettingsJSON` |
| Modify | `internal/repo/persistent/converters.go` — map `PresentsLayout` in both converter directions |
| Modify | `internal/usecase/contracts.go` — add `PresentsLayout` to both input structs |
| Modify | `internal/usecase/wishlist/wishlist.go` — pass `PresentsLayout` in create/update |
| Modify | `internal/controller/restapi/v1/wishlist.go` — parse `settings[presentsLayout]` from form and JSON body |
| Modify | `shared/types.ts` (frontend) — add `presentsLayout` to `Wishlist.settings` |

### Chunk 3 — Landing Page Redesign

| Action | Path |
|--------|------|
| Create | `app/s/[shortId]/components/wishlist-landing.tsx` — top-level component |
| Create | `app/s/[shortId]/components/hero-header.tsx` — full-screen cover hero |
| Create | `app/s/[shortId]/components/presents-list.tsx` — list layout for presents |
| Create | `app/s/[shortId]/components/presents-grid.tsx` — grid layout for presents |
| Create | `app/s/[shortId]/components/scheme-config.ts` — per-scheme visual character config |
| Modify | `app/s/[shortId]/page.tsx` — render `<WishlistLanding />` |
| Modify | `app/wishlist/components/create-form.tsx` — add `presentsLayout` field |
| Modify | `app/wishlist/components/constructor/constructor-header.tsx` — add `presentsLayout` selector |
| Modify | `api/wishlist/index.ts` — pass `presentsLayout` in create/edit mutations |

---

## Chunk 1: Short Links Migration

### Task 1.1: Move shared components to `app/s/[shortId]/components/`

**Files:**
- Move: `app/[userId]/[wishlistId]/components/` → `app/s/[shortId]/components/`
- Modify: `app/s/[shortId]/page.tsx`

- [ ] **Step 1: Copy component tree**

```bash
cp -r "app/[userId]/[wishlistId]/components" "app/s/[shortId]/components"
```

- [ ] **Step 2: Update imports in `app/s/[shortId]/page.tsx`**

Note: the copied components use relative imports internally (e.g. `'./confirm-modal'`) — those are correct as-is. Only the page file needs updating.

```tsx
// Change these two lines:
import { BlockRenderer } from '@/app/s/[shortId]/components/blocks/block-renderer'
import { PresentItem } from '@/app/s/[shortId]/components/present-item'
```

- [ ] **Step 3: Fix `present-item.tsx` — add `wishlistId` prop (required for reserve mutation)**

After copying, `app/s/[shortId]/components/present-item.tsx` still uses `useParams().wishlistId` — but on the `/s/[shortId]` route there is no `wishlistId` param. Fix the component to accept `wishlistId` as an explicit prop:

```tsx
// In present-item.tsx, change Props and the hook usage:
type Props = {
  present: Present
  theme: string
  isHidden: boolean
  wishlistId: string   // NEW: passed explicitly instead of from useParams
}

export const PresentItem = ({ present, theme, isHidden, wishlistId }: Props) => {
  const { mutate, isPending } = useApiReservePresent(wishlistId)
  // ... rest unchanged
}
```

Also update the old `app/[userId]/[wishlistId]/components/present-item.tsx` the same way for consistency (it will still be used if someone lands on the legacy page before redirect).

- [ ] **Step 4: Verify dev server compiles without errors**

Run: `pnpm dev`
Open: `http://localhost:3000/s/[any-valid-shortId]`
Expected: page loads correctly

- [ ] **Step 5: Commit**

```bash
git add "app/s/[shortId]/components/" "app/[userId]/[wishlistId]/components/present-item.tsx"
git commit -m "refactor: move public wishlist components to s/[shortId]/components, fix PresentItem wishlistId prop"
```

---

### Task 1.2: Fix share buttons to use shortId

**Files:**
- Modify: `app/wishlist/[id]/components/share-buttons.tsx`

Current code generates URLs using `data?.user?.id` + `wishlist.id`. `shortId` is already on the `Wishlist` type — use it directly.

- [ ] **Step 1: Read the current file**

Read `app/wishlist/[id]/components/share-buttons.tsx` (already read — see above).

- [ ] **Step 2: Replace implementation**

Remove `useApiGetMe` import and usage. Build URL from `wishlist.shortId`:

```tsx
'use client'

import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Wishlist } from '@/shared/types'
import { Copy, Share2 } from 'lucide-react'
import * as React from 'react'

type Props = {
  wishlist: Wishlist
}

const getShareUrl = (wishlist: Wishlist) =>
  `https://get-my-wishlist.ru/s/${wishlist.shortId}`

export const ShareButtons = ({ wishlist }: Props) => {
  const handleShare = async () => {
    if (!navigator.share) return
    try {
      await navigator.share({ title: wishlist.title, url: getShareUrl(wishlist) })
    } catch (error) {
      console.error('Share error:', error)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl(wishlist))
      toast({ title: 'Ссылка на вишлист скопирована' })
    } catch {
      toast({ variant: 'destructive', title: 'Не удалось скопировать ссылку. Попробуйте еще раз.' })
    }
  }

  return (
    <div className="flex flex-col gap-5 md:flex-row mb-2">
      <Button size="lg" onClick={handleShare}>Поделиться <Share2 /></Button>
      <Button size="lg" variant="outline" onClick={handleCopy}>Скопировать ссылку <Copy /></Button>
    </div>
  )
}
```

- [ ] **Step 3: Verify**

Open any wishlist at `/wishlist/{id}`. Click "Скопировать ссылку". Paste — should be `https://get-my-wishlist.ru/s/abc-def-ghi`.

- [ ] **Step 4: Commit**

```bash
git add app/wishlist/[id]/components/share-buttons.tsx
git commit -m "fix: use shortId for share URLs instead of userId/wishlistId"
```

---

### Task 1.3: Redirect old `[userId]/[wishlistId]` page to short URL

**Files:**
- Modify: `app/[userId]/[wishlistId]/page.tsx`

Replace the entire page content with a redirect. If `shortId` is present → redirect to `/s/{shortId}`. If not (old wishlist without shortId) → keep rendering legacy page.

- [ ] **Step 1: Replace page.tsx**

Redirect to `/s/{shortId}` when available. If the wishlist has no shortId (legacy data), render `null` — these are edge cases for old wishlists that predate short-ID generation and can be handled later.

```tsx
'use client'

import { useApiGetWishlistById } from '@/api/wishlist'
import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import * as React from 'react'

export default function Page() {
  const { wishlistId } = useParams()
  const router = useRouter()
  const { data, isLoading } = useApiGetWishlistById(wishlistId as string)
  const wishlist = data?.data

  useEffect(() => {
    if (wishlist?.shortId) {
      router.replace(`/s/${wishlist.shortId}`)
    }
  }, [wishlist, router])

  // While loading or redirecting, show nothing (brief flash is acceptable)
  // If wishlist has no shortId (very old data), user sees blank — acceptable edge case
  if (isLoading || wishlist?.shortId) return null

  // Wishlist loaded but has no shortId — shouldn't happen for new data
  return (
    <div className="p-8 text-center text-muted-foreground">
      Ссылка устарела. Найдите вишлист через профиль автора.
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Navigate to any old-style URL `/someUserId/someWishlistId`. Should redirect to `/s/{shortId}`.

- [ ] **Step 3: Commit**

```bash
git add "app/[userId]/[wishlistId]/page.tsx"
git commit -m "feat: redirect legacy userId/wishlistId URLs to /s/shortId"
```

---

## Chunk 2: Backend — Add `presentsLayout` to Settings

> All backend files are in `C:\Users\nvsma\OneDrive\Документы\projects\wish-list-2-back`

### Task 2.1: Add `PresentsLayout` to backend entity and usecase

**Files:**
- Modify: `internal/entity/wishlist.go`
- Modify: `internal/repo/persistent/models.go`
- Modify: `internal/repo/persistent/converters.go`
- Modify: `internal/usecase/contracts.go`
- Modify: `internal/usecase/wishlist/wishlist.go`
- Modify: `internal/controller/restapi/v1/wishlist.go`

- [ ] **Step 1: Add field to `Settings` entity**

In `internal/entity/wishlist.go`, update `Settings`:

```go
type Settings struct {
	ColorScheme          string `json:"colorScheme"`
	ShowGiftAvailability bool   `json:"showGiftAvailability"`
	PresentsLayout       string `json:"presentsLayout"` // "list" | "grid3" | "grid2", default "list"
}
```

- [ ] **Step 2: Add `PresentsLayout` to `SettingsJSON` in `models.go`**

In `internal/repo/persistent/models.go`, update `SettingsJSON`:

```go
type SettingsJSON struct {
    ColorScheme          string `json:"colorScheme"`
    ShowGiftAvailability bool   `json:"showGiftAvailability"`
    PresentsLayout       string `json:"presentsLayout"` // NEW
}
```

- [ ] **Step 3: Update converters to map `PresentsLayout`**

In `internal/repo/persistent/converters.go`, find both places where `entity.Settings` is built from `SettingsJSON` and vice versa, and add the field:

```go
// model → entity (reading from DB):
Settings: entity.Settings{
    ColorScheme:          m.Settings.ColorScheme,
    ShowGiftAvailability: m.Settings.ShowGiftAvailability,
    PresentsLayout:       m.Settings.PresentsLayout,  // NEW
},

// entity → model (writing to DB):
Settings: SettingsJSON{
    ColorScheme:          w.Settings.ColorScheme,
    ShowGiftAvailability: w.Settings.ShowGiftAvailability,
    PresentsLayout:       w.Settings.PresentsLayout,  // NEW
},
```

- [ ] **Step 5: Add field to both input structs in `contracts.go`**

```go
type CreateWishlistInput struct {
	Title                string
	Description          string
	CoverData            []byte
	CoverName            string
	CoverURL             string
	ColorScheme          string
	ShowGiftAvailability bool
	PresentsLayout       string  // NEW
	LocationName         string
	LocationLink         string
	LocationTime         time.Time
}

type CreateConstructorInput struct {
	// ... existing fields ...
	PresentsLayout string  // NEW
}
```

- [ ] **Step 6: Pass `PresentsLayout` in usecase `Create` and `Update`**

In `internal/usecase/wishlist/wishlist.go`, update both the `Create` and `Update` methods where `Settings` is assigned:

```go
w.Settings = entity.Settings{
    ColorScheme:          input.ColorScheme,
    ShowGiftAvailability: input.ShowGiftAvailability,
    PresentsLayout:       input.PresentsLayout,
}
```

Find all 3 occurrences (Create, Update, constructor create) and add the field.

- [ ] **Step 7: Parse `settings[presentsLayout]` in controller**

In `internal/controller/restapi/v1/wishlist.go`, in `parseWishlistInput`:

```go
input := usecase.CreateWishlistInput{
    // ... existing fields ...
    ColorScheme:          c.FormValue("settings[colorScheme]"),
    ShowGiftAvailability: stringToBool(c.FormValue("settings[showGiftAvailability]")),
    PresentsLayout:       c.FormValue("settings[presentsLayout]"),
    // ...
}
```

For the constructor JSON body parsing (`parseConstructorInput`), add:
```go
PresentsLayout        string `json:"presents_layout"`
```
to the anonymous body struct, and pass it to the input.

- [ ] **Step 8: Build and verify backend compiles**

```bash
cd C:/Users/nvsma/OneDrive/Документы/projects/wish-list-2-back
go build ./...
```
Expected: no errors

- [ ] **Step 9: Commit backend**

```bash
git add internal/
git commit -m "feat: add presentsLayout to wishlist settings"
```

---

### Task 2.2: Add `presentsLayout` to frontend types

**Files:**
- Modify: `shared/types.ts` (frontend repo)

- [ ] **Step 1: Update `Wishlist` settings type**

```ts
export type Wishlist = {
  // ...
  settings: {
    colorScheme: string
    showGiftAvailability: boolean
    presentsLayout?: 'list' | 'grid3' | 'grid2'  // NEW, optional for backwards compat
  }
  // ...
}
```

- [ ] **Step 2: Commit**

```bash
git add shared/types.ts
git commit -m "feat: add presentsLayout to Wishlist settings type"
```

---

## Chunk 3: Landing Page Redesign

### Task 3.1: Scheme config — per-scheme visual character

**Files:**
- Create: `app/s/[shortId]/components/scheme-config.ts`

This maps each color scheme name to a set of visual modifiers. The defaults are safe fallbacks.

- [ ] **Step 1: Create scheme-config.ts**

```ts
// app/s/[shortId]/components/scheme-config.ts

export type SchemeConfig = {
  /** Tailwind gradient classes for hero overlay (bottom-to-top) */
  heroOverlay: string
  /** Whether to use bold/heavy title weight */
  titleBold: boolean
  /** Card border radius modifier */
  cardRounded: string
  /** Decorative emoji or symbol shown in hero */
  decorativeEmoji: string
}

const defaultConfig: SchemeConfig = {
  heroOverlay: 'from-background via-background/60 to-transparent',
  titleBold: true,
  cardRounded: 'rounded-2xl',
  decorativeEmoji: '🎁',
}

const schemeConfigs: Record<string, SchemeConfig> = {
  main:         { ...defaultConfig, decorativeEmoji: '🎉' },
  dark:         { ...defaultConfig, heroOverlay: 'from-background via-background/70 to-transparent', decorativeEmoji: '✨' },
  pink:         { ...defaultConfig, decorativeEmoji: '🌸', cardRounded: 'rounded-3xl' },
  green:        { ...defaultConfig, decorativeEmoji: '🌿' },
  blue:         { ...defaultConfig, decorativeEmoji: '💙' },
  'dark-blue':  { ...defaultConfig, heroOverlay: 'from-background via-background/70 to-transparent', decorativeEmoji: '🌊' },
  monochrome:   { ...defaultConfig, cardRounded: 'rounded-none', decorativeEmoji: '◼' },
  'dark-brown': { ...defaultConfig, heroOverlay: 'from-background via-background/75 to-transparent', decorativeEmoji: '☕' },
  rainbow:      { ...defaultConfig, decorativeEmoji: '🌈', cardRounded: 'rounded-3xl' },
  'dark-rainbow': { ...defaultConfig, heroOverlay: 'from-background via-background/70 to-transparent', decorativeEmoji: '🌈' },
}

export const getSchemeConfig = (scheme: string): SchemeConfig =>
  schemeConfigs[scheme] ?? defaultConfig
```

- [ ] **Step 2: Commit**

```bash
git add app/s/
git commit -m "feat: add per-scheme visual config for landing page"
```

---

### Task 3.2: HeroHeader component

**Files:**
- Create: `app/s/[shortId]/components/hero-header.tsx`

Full-screen cover image with gradient overlay, title/subtitle/meta pinned bottom-left, scroll indicator.

- [ ] **Step 1: Create hero-header.tsx**

```tsx
// app/s/[shortId]/components/hero-header.tsx
import { Wishlist } from '@/shared/types'
import { SchemeConfig } from './scheme-config'
import { CalendarIcon, MapPinIcon, ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import * as React from 'react'

type Props = {
  wishlist: Wishlist
  config: SchemeConfig
}

export function HeroHeader({ wishlist, config }: Props) {
  const hasLocation = wishlist.location.name || wishlist.location.time

  return (
    <div className="relative w-full min-h-screen flex flex-col">
      {/* Cover image or gradient fallback */}
      {wishlist.cover ? (
        <Image
          src={wishlist.cover}
          alt={wishlist.title}
          fill
          priority
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-accent/20" />
      )}

      {/* Gradient overlay — fades cover into background color */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-t',
        config.heroOverlay,
      )} />

      {/* Content pinned to bottom */}
      <div className="relative mt-auto px-6 md:px-12 pb-16 pt-32 space-y-4 max-w-4xl">
        {/* Title */}
        <h1 className={cn(
          'text-5xl md:text-7xl leading-[0.95] text-foreground',
          config.titleBold ? 'font-black' : 'font-bold',
        )}>
          {wishlist.title}
        </h1>

        {/* Description */}
        {wishlist.description && (
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl line-clamp-3">
            {wishlist.description}
          </p>
        )}

        {/* Location + date chips */}
        {hasLocation && (
          <div className="flex flex-wrap gap-3 pt-2">
            {wishlist.location.time && (
              <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                <CalendarIcon className="w-4 h-4 text-primary" />
                {new Date(wishlist.location.time).toLocaleDateString('ru-RU', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </div>
            )}
            {wishlist.location.name && (
              <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                <MapPinIcon className="w-4 h-4 text-primary" />
                {wishlist.location.link ? (
                  <a href={wishlist.location.link} target="_blank" rel="noopener noreferrer"
                     className="text-primary underline underline-offset-2">
                    {wishlist.location.name}
                  </a>
                ) : (
                  <span>{wishlist.location.name}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDownIcon className="w-6 h-6 text-muted-foreground" />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify in dev server**

Run: `pnpm dev`, open a wishlist with a cover — hero should fill the viewport with gradient overlay and title at bottom.

- [ ] **Step 3: Commit**

```bash
git add app/s/[shortId]/components/hero-header.tsx
git commit -m "feat: add HeroHeader full-screen component for wishlist landing"
```

---

### Task 3.3: Presents layouts

**Files:**
- Create: `app/s/[shortId]/components/presents-list.tsx`
- Create: `app/s/[shortId]/components/presents-grid.tsx`

The existing `present-item.tsx` is a card-style component. We'll use it for grid layouts and create a new list row for the list layout.

- [ ] **Step 1: Create presents-list.tsx** (list layout — horizontal rows)

Note: `ConfirmReserveModal` signature is `{ theme, disabled, onClick, children }` — it does NOT accept `presentId`. Reserve mutation must be called per-row using `useApiReservePresent(wishlistId)`. The component receives `wishlistId` and `theme` as props.

```tsx
// app/s/[shortId]/components/presents-list.tsx
'use client'

import { useApiReservePresent } from '@/api/present'
import { Present } from '@/shared/types'
import { SchemeConfig } from './scheme-config'
import { ConfirmReserveModal } from './confirm-modal'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { ExternalLinkIcon } from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'

type Props = {
  presents: Present[]
  wishlistId: string
  theme: string
  config: SchemeConfig
  isHidden: boolean
}

export function PresentsList({ presents, wishlistId, theme, config, isHidden }: Props) {
  if (!presents.length) return null

  return (
    <div className="space-y-3">
      {presents.map(present => (
        <PresentRow
          key={present.id}
          present={present}
          wishlistId={wishlistId}
          theme={theme}
          config={config}
          isHidden={isHidden}
        />
      ))}
    </div>
  )
}

function PresentRow({
  present, wishlistId, theme, config, isHidden,
}: {
  present: Present
  wishlistId: string
  theme: string
  config: SchemeConfig
  isHidden: boolean
}) {
  const { mutate, isPending } = useApiReservePresent(wishlistId)

  const handleReserve = () => {
    mutate({ presentId: present.id }, {
      onSuccess: () => toast({ title: 'Подарок забронирован!', variant: 'success' }),
    })
  }

  return (
    <div className={cn(
      'flex items-center gap-4 bg-card p-4 border border-border/40',
      present.reserved && 'opacity-60',
      config.cardRounded,
    )}>
      {/* Thumbnail */}
      <div className={cn('w-16 h-16 flex-shrink-0 overflow-hidden bg-muted', config.cardRounded)}>
        {present.cover ? (
          <Image src={present.cover} alt={present.title} width={64} height={64} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🎁</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-foreground truncate">{present.title}</div>
        {present.description && (
          <div className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{present.description}</div>
        )}
        {present.link && (
          <a href={present.link} target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
            <ExternalLinkIcon className="w-3 h-3" /> Ссылка
          </a>
        )}
      </div>

      {/* Price + action */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        {present.price && (
          <span className="text-sm font-bold text-primary whitespace-nowrap">
            {present.price.toLocaleString('ru-RU')} ₽
          </span>
        )}
        {!isHidden && (
          <ConfirmReserveModal theme={theme} disabled={present.reserved} onClick={handleReserve}>
            <Button
              size="sm"
              loading={isPending}
              variant={present.reserved ? 'destructive' : 'default'}
              disabled={present.reserved}
            >
              {present.reserved ? 'Забронирован' : 'Забронировать'}
            </Button>
          </ConfirmReserveModal>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create presents-grid.tsx** (grid layout — reuses existing PresentItem)

`PresentItem` now requires `wishlistId` as an explicit prop (fixed in Task 1.1). Pass it here.

```tsx
// app/s/[shortId]/components/presents-grid.tsx
import { Present } from '@/shared/types'
import { PresentItem } from './present-item'
import * as React from 'react'

type Props = {
  presents: Present[]
  wishlistId: string
  theme: string
  isHidden: boolean
  columns: 2 | 3
}

export function PresentsGrid({ presents, wishlistId, theme, isHidden, columns }: Props) {
  if (!presents.length) return null

  return (
    <div className={
      columns === 3
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        : 'grid grid-cols-1 md:grid-cols-2 gap-6'
    }>
      {presents.map(present => (
        <PresentItem key={present.id} present={present} wishlistId={wishlistId} theme={theme} isHidden={isHidden} />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Verify components render**

Check dev server, no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add app/s/[shortId]/components/presents-list.tsx app/s/[shortId]/components/presents-grid.tsx
git commit -m "feat: add PresentsList and PresentsGrid components for landing page"
```

---

### Task 3.4: WishlistLanding main component

**Files:**
- Create: `app/s/[shortId]/components/wishlist-landing.tsx`

Orchestrates hero + blocks + presents section.

- [ ] **Step 1: Create wishlist-landing.tsx**

```tsx
// app/s/[shortId]/components/wishlist-landing.tsx
'use client'

import { Present, Wishlist } from '@/shared/types'
import { BlockRenderer } from './blocks/block-renderer'
import { HeroHeader } from './hero-header'
import { PresentsList } from './presents-list'
import { PresentsGrid } from './presents-grid'
import { getSchemeConfig } from './scheme-config'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import * as React from 'react'
import { useEffect } from 'react'

type Props = {
  wishlist: Wishlist
  presents: Present[]
  isMyWishlist: boolean
}

export function WishlistLanding({ wishlist, presents, isMyWishlist }: Props) {
  const config = getSchemeConfig(wishlist.settings.colorScheme)
  const isPresentHidden = isMyWishlist && !wishlist.settings.showGiftAvailability
  const layout = wishlist.settings.presentsLayout ?? 'list'

  useEffect(() => {
    const scheme = wishlist.settings.colorScheme
    if (!scheme) return
    document.body.classList.add(scheme)
    return () => { document.body.classList.remove(scheme) }
  }, [wishlist.settings.colorScheme])

  return (
    <div className={cn('min-h-screen bg-background', wishlist.settings.colorScheme)}>
      {/* Hero */}
      <HeroHeader wishlist={wishlist} config={config} />

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-16 space-y-16">

        {/* Constructor blocks */}
        {wishlist.blocks && wishlist.blocks.length > 0 && (
          <BlockRenderer blocks={wishlist.blocks} />
        )}

        {/* Presents */}
        {presents.length > 0 && (
          <section className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold text-primary">Желанные подарки</h2>
              <div className="w-16 h-1.5 bg-accent rounded-full" />
            </div>

            {layout === 'list' && (
              <PresentsList
                presents={presents}
                wishlistId={wishlist.id}
                theme={wishlist.settings.colorScheme}
                config={config}
                isHidden={isPresentHidden}
              />
            )}
            {layout === 'grid3' && (
              <PresentsGrid presents={presents} wishlistId={wishlist.id} theme={wishlist.settings.colorScheme} isHidden={isPresentHidden} columns={3} />
            )}
            {layout === 'grid2' && (
              <PresentsGrid presents={presents} wishlistId={wishlist.id} theme={wishlist.settings.colorScheme} isHidden={isPresentHidden} columns={2} />
            )}
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-secondary text-secondary-foreground py-4">
        <div className="mx-auto flex items-center justify-between container px-4 gap-4">
          <p className="text-sm md:text-base">
            Создано с помощью сервиса <Link href="/" className="underline">GetWishlist</Link>
          </p>
          <Link href="/" className="bg-background text-foreground px-4 py-2 md:px-8 md:py-3 rounded-xl font-bold text-sm md:text-base hover:bg-background/90 transition-colors shadow-lg">
            Хочу такой же!
          </Link>
        </div>
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/s/[shortId]/components/wishlist-landing.tsx
git commit -m "feat: add WishlistLanding component orchestrating hero + blocks + presents"
```

---

### Task 3.5: Refactor `app/s/[shortId]/page.tsx` to use WishlistLanding

**Files:**
- Modify: `app/s/[shortId]/page.tsx`

- [ ] **Step 1: Replace page content**

```tsx
'use client'

import { useApiGetWishlistByShortId } from '@/api/wishlist'
import { useApiGetAllPresents } from '@/api/present'
import { useApiGetMe } from '@/api/user'
import { WishlistLanding } from '@/app/s/[shortId]/components/wishlist-landing'
import { useParams } from 'next/navigation'
import * as React from 'react'

export default function Page() {
  const { shortId } = useParams()
  const { data } = useApiGetWishlistByShortId(shortId as string)
  const wishlist = data?.data
  const { data: presentsData } = useApiGetAllPresents(wishlist?.id ?? '')
  const { data: userData } = useApiGetMe()

  const presents = presentsData?.data ?? []
  const isMyWishlist = userData?.user.id === wishlist?.userId

  if (!wishlist) return null

  return <WishlistLanding wishlist={wishlist} presents={presents} isMyWishlist={isMyWishlist} />
}
```

- [ ] **Step 2: Verify full page in dev server**

Open `http://localhost:3000/s/{shortId}` — should see hero fullscreen, blocks, presents list.

- [ ] **Step 3: Test with different color schemes**

Go to edit page, change color scheme → check `/s/{shortId}` reflects the scheme.

- [ ] **Step 4: Commit**

```bash
git add "app/s/[shortId]/page.tsx"
git commit -m "feat: refactor public wishlist page to use WishlistLanding"
```

---

### Task 3.6: Add presentsLayout selector to CreateForm

**Files:**
- Modify: `app/wishlist/components/create-form.tsx`
- Modify: `api/wishlist/index.ts`

- [ ] **Step 1: Check how settings are sent in api/wishlist/index.ts**

Read `api/wishlist/index.ts` — find the `useApiCreateWishlist` and `useApiEditWishlist` mutation functions. Identify where form data is appended.

- [ ] **Step 2: Add presentsLayout to the API call**

In `api/wishlist/index.ts`, wherever `settings[colorScheme]` is appended to FormData, add:

```ts
formData.append('settings[presentsLayout]', input.settings.presentsLayout ?? 'list')
```

- [ ] **Step 3: Update form schema in create-form.tsx**

Add `presentsLayout` to the settings zod schema:

```ts
settings: z.object({
  colorScheme: z.string(),
  showGiftAvailability: z.boolean(),
  presentsLayout: z.enum(['list', 'grid3', 'grid2']).default('list'),
}),
```

- [ ] **Step 4: Add RadioGroup UI for presentsLayout**

After the `ColorsSelect` field, add a layout picker using shadcn RadioGroup:

```tsx
<FormField
  control={form.control}
  name="settings.presentsLayout"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Раскладка подарков</FormLabel>
      <FormControl>
        <div className="flex gap-3">
          {[
            { value: 'list', label: '☰ Список' },
            { value: 'grid3', label: '⊞ Сетка 3' },
            { value: 'grid2', label: '▦ Сетка 2' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => field.onChange(opt.value)}
              className={cn(
                'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                field.value === opt.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-muted',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FormControl>
    </FormItem>
  )}
/>
```

- [ ] **Step 5: Set default value in form**

In `useForm` defaultValues, add:
```ts
settings: {
  colorScheme: wishlist?.settings?.colorScheme ?? 'main',
  showGiftAvailability: wishlist?.settings?.showGiftAvailability ?? false,
  presentsLayout: wishlist?.settings?.presentsLayout ?? 'list',
},
```

- [ ] **Step 6: Verify**

Open `/wishlist/create` — layout picker should appear. Create a wishlist with "Сетка 3" → open `/s/{shortId}` — presents should render in 3-column grid.

- [ ] **Step 7: Commit**

```bash
git add app/wishlist/components/create-form.tsx api/wishlist/index.ts
git commit -m "feat: add presentsLayout selector to wishlist create/edit form"
```

---

### Task 3.7: Add presentsLayout selector to Constructor settings

**Files:**
- Modify: `app/wishlist/components/constructor/constructor-header.tsx`

Constructor wishlists use a different settings flow. The header already has settings controls (color scheme).

- [ ] **Step 1: Read constructor-header.tsx**

Read `app/wishlist/components/constructor/constructor-header.tsx` to understand current settings UI pattern.

- [ ] **Step 2: Add layout picker mirroring the create-form approach**

Add the same 3-button layout picker (list / grid3 / grid2) to the constructor header settings panel, using `useApiEditWishlist` to save on change.

- [ ] **Step 3: Verify**

Open `/wishlist/edit/{id}` for a constructor wishlist. Change layout → open `/s/{shortId}` — should reflect the change.

- [ ] **Step 4: Commit**

```bash
git add app/wishlist/components/constructor/constructor-header.tsx
git commit -m "feat: add presentsLayout selector to constructor header settings"
```

---

## Deliberately Deferred

- **`headerStyle` setting** — The spec defined `settings.headerStyle: 'hero'` as a stored field (for future extensibility). For now, hero is the only layout and is hardcoded. Adding it as a stored setting is left for a future task when a second header style is designed.

---

## Final Verification

- [ ] Open a wishlist via old URL `/{userId}/{wishlistId}` → should redirect to `/s/{shortId}`
- [ ] Share button copies `/s/{shortId}` URL
- [ ] Public page shows hero fullscreen with cover, gradient, title, location chips
- [ ] Scroll down reveals blocks + presents
- [ ] Switching color scheme in edit → `/s/{shortId}` reflects new scheme
- [ ] Switching presents layout → `/s/{shortId}` renders correct layout
- [ ] Run `pnpm lint` — no errors
