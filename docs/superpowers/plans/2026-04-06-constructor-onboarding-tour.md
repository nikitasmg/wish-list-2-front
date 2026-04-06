# Constructor Onboarding Tour Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a one-time guided tour (driver.js) to the wishlist constructor that walks first-time users through 4 key interactions: title, block palette, block canvas, and presents tab.

**Architecture:** A single custom hook `useConstructorTour` checks a localStorage flag on mount and, if absent, initializes a driver.js tour with 4 steps targeting `data-tour="*"` attributes. The hook is called once in `ConstructorEditor`. All four target components receive a `data-tour` attribute. Driver.js default styles are overridden in `globals.css` to match the project's design system.

**Tech Stack:** driver.js v1, React useEffect, localStorage, CSS custom properties

---

### Task 1: Install driver.js

**Files:**
- Modify: `package.json` (via pnpm)

- [ ] **Step 1: Install the package**

```bash
pnpm add driver.js
```

Expected output: `+ driver.js X.X.X` in the pnpm output, no errors.

- [ ] **Step 2: Verify the import resolves**

```bash
node -e "require('driver.js'); console.log('ok')"
```

Expected: `ok` (no module not found error)

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add driver.js for constructor onboarding tour"
```

---

### Task 2: Add `data-tour` attributes to target elements

**Files:**
- Modify: `app/wishlist/components/constructor/constructor-header.tsx:74`
- Modify: `app/wishlist/components/constructor/block-palette.tsx:177`
- Modify: `app/wishlist/components/constructor/block-canvas.tsx:158`
- Modify: `app/wishlist/components/constructor-editor.tsx:67`

- [ ] **Step 1: Add `data-tour="title"` to title input in `constructor-header.tsx`**

Find the `<input>` around line 74 and add the attribute:

```tsx
<input
  data-tour="title"
  className="w-full text-2xl font-bold bg-transparent border-0 border-b border-dashed border-border focus:border-primary focus:outline-none pb-1 transition-colors"
  value={title}
  placeholder="Новый вишлист"
  onChange={(e) => {
    setTitle(e.target.value)
    saveMeta({ title: e.target.value })
  }}
/>
```

- [ ] **Step 2: Add `data-tour="block-palette"` to palette root in `block-palette.tsx`**

Find the root `<div>` returned by `BlockPalette` (line 177) and add the attribute:

```tsx
<div
  data-tour="block-palette"
  className="w-full overflow-x-auto flex flex-row gap-2 pb-2 md:w-56 md:shrink-0 md:flex-col md:overflow-x-visible md:pb-0"
>
```

- [ ] **Step 3: Add `data-tour="block-canvas"` to grid div in `block-canvas.tsx`**

Find the grid `<div>` inside `DndContext` (line ~175) and add the attribute:

```tsx
<div
  data-tour="block-canvas"
  className="grid grid-cols-2 gap-3"
  style={{ gridAutoRows: 'minmax(80px, auto)' }}
>
```

- [ ] **Step 4: Add `data-tour="tab-presents"` to the Подарки tab button in `constructor-editor.tsx`**

Find the third tab button (mode === 'presents') around line 67 and add the attribute:

```tsx
<button
  data-tour="tab-presents"
  type="button"
  onClick={() => setMode('presents')}
  className={tabClass('presents')}
>
  <Gift size={14} /> Подарки
  {presents.length > 0 && (
    <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
      {presents.length}
    </span>
  )}
</button>
```

- [ ] **Step 5: Commit**

```bash
git add app/wishlist/components/constructor/constructor-header.tsx \
        app/wishlist/components/constructor/block-palette.tsx \
        app/wishlist/components/constructor/block-canvas.tsx \
        app/wishlist/components/constructor-editor.tsx
git commit -m "feat: add data-tour attributes to constructor elements"
```

---

### Task 3: Create `useConstructorTour` hook

**Files:**
- Create: `hooks/use-constructor-tour.ts`

- [ ] **Step 1: Create the hook file**

```typescript
// hooks/use-constructor-tour.ts
'use client'

import { useEffect } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

const TOUR_KEY = 'constructor_tour_seen'

