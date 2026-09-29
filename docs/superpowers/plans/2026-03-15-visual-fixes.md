# Visual Fixes & Mobile Adaptation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 8 UI/visual issues: enforce dark-only theme, redesign sticky header with navigation, fix mobile layouts on constructor and wishlist pages, fix text editor color, add example page header/breadcrumbs, fix spacing in constructor.

**Architecture:** Changes are isolated per file/component with no shared state between them. Implementation order matters only for items 1→2 (dark theme before header). All other tasks are independent. No new abstractions needed — all changes are in-place modifications.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v3, shadcn/ui, next-themes, @dnd-kit/core, TipTap (prose editor), lucide-react

---

## Chunk 1: Dark Theme + Header Redesign

### Task 1: Enforce Dark Theme Always

**Files:**
- Modify: `app/providers.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Update ThemeProvider to force dark**

Open `app/providers.tsx`. Replace the `ThemeProvider` props block (lines 12–18) with:

```tsx
<ThemeProvider
  attribute="class"
  forcedTheme="dark"
  disableTransitionOnChange
>
```

Remove the imports/props `defaultTheme`, `enableSystem`, `themes` entirely. Final file:

```tsx
'use client'
import { QueryClientProvider } from '@tanstack/react-query'
import { getQueryClient } from '@/app/get-query-client'
import { ThemeProvider } from 'next-themes'
import type * as React from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        forcedTheme="dark"
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}
```

- [ ] **Step 2: Remove hardcoded dark background from landing page**

Open `app/page.tsx`. Find the outer div:
```tsx
<div style={{ background: '#000d1a' }} className="min-h-screen font-manrope">
```
Remove the `style={{ background: '#000d1a' }}` attribute, leaving:
```tsx
<div className="min-h-screen font-manrope">
```

- [ ] **Step 3: Verify lint passes**

```bash
pnpm lint
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/providers.tsx app/page.tsx
git commit -m "feat: enforce dark-only theme, remove ThemeProvider options"
```

---

### Task 2: Redesign Header — Sticky, Blur on Scroll, Navigation Links

**Files:**
- Modify: `components/header.tsx`

Current header is a simple flex bar with Logo + ModeToggle + UserAvatar dropdown. Replace it with:
- Sticky positioning with scroll-triggered backdrop blur
- Direct navigation links to `/wishlist` and `/example`
- Desktop: text links; Mobile: icon-only links
- Remove ModeToggle entirely

- [ ] **Step 1: Rewrite `components/header.tsx`**

```tsx
'use client'
import { useApiGetMe } from '@/api/user'
import { Logo } from '@/components/logo'
import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { LayoutList, Sparkles } from 'lucide-react'
import * as React from 'react'

export const Header = () => {
  const { data } = useApiGetMe()
  const user = data?.user
  const navigate = useRouter()
  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 0)
    window.addEventListener('scroll', handler, { passive: true })
    handler()
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 flex justify-between py-2 items-center px-2 md:px-5 transition-all duration-200 ${
        isScrolled
          ? 'backdrop-blur-md bg-background/80 border-b border-border/50'
          : ''
      }`}
    >
      <Logo />

      {/* Navigation links */}
      <nav className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate.push('/wishlist')}
          className="gap-1.5"
        >
          <LayoutList size={16} />
          <span className="hidden md:inline">Мои вишлисты</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate.push('/example')}
          className="gap-1.5"
        >
          <Sparkles size={16} />
          <span className="hidden md:inline">Примеры</span>
        </Button>
      </nav>

      {/* Auth */}
      <div className="flex gap-2 items-center">
        {user ? (
          <UserAvatar user={user} />
        ) : (
          <div className="flex gap-2">
            <Button className="max-w-max" variant="ghost" size="sm" onClick={() => navigate.push('/login')}>
              Войти
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate.push('/registration')}>
              <span className="hidden sm:inline">Зарегистрироваться</span>
              <span className="sm:hidden">Регистрация</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Verify lint passes**

```bash
pnpm lint
```
Expected: no errors. If lint warns about unused `ModeToggle` import elsewhere — it's fine, we didn't add it here.

- [ ] **Step 3: Commit**

```bash
git add components/header.tsx
git commit -m "feat: sticky header with scroll blur and nav links"
```

---

## Chunk 2: Quick Fixes (Spacing, Example Page, Text Editor)

### Task 3: Add className Prop to Breadcrumbs + Fix Constructor Spacing

**Files:**
- Modify: `components/breadcrumbs.tsx`
- Modify: `app/wishlist/edit/[id]/page.tsx`

- [ ] **Step 1: Add `className` prop to Breadcrumbs component**

Open `components/breadcrumbs.tsx`. Update the Props type and pass `className` to the outer `<Breadcrumb>`:

```tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import * as React from 'react'

