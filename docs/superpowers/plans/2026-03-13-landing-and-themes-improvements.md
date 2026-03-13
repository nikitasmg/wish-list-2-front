# Landing Page & Theming Improvements Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix five landing page and theming issues: reduce cursor animation intensity, fix hero text visibility and add scroll indicator, compact the constructor block palette, enlarge the marquee section, and replace all 10 color themes with 5 Aurora-Night-style dark/light pairs.

**Architecture:** All changes are isolated to existing component files and `globals.css`. No new files. The theming rework replaces CSS class definitions in-place and updates two data files (`constants.ts`, `scheme-config.ts`). No API or backend changes.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS, pnpm

---

## Chunk 1: Landing Page Tweaks

### Task 1: Reduce SplashCursor intensity

**Files:**
- Modify: `app/(landing)/components/hero-section.tsx:33`

- [ ] **Step 1.1: Read SplashCursor prop names**

Read `components/ui/splash-cursor.tsx` lines 1–35 and confirm the exact names of the intensity props. The spec expects `SPLAT_RADIUS`, `SPLAT_FORCE`, `DENSITY_DISSIPATION` — verify they match the TypeScript interface.

- [ ] **Step 1.2: Pass reduced props to SplashCursor**

In `hero-section.tsx`, replace:

```tsx
<SplashCursor />
```

with:

```tsx
<SplashCursor SPLAT_RADIUS={0.1} SPLAT_FORCE={2500} DENSITY_DISSIPATION={3.5} />
```

If the actual prop names differ from above, use the names confirmed in Step 1.1.

- [ ] **Step 1.3: TypeScript check**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 1.4: Commit**

```bash
git add "app/(landing)/components/hero-section.tsx"
git commit -m "fix: reduce SplashCursor intensity — lower radius, force and dissipation"
```

---

### Task 2: Hero — fix text color + add scroll indicator

**Files:**
- Modify: `app/(landing)/components/hero-section.tsx:70,96`

- [ ] **Step 2.1: Fix low-contrast subtext span**

In `hero-section.tsx` line 70, replace:

```tsx
<span className="text-[#64748b]">Никаких неловких разговоров о подарках.</span>
```

with:

```tsx
<span className="text-[#94a3b8]">Никаких неловких разговоров о подарках.</span>
```

- [ ] **Step 2.2: Add scroll indicator**

In `hero-section.tsx`, insert the scroll indicator after the closing `</div>` of the CTAs row (after line 96) and before the closing `</div>` of the content container:

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

- [ ] **Step 2.3: TypeScript check**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2.4: Commit**

```bash
git add "app/(landing)/components/hero-section.tsx"
git commit -m "fix: hero text contrast + add scroll indicator"
```

---

### Task 3: Constructor section — compact left column

**Files:**
- Modify: `app/(landing)/components/constructor-section.tsx:33,40–43`

- [ ] **Step 3.1: Reduce gap on block list**

In `constructor-section.tsx` line 33, replace:

```tsx
<div className="flex flex-col gap-3">
```

with:

```tsx
<div className="flex flex-col gap-2">
```

- [ ] **Step 3.2: Compact block inner padding and text sizes**

In `constructor-section.tsx` line 40–43, replace:

```tsx
<div className="flex items-center gap-3 px-4 py-3">
  <span className="text-lg">{block.icon}</span>
  <span className="text-sm font-semibold" style={{ color: block.text }}>{block.label}</span>
</div>
```

with:

```tsx
<div className="flex items-center gap-3 px-3 py-2">
  <span className="text-sm">{block.icon}</span>
  <span className="text-xs font-semibold" style={{ color: block.text }}>{block.label}</span>
</div>
```

- [ ] **Step 3.3: TypeScript check**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3.4: Commit**

```bash
git add "app/(landing)/components/constructor-section.tsx"
git commit -m "fix: compact constructor block palette — smaller padding and text"
```

---

### Task 4: MarqueeSection — larger and more impactful

**Files:**
- Modify: `app/(landing)/components/marquee-section.tsx`

- [ ] **Step 4.1: Increase section padding**

In `marquee-section.tsx` line 11, replace:

```tsx
className="relative py-8 overflow-hidden"
```

with:

```tsx
className="relative py-16 overflow-hidden"
```

- [ ] **Step 4.2: Add radial glow overlay**

Insert the glow `div` as the first child inside the `<section>`, before the top-fade `div`:

```tsx
{/* Radial glow behind marquee */}
<div
  className="absolute inset-0 z-0 pointer-events-none"
  style={{
    background: 'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.08) 0%, transparent 70%)',
  }}
/>
```

- [ ] **Step 4.3: Wrap ScrollVelocity in z-10 container and increase size/velocity**

Replace:

```tsx
<ScrollVelocity
  texts={[ROW_1, ROW_2]}
  velocity={30}
  className="text-sm font-medium text-[#8b5cf6]"
/>
```

