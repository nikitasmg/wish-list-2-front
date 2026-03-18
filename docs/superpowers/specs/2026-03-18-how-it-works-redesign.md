# How It Works — Redesign

**Date:** 2026-03-18
**Status:** Approved

## Goal

Redesign the `/how-it-works` page to reflect the current UI of the app. The steps remain the same (6 steps), but all screenshots are outdated and the layout needs to be replaced with a more engaging design.

## Current State

- Layout: alternating left/right columns (text + screenshot)
- Screenshots: stale, taken before recent UI redesign
- Step content: mostly accurate, minor wording issues (e.g. "через email или социальные сети" should reflect actual auth: username/password and Telegram)

## New Design

### Structure

1. **Hero section** — unchanged: centered title + subtitle
2. **Interactive Stepper section** — new
3. **CTA section** — unchanged

### Component Architecture

`app/how-it-works/page.tsx` remains a **server component** and retains the `metadata` export and `<JsonLd>` rendering. The interactive stepper is extracted into `app/how-it-works/stepper-section.tsx` with `'use client'` and `useState`. The page imports and renders `<StepperSection />`.

### Interactive Stepper (`StepperSection`)

**Stepper bar (top):**
- Horizontal row of 6 steps; scrollable on mobile with `overflow-x-auto`
- Each step: `<button role="tab">` with numbered circle + step name
- Active step: circle `bg-primary text-primary-foreground`, `aria-selected="true"`, `aria-current="step"`
- Past steps: `text-muted-foreground`, muted border circle, `aria-selected="false"`
- Future steps: gray border circle, `aria-selected="false"`
- Connecting line between steps: absolute-positioned horizontal `div` with `bg-border`
- Container: `role="tablist"`
- On step change: call `stepRefs[newIndex].current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })` inside a `useEffect([activeStep])` using a `useRef<(HTMLButtonElement | null)[]>([])` array
- Keyboard: `onKeyDown` on the container — `ArrowLeft` decrements active step (min 0), `ArrowRight` increments (max 5)

**Content area (below stepper):**
- `aria-live="polite"` wraps **only** the text block (number, title, description) — not the nav buttons
- Two-column layout on `md+`: text left half, screenshot right half
- Text column: step number `text-6xl font-bold text-primary/20`, title `text-3xl font-bold`, description `text-lg text-muted-foreground`
- Step 1 retains the existing CTA link to `/registration` ("Начать регистрацию →")
- Screenshot column: `relative h-[420px] rounded-xl shadow-xl overflow-hidden border`; use Next.js 13+ `<Image fill style={{ objectFit: 'contain' }} />`
- **Step transitions:** use `key={activeStep}` on the content wrapper. Register the keyframe in **both** `tailwind.config.ts` (under `theme.extend.keyframes.fadeIn` and `theme.extend.animation.fadeIn`) AND in `globals.css` as a fallback. Apply via the named class `animate-fadeIn`. Example config: `keyframes: { fadeIn: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } } }`, `animation: { fadeIn: 'fadeIn 0.3s ease' }`
- Navigation: "← Назад" / "Вперёд →" buttons below content; disabled on first/last step with `disabled:opacity-50 disabled:cursor-not-allowed`

**Light/dark screenshot switching:**
- Use the same CSS pattern as the current page: light image has `className="dark:hidden"`, dark image has `className="hidden dark:block"`
- Both `<Image>` elements rendered in the same container; CSS class hides the inactive one

**On mobile (below `md`):**
- Stepper bar scrolls horizontally
- Content stacks vertically: text on top, screenshot below (`h-[280px]`, full width)

### Steps (updated content)

| # | Title | Description |
|---|-------|-------------|
| 1 | Регистрация | Создайте аккаунт через username или Telegram |
| 2 | Создайте вишлист | Назовите ваш вишлист и придумайте описание |
| 3 | Настройте оформление | Выберите цветовую тему, дату и время праздника |
| 4 | Добавьте подарки | Загрузите фото и придумайте описание |
| 5 | Поделитесь с друзьями | Отправьте уникальную ссылку или опубликуйте в соцсетях |
| 6 | Наслаждайтесь | Получайте только нужные подарки! |

### Screenshots

New screenshots replace existing files in `public/screenshots/`. Both light and dark variants needed per step. Taken from the local dev server; committed and visually verified before shipping.

| Step | Light | Dark | What to capture |
|------|-------|------|-----------------|
| Регистрация | `login.png` | `login-dark.png` | `/registration` page |
| Создайте вишлист | `create-wishlist.png` | `create-wishlist-dark.png` | Wishlist creation form |
| Настройте оформление | `theme.png` | `theme-dark.png` | Theme/settings panel in wishlist edit |
| Добавьте подарки | `gifts.png` | `gifts-dark.png` | Present list / add present form |
| Поделитесь с друзьями | `share.png` | `share-dark.png` | Share dialog or link copy UI |
| Наслаждайтесь | `wishlist-example.png` | `wishlist-example-dark.png` | Public wishlist view (guest perspective) |

## Implementation

### Files to create
- `app/how-it-works/stepper-section.tsx` — client component

### Files to modify
- `app/how-it-works/page.tsx` — remove all step rendering logic (including the deprecated `<Image layout="fill" objectFit="contain">` usage); render `<StepperSection />`; keep `metadata`, `<JsonLd>`, Hero, CTA
- `app/globals.css` — add `@keyframes fadeIn` (backup, keyframe also registered in tailwind.config.ts)
- `tailwind.config.ts` — add `theme.extend.keyframes.fadeIn` and `theme.extend.animation.fadeIn`

### JSON-LD
- Keep existing `HowTo` schema in page.tsx
- Update step text to match table above

### Metadata
- Unchanged

## Out of Scope
- No changes to Hero or CTA sections
- No new routes or API calls
