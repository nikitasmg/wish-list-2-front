# Landing Page & Theming Improvements — Design Spec

**Date:** 2026-03-13
**Branch:** feature/constructor-wishlist

---

## Overview

Five targeted improvements to the landing page and application theming system.

---

## 1. SplashCursor — Reduce Intensity

**Problem:** Cursor animation obscures UI elements under the cursor.

**Solution:** Pass reduced props to `SplashCursor` in `hero-section.tsx`. The actual prop names from `components/ui/splash-cursor.tsx` are uppercase: `SPLAT_RADIUS`, `SPLAT_FORCE`, `DENSITY_DISSIPATION`. Defaults are `SPLAT_RADIUS=0.2`, `SPLAT_FORCE=6000`.

Target values:
- `SPLAT_RADIUS`: `0.1`
- `SPLAT_FORCE`: `2500`
- `DENSITY_DISSIPATION`: `3.5` (up from default `~3.0` — trails fade faster)

**File:** `app/(landing)/components/hero-section.tsx`

---

## 2. Hero Section — Text Color Audit + Scroll Indicator

### 2a. Text color audit

Check every inline text color in `hero-section.tsx` against the `#000d1a` background.
Specifically: the secondary span inside the subtext paragraph uses `color: '#64748b'` — this is borderline contrast. Raise it to `#94a3b8` (same as the primary subtext color) so it reads clearly.
All other current colors (`#f0f9ff`, `#94a3b8`, `#c4b5fd`) are sufficiently light and do not need changes.

### 2b. Scroll indicator

Add below the CTA buttons row, inside the content `div`:

```tsx
{/* Scroll indicator */}
<div className="flex flex-col items-center gap-2 mt-6 pointer-events-none select-none">
  <div
    className="w-px h-8 animate-pulse"
    style={{ background: 'linear-gradient(to bottom, rgba(6,182,212,0.6), transparent)' }}
  />
  <span className="text-[10px] tracking-widest uppercase" style={{ color: '#1e3a4a' }}>
    листай вниз
  </span>
</div>
```

**File:** `app/(landing)/components/hero-section.tsx`

---

## 3. Constructor Section — Compact Left Column

**Problem:** Block palette items are too tall/large.

**Changes in `constructor-section.tsx`:**
- Outer `flex flex-col` gap: `gap-2` (was `gap-3`)
- Each block inner `div`: `px-3 py-2` (was `px-4 py-3`)
- Icon `span`: `text-sm` (was `text-lg`)
- Label `span`: `text-xs` (was `text-sm`)

**File:** `app/(landing)/components/constructor-section.tsx`

---

## 4. MarqueeSection — Larger & More Impactful

**Changes in `marquee-section.tsx`:**
- Section `py-16` (was `py-8`)
- `ScrollVelocity` className: `text-xl font-bold` (was `text-sm font-medium`)
- `velocity`: `40` (was `30`)
- Add an absolute-positioned radial glow `div` behind the `ScrollVelocity` rows (as a child of the section, `z-0`, before the velocity component). Wrap `ScrollVelocity` in a `relative z-10` div so it renders above the glow:

```tsx
<div
  className="absolute inset-0 z-0 pointer-events-none"
  style={{
    background: 'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.08) 0%, transparent 70%)',
  }}
/>
<div className="relative z-10">
  <ScrollVelocity ... />
</div>
```

The section's existing `style={{ background: '#000d1a' }}` stays unchanged.

**File:** `app/(landing)/components/marquee-section.tsx`

---

## 5. Theming System — Full Rework

### Overview

Replace 10 existing color schemes with 5 pairs of dark/light themes for wishlists.
The site's own dark/light mode (next-themes) maps to the Aurora (dark) / Cloud (light) pair.

### 5a. `shared/constants.ts` — Replace `colorSchema`

Keep the export name `colorSchema` (do not rename — it is imported in at least 8 places).
Replace all 10 entries with:

```ts
export const colorSchema = [
  { name: "Aurora",   value: "aurora",   colors: ["#000d1a", "#06b6d4"] },
  { name: "Cloud",    value: "cloud",    colors: ["#f0f9ff", "#0284c7"] },
  { name: "Cosmic",   value: "cosmic",   colors: ["#08001a", "#8b5cf6"] },
  { name: "Lavender", value: "lavender", colors: ["#faf5ff", "#7c3aed"] },
  { name: "Forest",   value: "forest",   colors: ["#010f06", "#10b981"] },
  { name: "Mint",     value: "mint",     colors: ["#f0fdf4", "#16a34a"] },
  { name: "Ember",    value: "ember",    colors: ["#120700", "#f97316"] },
  { name: "Sand",     value: "sand",     colors: ["#fffbeb", "#d97706"] },
  { name: "Crimson",  value: "crimson",  colors: ["#120008", "#f43f5e"] },
  { name: "Blush",    value: "blush",    colors: ["#fff1f2", "#e11d48"] },
]
```

