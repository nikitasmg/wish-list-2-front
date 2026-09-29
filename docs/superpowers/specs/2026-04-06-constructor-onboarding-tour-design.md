# Constructor Onboarding Tour — Design Spec

**Date:** 2026-04-06  
**Status:** Approved

---

## Goal

Show a one-time guided tour to users who open the wishlist constructor (`/wishlist/edit/*`) for the first time. The tour highlights the 4 key interactions so users understand how the editor works without reading any docs.

---

## Trigger Condition

- **When:** User opens any `/wishlist/edit/[id]` page
- **How often:** Once per browser (localStorage flag `constructor_tour_seen`)
- **Re-trigger:** Never automatically. User can clear localStorage manually.
- **Not triggered:** For users who already have `constructor_tour_seen = true`

---

## Library

**driver.js** — lightweight (~5 kb), framework-agnostic, handles spotlight, scroll-to-element, tooltip positioning, and mobile layout out of the box. Styled to match the project's design system.

Install: `pnpm add driver.js`

---

## Tour Steps (4 total)

### Step 1 — Wishlist Title
- **Target element:** Title `<input>` inside `ConstructorHeader`
- **Selector:** add `data-tour="title"` to the input
- **Title:** `✏️ Придумай название`
- **Description:** `Здесь можно назвать вишлист — «День рождения», «Свадьба», что угодно.`

### Step 2 — Block Palette
- **Target element:** The `BlockPalette` wrapper div
- **Selector:** add `data-tour="block-palette"` to the palette root
- **Title:** `🧩 Добавляй блоки`
- **Description:** `Нажми на любой блок — текст, фото, дата, место — и он появится в вишлисте.`

### Step 3 — Block Canvas Grid
- **Target element:** The grid `<div>` inside `BlockCanvas`
- **Selector:** add `data-tour="block-canvas"` to the grid div
- **Title:** `✋ Меняй и перемещай`
- **Description:** `Нажми блок чтобы выделить, дважды — чтобы изменить. Зажми и перетащи в другое место.`

### Step 4 — Presents Tab
- **Target element:** The «Подарки» tab button in `ConstructorEditor`
- **Selector:** add `data-tour="tab-presents"` to that button
- **Title:** `🎁 Добавляй подарки`
- **Description:** `Во вкладке «Подарки» добавляй то, что хочешь получить — с ссылками и ценами.`

---

## Navigation Controls

Each step has:
- **«Далее →»** (primary button) — advance to next step. Last step shows **«Готово ✓»** instead.
- **«Пропустить»** (small secondary text link) — dismiss the entire tour immediately and set the flag. Shown on every step including the last.

«Пропустить» and «Готово ✓» both set `localStorage.setItem('constructor_tour_seen', 'true')`.

Clicking the dark overlay also dismisses the tour and sets the flag.

---

## Implementation Architecture

### New file: `hooks/use-constructor-tour.ts`
Custom hook that:
- Checks `localStorage.getItem('constructor_tour_seen')` on mount
- Initializes and starts driver.js tour if flag is absent
- Sets the flag on any dismiss/complete/skip event

### Changes to existing files

**`app/wishlist/components/constructor-editor.tsx`**
- Import and call `useConstructorTour()`
- Add `data-tour="tab-presents"` to the «Подарки» tab button

**`app/wishlist/components/constructor/constructor-header.tsx`**
- Add `data-tour="title"` to the title `<input>`

**`app/wishlist/components/constructor/block-palette.tsx`**
- Add `data-tour="block-palette"` to the palette root div

**`app/wishlist/components/constructor/block-canvas.tsx`**
- Add `data-tour="block-canvas"` to the grid div

### driver.js configuration
- `animate: true`
- `overlayOpacity: 0.65`
- `smoothScroll: true`
- Custom `popoverClass` to override driver.js default styles with project's color palette (`--primary` → `#6366f1`)
- `allowClose: true` (clicking overlay dismisses)

---

## Out of Scope

- No backend tracking of tour completion (localStorage only)
- No "replay tour" button in the UI (user can clear localStorage)
- No mobile-specific step ordering or different steps for mobile vs desktop
- No tour on pages other than `/wishlist/edit/*`