export function useConstructorTour() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(TOUR_KEY)) return

    const markSeen = () => localStorage.setItem(TOUR_KEY, 'true')

    const driverObj = driver({
      animate: true,
      overlayOpacity: 0.6,
      smoothScroll: true,
      allowClose: true,
      showProgress: false,
      popoverClass: 'constructor-tour',
      nextBtnText: 'Далее →',
      prevBtnText: '← Назад',
      doneBtnText: 'Готово ✓',
      showButtons: ['next', 'close'],
      onDestroyed: markSeen,
      steps: [
        {
          element: '[data-tour="title"]',
          popover: {
            title: '✏️ Придумай название',
            description: 'Здесь можно назвать вишлист — «День рождения», «Свадьба», что угодно.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '[data-tour="block-palette"]',
          popover: {
            title: '🧩 Добавляй блоки',
            description: 'Нажми на любой блок — текст, фото, дата, место — и он появится в вишлисте.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '[data-tour="block-canvas"]',
          popover: {
            title: '✋ Меняй и перемещай',
            description: 'Нажми блок чтобы выделить, дважды — чтобы изменить. Зажми и перетащи в другое место.',
            side: 'left',
            align: 'start',
          },
        },
        {
          element: '[data-tour="tab-presents"]',
          popover: {
            title: '🎁 Добавляй подарки',
            description: 'Во вкладке «Подарки» добавляй то, что хочешь получить — с ссылками и ценами.',
            side: 'bottom',
            align: 'start',
          },
        },
      ],
    })

    // Delay so that all DOM elements with data-tour attributes are mounted
    const timer = setTimeout(() => driverObj.drive(), 600)
    return () => {
      clearTimeout(timer)
      driverObj.destroy()
    }
  }, [])
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/use-constructor-tour.ts
git commit -m "feat: add useConstructorTour hook with driver.js"
```

---

### Task 4: Wire hook into `ConstructorEditor`

**Files:**
- Modify: `app/wishlist/components/constructor-editor.tsx`

- [ ] **Step 1: Import and call the hook**

Add the import at the top of `constructor-editor.tsx`:

```typescript
import { useConstructorTour } from '@/hooks/use-constructor-tour'
```

Add the hook call inside `ConstructorEditor` function body, right after the existing hooks (after the `useEffect` cleanup):

```typescript
useConstructorTour()
```

The final top of `ConstructorEditor` function body should look like:

```typescript
export function ConstructorEditor({ wishlist }: Props) {
  const { mutate } = useApiUpdateWishlistBlocks(wishlist.id)
  const { toast } = useToast()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mode, setMode] = useState<Mode>('editor')
  const [presentModalOpen, setPresentModalOpen] = useState(false)

  const { data: presentsData } = useApiGetAllPresents(wishlist.id)
  const presents = presentsData?.data ?? []

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  useConstructorTour()
  // ... rest of the component
```

- [ ] **Step 2: Commit**

```bash
git add app/wishlist/components/constructor-editor.tsx
git commit -m "feat: wire useConstructorTour into ConstructorEditor"
```

---

### Task 5: Style driver.js to match design system

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add driver.js style overrides at the end of `globals.css`**

Append after all existing CSS:

```css
/* driver.js tour overrides */
.driver-popover.constructor-tour {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: calc(var(--radius) - 2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  color: hsl(var(--foreground));
  min-width: 260px;
  max-width: 320px;
  padding: 16px;
}

.driver-popover.constructor-tour .driver-popover-title {
  font-size: 14px;
  font-weight: 700;
  color: hsl(var(--foreground));
  margin-bottom: 6px;
}

.driver-popover.constructor-tour .driver-popover-description {
  font-size: 13px;
  color: hsl(var(--muted-foreground));
  line-height: 1.5;
}

.driver-popover.constructor-tour .driver-popover-footer {
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.driver-popover.constructor-tour .driver-popover-close-btn {
  background: transparent;
  border: none;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.driver-popover.constructor-tour .driver-popover-close-btn:hover {
  color: hsl(var(--foreground));
}

.driver-popover.constructor-tour .driver-popover-next-btn,
.driver-popover.constructor-tour .driver-popover-done-btn {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border: none;
  border-radius: calc(var(--radius) - 4px);
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.driver-popover.constructor-tour .driver-popover-next-btn:hover,
.driver-popover.constructor-tour .driver-popover-done-btn:hover {
  opacity: 0.85;
}

.driver-popover.constructor-tour .driver-popover-prev-btn {
  display: none;
}

.driver-popover-arrow {
  border-color: hsl(var(--card)) transparent transparent transparent;
}
```

- [ ] **Step 2: Run lint to make sure nothing broke**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: style driver.js tour popover to match design system"
```

---

### Task 6: Manual verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Clear the localStorage flag if it was set during testing**

In browser DevTools console:
```javascript
localStorage.removeItem('constructor_tour_seen')
```

- [ ] **Step 3: Navigate to the constructor**

Go to `http://localhost:3000/wishlist/create`, create an empty wishlist. The tour should start automatically after ~600ms on the `/wishlist/edit/[id]` page.

Expected:
- Step 1 spotlights the title input with tooltip "✏️ Придумай название"
- «Далее →» advances to step 2
- «Пропустить» (close button) dismisses the entire tour
- After step 4 «Готово ✓», `localStorage.getItem('constructor_tour_seen')` returns `'true'`
- Refreshing the page: tour does NOT appear again

- [ ] **Step 4: Verify tour does not appear on subsequent visits**

Reload the page without clearing localStorage. Tour must not start.