### 5b. `app/globals.css` — Site theme + 10 wishlist theme classes

#### Site-wide theme (`:root` = Cloud light, `.dark` = Aurora dark)

Replace existing `:root` and `.dark` blocks with Aurora/Cloud tokens:

```css
:root {
  /* Cloud — light */
  --background: 204 100% 97%;
  --foreground: 210 50% 15%;
  --card: 204 100% 99%;
  --card-foreground: 210 50% 15%;
  --popover: 204 100% 97%;
  --popover-foreground: 210 50% 15%;
  --primary: 201 98% 40%;
  --primary-foreground: 0 0% 100%;
  --secondary: 204 70% 90%;
  --secondary-foreground: 210 50% 20%;
  --muted: 204 70% 93%;
  --muted-foreground: 210 30% 45%;
  --accent: 204 70% 90%;
  --accent-foreground: 210 50% 20%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;
  --border: 204 40% 85%;
  --input: 204 40% 85%;
  --ring: 201 98% 40%;
  --radius: 1rem;
  --chart-1: 201 98% 40%;
  --chart-2: 191 95% 43%;
  --chart-3: 270 80% 55%;
  --chart-4: 160 84% 39%;
  --chart-5: 25 95% 53%;
}

.dark {
  /* Aurora — dark */
  --background: 210 100% 5%;
  --foreground: 210 40% 96%;
  --card: 210 80% 8%;
  --card-foreground: 210 40% 96%;
  --popover: 210 80% 8%;
  --popover-foreground: 210 40% 96%;
  --primary: 191 95% 43%;
  --primary-foreground: 210 100% 5%;
  --secondary: 210 50% 15%;
  --secondary-foreground: 210 40% 96%;
  --muted: 210 50% 15%;
  --muted-foreground: 210 20% 55%;
  --accent: 270 80% 55%;
  --accent-foreground: 210 40% 96%;
  --destructive: 0 63% 31%;
  --destructive-foreground: 210 40% 96%;
  --border: 210 50% 15%;
  --input: 210 50% 15%;
  --ring: 191 95% 43%;
  --radius: 1rem;
  --chart-1: 191 95% 43%;
  --chart-2: 270 80% 55%;
  --chart-3: 160 84% 39%;
  --chart-4: 25 95% 53%;
  --chart-5: 347 77% 60%;
}
```

#### Remove old theme classes

Remove: `.pink`, `.green`, `.blue`, `.dark-blue`, `.monochrome`, `.dark-brown`, `.rainbow`, `.dark-rainbow`

#### Add new wishlist theme classes

Each wishlist theme is applied as a CSS class on the wishlist container element, scoping all shadcn tokens to that subtree. The `aurora` and `cloud` classes mirror `:root`/`.dark` but are needed for explicit wishlist theme selection.

**`--radius` rule:** All 10 wishlist theme classes must include `--radius: 1rem` (shown in `.aurora` below — add to every class).

**`--chart-*` variables:** Intentionally omitted from all wishlist theme classes. Wishlists do not render chart components, so these inherit from `:root` harmlessly.

**Legacy scheme picker note (see 5d):** When an existing wishlist with an old scheme value (e.g. `"dark"`) loads in the edit form, the picker will find no matching entry in the updated `colorSchema` array and show no selected swatch — this is acceptable behaviour, no code fix needed.