type Props = {
  page: string
  items: { name: string; url: string }[]
  className?: string
}

export const Breadcrumbs = ({ page, items, className }: Props) => {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Главная</BreadcrumbLink>
        </BreadcrumbItem>
        {items.map(({ name, url }) => (
          <React.Fragment key={name}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={url}>{name}</BreadcrumbLink>
            </BreadcrumbItem>
          </React.Fragment>
        ))}
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{page}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
```

- [ ] **Step 2: Add mb-4 to Breadcrumbs in constructor page**

Open `app/wishlist/edit/[id]/page.tsx`. Find:
```tsx
<Breadcrumbs
  items={[{ name: 'Мои вишлисты', url: '/wishlist' }]}
  page={wishlist.title}
/>
```
Add `className="mb-4"`:
```tsx
<Breadcrumbs
  className="mb-4"
  items={[{ name: 'Мои вишлисты', url: '/wishlist' }]}
  page={wishlist.title}
/>
```

- [ ] **Step 3: Verify lint**

```bash
pnpm lint
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add components/breadcrumbs.tsx app/wishlist/edit/[id]/page.tsx
git commit -m "fix: add className to Breadcrumbs, add spacing in constructor"
```

---

### Task 4: Example Page — Layout + Breadcrumbs

**Files:**
- Create: `app/example/layout.tsx`
- Modify: `app/example/page.tsx`

- [ ] **Step 1: Create example page layout**

Create `app/example/layout.tsx`:

```tsx
import { Header } from '@/components/header'
import * as React from 'react'

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <Header />
      <div className="p-5 max-w-[90rem] mx-auto">
        {children}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Add breadcrumbs to example page**

Open `app/example/page.tsx`. After the existing imports, add:
```tsx
import { Breadcrumbs } from '@/components/breadcrumbs'
```

Inside `ExamplePage`, insert `<Breadcrumbs items={[]} page="Примеры вишлистов" />` as the first child of the return div, before `<div className="space-y-2">`:

```tsx
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <Breadcrumbs items={[]} page="Примеры вишлистов" />

      <div className="space-y-2">
        {/* ... rest unchanged ... */}
```

All other JSX in the return remains exactly as-is.

- [ ] **Step 3: Verify lint**

```bash
pnpm lint
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/example/layout.tsx app/example/page.tsx
git commit -m "feat: add header and breadcrumbs to example page"
```

---

### Task 5: Fix Text Block Editor — Dark Text on Dark Background

**Files:**
- Modify: `app/wishlist/components/constructor/blocks/text-block-editor.tsx`

**Problem:** `prose prose-sm` applies `color: #111827` (light mode default) ignoring the forced dark theme. Fix: add `dark:prose-invert` which is activated by the `.dark` class on `<html>` that `forcedTheme="dark"` sets.

- [ ] **Step 1: Add dark:prose-invert to EditorContent**

Open `app/wishlist/components/constructor/blocks/text-block-editor.tsx`. Find line 102–105:
```tsx
<EditorContent
  editor={editor}
  className="min-h-[120px] border rounded-lg p-3 prose prose-sm max-w-none focus-within:outline-none focus-within:ring-1 focus-within:ring-ring"
/>
```

Change the className to include `dark:prose-invert`:
```tsx
<EditorContent
  editor={editor}
  className="min-h-[120px] border rounded-lg p-3 prose prose-sm dark:prose-invert max-w-none focus-within:outline-none focus-within:ring-1 focus-within:ring-ring"
/>
```

- [ ] **Step 2: Verify lint**

```bash
pnpm lint
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/components/constructor/blocks/text-block-editor.tsx
git commit -m "fix: add dark:prose-invert to text block editor for dark theme"
```

---

## Chunk 3: Mobile Layout Fixes (Wishlist Page + Present Cards)

### Task 6: Wishlist Page — Mobile Grid + Icon-Only Share Buttons

**Files:**
- Modify: `app/wishlist/page.tsx`
- Modify: `components/share-button.tsx`

- [ ] **Step 1: Fix wishlist grid to single column on mobile**

Open `app/wishlist/page.tsx`. Find line 60:
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
```
Change to:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
```

- [ ] **Step 2: Hide button text on mobile in ShareButtons**

Open `components/share-button.tsx`. Replace the return JSX.

Note: the original has `className="mr-1.5"` on the icons — remove it. Spacing between icon and text is now handled by `ml-1.5` on the `<span>`, which only applies when the span is visible (`sm:inline`). On mobile (icon-only) no extra margin is needed.

```tsx
  return (
    <div className={className}>
      <Button variant="outline" size="sm" onClick={handleShare}>
        <Share2 size={14} />
        <span className="hidden sm:inline ml-1.5">Поделиться</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={copyToClipboard}>
        <Copy size={14} />
        <span className="hidden sm:inline ml-1.5">Скопировать</span>
      </Button>
    </div>
  )
```

- [ ] **Step 3: Verify lint**

```bash
pnpm lint
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/wishlist/page.tsx components/share-button.tsx
git commit -m "fix: single column grid on mobile, icon-only share buttons"
```

---

### Task 7: Present Cards — Fix Mobile Button Layout

**Files:**
- Modify: `app/s/[shortId]/components/present-item.tsx`

**Problem:** The bottom action row uses `flex-row gap-6` — on narrow screens the "Забронировать" button and "В магазин" link overflow. Also `md:max-w-[350px]` on the card creates inconsistent widths in grid layouts.

- [ ] **Step 1: Fix bottom row to wrap on mobile**

Open `app/s/[shortId]/components/present-item.tsx`. Find line 27 and 45:

Line 27 — card wrapper, change from:
```tsx
<div className="w-full md:max-w-[350px] bg-card rounded-2xl flex flex-col gap-2 ">
```
To:
```tsx
<div className="w-full bg-card rounded-2xl flex flex-col gap-2">
```

Line 45 — action row, change from:
```tsx
<div className="flex items-center justify-between flex-row gap-6 mt-auto">
```
To:
```tsx
<div className="flex items-center justify-between flex-col sm:flex-row gap-3 mt-auto">
```

- [ ] **Step 2: Verify lint**

```bash
pnpm lint
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/s/[shortId]/components/present-item.tsx"
git commit -m "fix: present card mobile layout, wrap action buttons on small screens"
```

---

## Chunk 4: Constructor Mobile Adaptation

### Task 8: Constructor — Horizontal Palette + Touch Drag-and-Drop

**Files:**
- Modify: `app/wishlist/components/constructor/block-canvas.tsx`
- Modify: `app/wishlist/components/constructor/block-palette.tsx`

**Goal:** On mobile, the block palette becomes a horizontal scroll strip above the canvas. Drag-and-drop is extended with `TouchSensor` so it works on touch screens.

- [ ] **Step 1: Add TouchSensor to block-canvas.tsx**

Open `app/wishlist/components/constructor/block-canvas.tsx`.

Update the import on line 8 to include `TouchSensor`:
```tsx
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
```

Update the sensors definition (line 34):
```tsx
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
)
```

- [ ] **Step 2: Make canvas wrapper responsive**

In `block-canvas.tsx`, find line 96:
```tsx
<div className="flex gap-6 items-start">
```
Change to:
```tsx
<div className="flex flex-col gap-4 items-start md:flex-row md:gap-6">
```

- [ ] **Step 3: Rewrite BlockPalette for responsive layout**

Open `app/wishlist/components/constructor/block-palette.tsx`.

Find the outer wrapper div at line 178:
```tsx
<div className="w-56 shrink-0 space-y-2">
```
Change to:
```tsx
<div className="w-full overflow-x-auto flex flex-row gap-2 pb-2 md:w-56 md:shrink-0 md:flex-col md:overflow-x-visible md:pb-0">
```

Find the heading `<h3>` at line 179–181:
```tsx
<h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
  Блоки
</h3>
```
Hide it on mobile (it takes space in the horizontal layout):
```tsx
<h3 className="hidden md:block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
  Блоки
</h3>
```

Find each palette item button at line 183–191:
```tsx
<button
  key={item.type}
  type="button"
  onClick={() => handleAdd(item.type)}
  className="w-full text-left rounded-lg border bg-card p-3 hover:border-primary/50 hover:bg-accent/30 transition-colors space-y-1.5"
>
```
Add `shrink-0 w-28 md:w-full` to make items fixed-width cards in the horizontal scroll:
```tsx
<button
  key={item.type}
  type="button"
  onClick={() => handleAdd(item.type)}
  className="shrink-0 w-28 md:w-full text-left rounded-lg border bg-card p-3 hover:border-primary/50 hover:bg-accent/30 transition-colors space-y-1.5"
>
```

- [ ] **Step 4: Verify lint**

```bash
pnpm lint
```
Expected: no errors

- [ ] **Step 5: Verify build**

```bash
pnpm build
```
Expected: build completes without errors

- [ ] **Step 6: Commit**

```bash
git add app/wishlist/components/constructor/block-canvas.tsx app/wishlist/components/constructor/block-palette.tsx
git commit -m "feat: constructor mobile — horizontal palette, TouchSensor drag support"
```
