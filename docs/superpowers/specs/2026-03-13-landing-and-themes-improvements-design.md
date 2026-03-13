# Landing Page & Theming Improvements — Design Spec

**Date:** 2026-03-13
**Branch:** feature/constructor-wishlist

---

## Overview

Five targeted improvements to the landing page and application theming system following the initial landing page redesign.

---

## 1. SplashCursor — Reduce Intensity

**Problem:** The cursor animation is too strong and obscures what the user is hovering over.

**Solution:** Pass reduced props to `SplashCursor` in `hero-section.tsx`:
- `splatRadius`: reduce from default to `~0.1–0.12`
- `SPLAT_FORCE`: reduce to lower value (read actual prop names from `splash-cursor.tsx` first)
- `DENSITY_DISSIPATION`: increase slightly so trails fade faster

**File:** `app/(landing)/components/hero-section.tsx`

---

## 2. Hero Section — Text Color Fix + Scroll Indicator

**Problem:** Some text in the hero is not visible (likely color contrast issue against dark background).

**Solution:**
1. Audit all text colors in `hero-section.tsx` — ensure subtext, badge, and secondary elements have sufficient contrast against `#000d1a` background. Fix any colors that blend in.
2. Add a scroll indicator at the bottom of the hero section (above the bottom fade):
   - Vertically centered at bottom center
   - Animated pulsing vertical line (CSS animation or Tailwind `animate-bounce`)
   - Small label "листай вниз" in muted color `#334155`
   - `pointer-events-none`, `absolute bottom-10`

**File:** `app/(landing)/components/hero-section.tsx`

---

## 3. Constructor Section — Compact Left Column

**Problem:** Block palette items on the left column are too large.

**Solution:** Reduce size of each block row in `constructor-section.tsx`:
- Padding: `px-3 py-2` (was `px-4 py-3`)
- Icon size: `text-sm` (was `text-lg`)
- Label font: `text-xs` (was `text-sm`)
- Gap between blocks: `gap-2` (was `gap-3`)

**File:** `app/(landing)/components/constructor-section.tsx`

---

## 4. MarqueeSection — Larger & More Impactful

**Problem:** Section looks too small and insignificant.

**Solution:**
- Increase section vertical padding: `py-16` (was `py-8`)
- Increase text size in `ScrollVelocity` className: `text-xl font-bold` (was `text-sm font-medium`)
- Increase velocity: `40` (was `30`)
- Add a subtle radial glow behind the marquee text: `radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.08) 0%, transparent 70%)`

**File:** `app/(landing)/components/marquee-section.tsx`

---

## 5. Theming System — Full Rework

### 5a. New Theme Definitions (`shared/constants.ts`)

Replace existing 10 color scheme entries with 5 pairs (10 total):

| Key | Display Name | Style | Background | Accent |
|-----|-------------|-------|------------|--------|
| `aurora` | Aurora | dark | `#000d1a` | `#06b6d4` |
| `cloud` | Cloud | light | `#f0f9ff` | `#0284c7` |
| `cosmic` | Cosmic | dark | `#08001a` | `#8b5cf6` |
| `lavender` | Lavender | light | `#faf5ff` | `#7c3aed` |
| `forest` | Forest | dark | `#010f06` | `#10b981` |
| `mint` | Mint | light | `#f0fdf4` | `#16a34a` |
| `ember` | Ember | dark | `#120700` | `#f97316` |
| `sand` | Sand | light | `#fffbeb` | `#d97706` |
| `crimson` | Crimson | dark | `#120008` | `#f43f5e` |
| `blush` | Blush | light | `#fff1f2` | `#e11d48` |

Each entry in `COLOR_SCHEMES` keeps the existing shape: `{ name, value, colors: [bg, accent] }`.

### 5b. CSS Variables (`app/globals.css`)

For each theme class (`.theme-aurora`, `.theme-cloud`, etc.) define CSS variables:
- `--theme-bg`: background color
- `--theme-accent`: accent color
- `--theme-accent-muted`: accent at 15% opacity (for card backgrounds)
- `--theme-accent-border`: accent at 25% opacity (for borders)
- `--theme-text-primary`: primary text color
- `--theme-text-secondary`: secondary/muted text color

Dark themes: white/light text. Light themes: dark text.

### 5c. Site-Wide Theme (next-themes)

The site's own dark/light mode maps to the Aurora/Cloud pair:
- Dark mode → Aurora palette (`#000d1a` bg, `#06b6d4` accent)
- Light mode → Cloud palette (`#f0f9ff` bg, `#0284c7` accent)

Update `app/globals.css` `:root` and `.dark` selectors to use Aurora/Cloud colors.

### 5d. Wishlist Theme Selector

The wishlist color scheme selector (in wishlist settings/edit) should show all 10 themes with their new names and preview swatches. Update display names and preview colors to match the new palette.

**Files:**
- `shared/constants.ts`
- `app/globals.css`
- Any wishlist theme picker component (identify during implementation)

---

## Implementation Order

1. SplashCursor intensity (quick, isolated)
2. Hero text colors + scroll indicator
3. Constructor compact blocks
4. MarqueeSection size increase
5. Theming rework (largest change — last)