with:

```tsx
<div className="relative z-10">
  <ScrollVelocity
    texts={[ROW_1, ROW_2]}
    velocity={40}
    className="text-xl font-bold text-[#8b5cf6]"
  />
</div>
```

- [ ] **Step 4.4: TypeScript check**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4.5: Commit**

```bash
git add "app/(landing)/components/marquee-section.tsx"
git commit -m "feat: enlarge MarqueeSection — bigger text, more padding, glow overlay"
```

---

## Chunk 2: Theming Rework

### Task 5: Update colorSchema and scheme-config

**Files:**
- Modify: `shared/constants.ts:10–61`
- Modify: `app/s/[shortId]/components/scheme-config.ts:19–30`

- [ ] **Step 5.1: Replace colorSchema entries**

In `shared/constants.ts`, replace the entire `colorSchema` array (lines 10–61) with:

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

- [ ] **Step 5.2: Replace schemeConfigs in scheme-config.ts**

In `app/s/[shortId]/components/scheme-config.ts`, replace the `schemeConfigs` record (lines 19–30) with:

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

- [ ] **Step 5.3: TypeScript check**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5.4: Commit**

```bash
git add shared/constants.ts "app/s/[shortId]/components/scheme-config.ts"
git commit -m "feat: replace colorSchema with 10 Aurora-Night themed pairs"
```

---

### Task 6: Replace CSS theme classes in globals.css

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 6.1: Replace :root block (Cloud — light)**

In `app/globals.css`, replace the entire `:root { ... }` block (lines 8–35) with:

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
```

- [ ] **Step 6.2: Replace .dark block (Aurora — dark)**

In `app/globals.css`, replace the entire `.dark { ... }` block (lines 37–62) with:

```css
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

- [ ] **Step 6.3: Remove old wishlist theme classes**

First confirm the class names exist:

```bash
grep -n "^\.pink\|^\.green\|^\.blue\|^\.dark-blue\|^\.monochrome\|^\.dark-brown\|^\.rainbow\|^\.dark-rainbow" app/globals.css
```

Then delete each entire class block (from `.classname {` through its closing `}`) from `globals.css`:
`.pink`, `.green`, `.blue`, `.dark-blue`, `.monochrome`, `.dark-brown`, `.rainbow`, `.dark-rainbow`

After removal, verify none remain:

```bash
grep -n "^\.pink\|^\.green\|^\.blue\|^\.dark-blue\|^\.monochrome\|^\.dark-brown\|^\.rainbow\|^\.dark-rainbow" app/globals.css
```

Expected: no output.

- [ ] **Step 6.4: Add 10 new wishlist theme classes**

After the `.dark` block, add all 10 new classes. Each must include `--radius: 1rem`:

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
  --radius: 1rem;
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
  --radius: 1rem;
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
  --radius: 1rem;
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
  --radius: 1rem;
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
  --radius: 1rem;
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
  --radius: 1rem;
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
  --radius: 1rem;
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
  --radius: 1rem;
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
  --radius: 1rem;
}
```

- [ ] **Step 6.5: TypeScript check**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6.6: Lint check**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 6.7: Commit**

```bash
git add app/globals.css
git commit -m "feat: replace theme classes with Aurora-Night 10-theme system"
```

---

### Task 7: Verify wishlist theme picker renders correctly

**Files:**
- Read-only audit of theme picker component

- [ ] **Step 7.1: Find the theme picker component**

```bash
grep -r "colorSchema" app/ --include="*.tsx" -l
```

Open each file found. Confirm the component maps over `colorSchema` and renders a color swatch using `colors[0]` and `colors[1]`. No code changes needed unless the component hard-codes old scheme `value` strings.

- [ ] **Step 7.2: Check for any hard-coded old scheme names**

```bash
grep -rE '"main"|"dark-blue"|"dark-brown"|"dark-rainbow"|"monochrome"|"rainbow"' app/ --include="*.tsx"
```

If any results reference old scheme names as default values or conditional logic, update them to use a new scheme name (e.g. `"aurora"` for dark defaults, `"cloud"` for light defaults).

- [ ] **Step 7.3: Run dev server and visually check** *(requires human interaction)*

```bash
pnpm dev
```

**This step requires a human to open a browser.** Open http://localhost:3000 and verify:
- Landing page: dark navy background, all text readable
- Navigate to `/wishlist` (logged in) → open a wishlist's theme selector → confirm 10 new swatches appear with correct names and colors
- Select a theme (e.g. Ember) → confirm the wishlist renders with orange accents on a dark charcoal background

- [ ] **Step 7.4: Commit if any fixes were needed in Step 7.2**

Only commit if Step 7.2 required changes. Stage only the specific files that were changed:

```bash
git add app/wishlist/<changed-file>.tsx   # use the actual filename(s) from Step 7.2
git commit -m "fix: update hardcoded scheme references to new theme keys"
```
