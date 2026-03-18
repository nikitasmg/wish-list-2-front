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

### Interactive Stepper

**Stepper bar (top):**
- Horizontal row of 6 steps
- Each step: numbered circle + step name
- Active step: `primary` color highlight
- Past steps: muted
- Future steps: gray
- Connecting line between steps
- On mobile: horizontally scrollable

**Content area (below stepper):**
- Two-column layout: text (left) + screenshot (right)
- Text column: large step number, title, description; step 1 has a CTA button "Начать регистрацию →"
- Screenshot column: large image in rounded frame with border and shadow
- Light/dark screenshot variants via `dark:` CSS class (same as current)
- Navigation: prev/next buttons below the content area

**On mobile:**
- Stepper bar scrolls horizontally
- Content stacks vertically: text on top, screenshot below (full width)

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

New screenshots to be taken from `localhost:3000` (credentials: 123456/123456):

| Step | Light | Dark |
|------|-------|------|
| Регистрация | `/screenshots/login.png` | `/screenshots/login-dark.png` |
| Создайте вишлист | `/screenshots/create-wishlist.png` | `/screenshots/create-wishlist-dark.png` |
| Настройте оформление | `/screenshots/theme.png` | `/screenshots/theme-dark.png` |
| Добавьте подарки | `/screenshots/gifts.png` | `/screenshots/gifts-dark.png` |
| Поделитесь с друзьями | `/screenshots/share.png` | `/screenshots/share-dark.png` |
| Наслаждайтесь | `/screenshots/wishlist-example.png` | `/screenshots/wishlist-example-dark.png` |

Screenshots overwrite existing files in `public/screenshots/`.

## Implementation

### State Management
- Client component (`'use client'`)
- `useState` for active step index (0-based)

### Components
- `HowItWorks` page component (existing file, full rewrite)
- No new files needed

### JSON-LD
- Keep existing `HowTo` schema, update step text to match new descriptions

### Metadata
- Keep existing metadata (title, description, canonical, openGraph)

## Out of Scope
- No changes to Hero section content
- No changes to CTA section
- No new routes or API calls