```css
.aurora {
  --background: 210 100% 5%;
  --foreground: 210 40% 96%;
  --card: 210 80% 8%;
  --card-foreground: 210 40% 96%;
  --popover: 210 80% 8%;
  --popover-foreground: 210 40% 96%;
  --primary: 191 95% 43%;
  --primary-foreground: 210 100% 5%;
  --secondary: 210 50% 15%;
  --secondary-foreground: 210 40% 96%;
  --muted: 210 50% 15%;
  --muted-foreground: 210 20% 55%;
  --accent: 270 80% 55%;
  --accent-foreground: 210 40% 96%;
  --destructive: 0 63% 31%;
  --destructive-foreground: 210 40% 96%;
  --border: 210 50% 15%;
  --input: 210 50% 15%;
  --ring: 191 95% 43%;
  --radius: 1rem;
}

.cloud {
  --background: 204 100% 97%;
  --foreground: 210 50% 15%;
  --card: 204 100% 99%;
  --card-foreground: 210 50% 15%;
  --popover: 204 100% 97%;
  --popover-foreground: 210 50% 15%;
  --primary: 201 98% 40%;
  --primary-foreground: 0 0% 100%;
  --secondary: 204 70% 90%;
  --secondary-foreground: 210 50% 20%;
  --muted: 204 70% 93%;
  --muted-foreground: 210 30% 45%;
  --accent: 204 70% 90%;
  --accent-foreground: 210 50% 20%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;
  --border: 204 40% 85%;
  --input: 204 40% 85%;
  --ring: 201 98% 40%;
}

.cosmic {
  --background: 270 100% 5%;
  --foreground: 270 40% 95%;
  --card: 270 80% 8%;
  --card-foreground: 270 40% 95%;
  --popover: 270 80% 8%;
  --popover-foreground: 270 40% 95%;
  --primary: 262 83% 58%;
  --primary-foreground: 270 100% 5%;
  --secondary: 270 50% 15%;
  --secondary-foreground: 270 40% 95%;
  --muted: 270 50% 15%;
  --muted-foreground: 270 20% 55%;
  --accent: 262 83% 58%;
  --accent-foreground: 270 40% 95%;
  --destructive: 0 63% 31%;
  --destructive-foreground: 270 40% 95%;
  --border: 270 50% 18%;
  --input: 270 50% 18%;
  --ring: 262 83% 58%;
}

.lavender {
  --background: 270 100% 98%;
  --foreground: 270 50% 15%;
  --card: 270 100% 99%;
  --card-foreground: 270 50% 15%;
  --popover: 270 100% 98%;
  --popover-foreground: 270 50% 15%;
  --primary: 262 83% 46%;
  --primary-foreground: 0 0% 100%;
  --secondary: 270 70% 90%;
  --secondary-foreground: 270 50% 20%;
  --muted: 270 50% 93%;
  --muted-foreground: 270 25% 45%;
  --accent: 270 70% 90%;
  --accent-foreground: 270 50% 20%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;
  --border: 270 40% 88%;
  --input: 270 40% 88%;
  --ring: 262 83% 46%;
}

.forest {
  --background: 140 90% 4%;
  --foreground: 140 30% 95%;
  --card: 140 70% 7%;
  --card-foreground: 140 30% 95%;
  --popover: 140 70% 7%;
  --popover-foreground: 140 30% 95%;
  --primary: 160 84% 39%;
  --primary-foreground: 140 90% 4%;
  --secondary: 140 50% 12%;
  --secondary-foreground: 140 30% 95%;
  --muted: 140 50% 12%;
  --muted-foreground: 140 20% 55%;
  --accent: 160 84% 39%;
  --accent-foreground: 140 30% 95%;
  --destructive: 0 63% 31%;
  --destructive-foreground: 140 30% 95%;
  --border: 140 50% 16%;
  --input: 140 50% 16%;
  --ring: 160 84% 39%;
}

.mint {
  --background: 138 100% 97%;
  --foreground: 140 50% 12%;
  --card: 138 100% 99%;
  --card-foreground: 140 50% 12%;
  --popover: 138 100% 97%;
  --popover-foreground: 140 50% 12%;
  --primary: 142 76% 36%;
  --primary-foreground: 0 0% 100%;
  --secondary: 138 60% 90%;
  --secondary-foreground: 140 50% 15%;
  --muted: 138 50% 93%;
  --muted-foreground: 140 25% 42%;
  --accent: 138 60% 90%;
  --accent-foreground: 140 50% 15%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;
  --border: 138 40% 85%;
  --input: 138 40% 85%;
  --ring: 142 76% 36%;
}

.ember {
  --background: 25 100% 4%;
  --foreground: 25 40% 96%;
  --card: 25 80% 8%;
  --card-foreground: 25 40% 96%;
  --popover: 25 80% 8%;
  --popover-foreground: 25 40% 96%;
  --primary: 25 95% 53%;
  --primary-foreground: 25 100% 4%;
  --secondary: 25 60% 14%;
  --secondary-foreground: 25 40% 96%;
  --muted: 25 60% 14%;
  --muted-foreground: 25 25% 55%;
  --accent: 25 95% 53%;
  --accent-foreground: 25 40% 96%;
  --destructive: 0 63% 31%;
  --destructive-foreground: 25 40% 96%;
  --border: 25 60% 18%;
  --input: 25 60% 18%;
  --ring: 25 95% 53%;
}

.sand {
  --background: 48 100% 96%;
  --foreground: 30 50% 15%;
  --card: 48 100% 98%;
  --card-foreground: 30 50% 15%;
  --popover: 48 100% 96%;
  --popover-foreground: 30 50% 15%;
  --primary: 38 92% 50%;
  --primary-foreground: 0 0% 100%;
  --secondary: 48 70% 88%;
  --secondary-foreground: 30 50% 18%;
  --muted: 48 55% 92%;
  --muted-foreground: 30 30% 42%;
  --accent: 48 70% 88%;
  --accent-foreground: 30 50% 18%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;
  --border: 48 40% 83%;
  --input: 48 40% 83%;
  --ring: 38 92% 50%;
}

.crimson {
  --background: 310 100% 4%;
  --foreground: 350 30% 96%;
  --card: 310 80% 7%;
  --card-foreground: 350 30% 96%;
  --popover: 310 80% 7%;
  --popover-foreground: 350 30% 96%;
  --primary: 347 77% 60%;
  --primary-foreground: 310 100% 4%;
  --secondary: 310 60% 13%;
  --secondary-foreground: 350 30% 96%;
  --muted: 310 60% 13%;
  --muted-foreground: 330 20% 55%;
  --accent: 347 77% 60%;
  --accent-foreground: 350 30% 96%;
  --destructive: 0 63% 31%;
  --destructive-foreground: 350 30% 96%;
  --border: 310 50% 17%;
  --input: 310 50% 17%;
  --ring: 347 77% 60%;
}

.blush {
  --background: 356 100% 97%;
  --foreground: 350 50% 15%;
  --card: 356 100% 99%;
  --card-foreground: 350 50% 15%;
  --popover: 356 100% 97%;
  --popover-foreground: 350 50% 15%;
  --primary: 347 85% 50%;
  --primary-foreground: 0 0% 100%;
  --secondary: 356 70% 91%;
  --secondary-foreground: 350 50% 18%;
  --muted: 356 55% 94%;
  --muted-foreground: 350 25% 43%;
  --accent: 356 70% 91%;
  --accent-foreground: 350 50% 18%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;
  --border: 356 40% 87%;
  --input: 356 40% 87%;
  --ring: 347 85% 50%;
}
```

**File:** `app/globals.css`

### 5c. `app/s/[shortId]/components/scheme-config.ts`

Replace all 10 old keys with new keys. Use appropriate emoji and hero overlay per visual style:

```ts
const schemeConfigs: Record<string, SchemeConfig> = {
  aurora:   { ...defaultConfig, heroOverlay: 'from-background via-background/70 to-transparent', decorativeEmoji: '🌌' },
  cloud:    { ...defaultConfig, decorativeEmoji: '☁️' },
  cosmic:   { ...defaultConfig, heroOverlay: 'from-background via-background/70 to-transparent', decorativeEmoji: '💜' },
  lavender: { ...defaultConfig, decorativeEmoji: '🪻', cardRounded: 'rounded-3xl' },
  forest:   { ...defaultConfig, heroOverlay: 'from-background via-background/75 to-transparent', decorativeEmoji: '🌿' },
  mint:     { ...defaultConfig, decorativeEmoji: '🌱' },
  ember:    { ...defaultConfig, heroOverlay: 'from-background via-background/70 to-transparent', decorativeEmoji: '🔥' },
  sand:     { ...defaultConfig, decorativeEmoji: '🏜️' },
  crimson:  { ...defaultConfig, heroOverlay: 'from-background via-background/70 to-transparent', decorativeEmoji: '🌹' },
  blush:    { ...defaultConfig, decorativeEmoji: '🌸', cardRounded: 'rounded-3xl' },
}
```

**Note on backwards compatibility:** Existing wishlists in the database that reference old scheme values (e.g. `"dark"`, `"rainbow"`) will no longer match any CSS class. `getSchemeConfig` already has a `?? defaultConfig` fallback, so they will render with Aurora/Cloud site-level tokens. This is acceptable — no data migration needed given the small user base.

**File:** `app/s/[shortId]/components/scheme-config.ts`

### 5d. Wishlist theme picker

Find the component that renders the color scheme selector (likely in wishlist settings/edit — search for `colorSchema` imports). The `colors[0]` swatch will automatically reflect new values since the component already maps over `colorSchema`. Verify the picker still renders correctly; no logic changes needed unless it hard-codes scheme names.

---

## Implementation Order

1. SplashCursor intensity (quick)
2. Hero text color fix + scroll indicator
3. Constructor compact blocks
4. MarqueeSection size increase
5. Theming rework (largest — last)
