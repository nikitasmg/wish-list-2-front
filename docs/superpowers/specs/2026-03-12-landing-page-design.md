# Landing Page Redesign — Design Spec

**Date:** 2026-03-12
**Status:** Approved by user

---

## Overview

Complete redesign of the main landing page (`app/page.tsx`) for get-my-wishlist.ru. The goal is an emotionally resonant, animated page that makes every visitor want to create a wishlist. Uses reactbits animation components (via `@react-bits` registry) throughout.

**Vibe:** Dreamcore / Magical — dark aurora night palette, floating particles, cinematic scroll reveals
**Structure:** Storytelling — problem → solution → constructor showcase → themes → features → CTA
**Tone:** Dreamy + problem-solving hybrid — "Your dreams deserve a beautiful list" + "No more awkward gift conversations"

---

## Color Palette — Aurora Night

| Role | Color | Hex |
|------|-------|-----|
| Background | Deep navy | `#000d1a` |
| Background alt | Dark indigo | `#0d0030` |
| Primary accent | Cyan | `#06b6d4` |
| Secondary accent | Violet | `#8b5cf6` |
| Tertiary accent | Emerald | `#10b981` |
| Text primary | Ice white | `#f0f9ff` |
| Text secondary | Slate | `#94a3b8` |
| Text accent | Light cyan | `#a5f3fc` |
| Text purple | Lavender | `#c4b5fd` |

Background uses radial gradients layered to simulate aurora glow:
`radial-gradient(ellipse at 20% 50%, rgba(6,182,212,0.2), transparent 50%)` +
`radial-gradient(ellipse at 80% 30%, rgba(139,92,246,0.3), transparent 50%)` +
`radial-gradient(ellipse at 50% 80%, rgba(16,185,129,0.12), transparent 40%)`

---

## Page Sections

### 1. Hero — Fullscreen

**Layout:** Centered, full-viewport-height
**Headline:** "Твои мечты заслуживают красивого списка." — gradient text (cyan → violet → emerald)
**Subtext:** "Собери всё что хочешь — и просто отправь ссылку. Никаких неловких разговоров о подарках."
**Badge:** `✦ бесплатно · красиво · навсегда` — pill with violet border
**CTAs:**
- Primary: "Создать вишлист ✦" — gradient button (cyan→violet), glow shadow
- Secondary: "Смотреть пример" — ghost button

**Reactbits animations:**
- `Particles-TS-TW` — floating star particles as background
- `SplashCursor-TS-TW` — liquid splash on cursor movement
- `BlurText-TS-TW` — headline blurs in on load

---

### 2. ScrollVelocity Marquee

**Content:** Looping stream of gift wishes: "🎁 новые кроссовки · 🎧 наушники мечты · 📚 книги на год · 🌿 путешествие · 💻 MacBook · ..."
**Purpose:** Sets the emotional mood, shows the service is for real desires
**Reactbits:** `ScrollVelocity-TS-TW` — speed and distortion scales with scroll velocity

---

### 3. Story Section — Problem → Solution

**Layout:** Vertical timeline with two entries, scroll-triggered
**Entry 1 — Problem:**
- Emoji: 😩
- Headline: "Что тебе подарить?"
- Body: "Этот вопрос каждый раз ставит в тупик. Отвечаешь 'всё нормально' — получаешь что попало."

**Connector:** Thin gradient line (violet → transparent)

**Entry 2 — Solution:**
- Emoji: ✨
- Headline: "Собери мечты — отправь ссылку"
- Body: "GetMyWishlist — это красивая страница с твоими желаниями. Друзья сами выбирают что подарить."

**Reactbits:** `ScrollReveal-TS-TW` — text reveals on scroll (unblur effect)

---

### 4. Constructor Showcase — Killer Feature

**Headline:** "Не просто список — твоя страница"
**Subline:** "Собирай из блоков всё что важно"
**Layout:** Two-column — left: block palette, right: live canvas preview

**Block palette (left column):**
- 📝 Текст
- 🖼️ Фото
- 🎬 Видео
- ⏱️ Таймер
- 📍 Место
- ✅ Чеклист
- 🖼️ Галерея

**Canvas preview (right column):** Static mockup of a built wishlist page showing:
- Title block: "День рождения Маши 🎂"
- Cover photo block
- Timer block: "До праздника: 12 дней"
- Location block: "Москва, Патриаршие пруды"
- Empty drop zone

**Reactbits animations:**
- `GlareHover-TS-TW` — glare effect on block palette items on hover
- `AnimatedContent-TS-TW` — blocks animate in on scroll
- `FadeContent-TS-TW` — canvas preview fades in

---

### 5. Theme Previews

**Headline:** "Красивые темы для любого случая"
**Layout:** Three themed wishlist preview cards, center card slightly elevated
**Themes shown:** Cosmos (🌙 dark violet), Rose (🌸 pink-purple), Aurora (🌊 cyan)

**Reactbits:** `BounceCards-TS-TW` — cards bounce in on mount

---

### 6. Features Bento Grid

**Headline:** "Всё что нужно"
**Layout:** 2×2 grid

| Feature | Icon | Description |
|---------|------|-------------|
| 10 тем оформления | 🎨 | Для каждого случая |
| Короткая ссылка | 🔗 | Один клик — и готово |
| Отметки "куплено" | ✅ | Друзья не задвоят |
| 2 минуты | ⚡ | До готового вишлиста |

**Reactbits:** `FadeContent-TS-TW` on each tile (staggered), section wrapped in `AnimatedContent-TS-TW`

---

### 7. Final CTA

**Headline:** "Готов создать свой вишлист?"
**Subtext:** "Бесплатно. Красиво. Навсегда."
**Button:** "✦ Начать бесплатно" — tri-color gradient (cyan→violet→emerald)
**Background:** Aurora radial glow centered on button

**Reactbits:**
- `StarBorder-TS-TW` — animated star border around CTA button
- `ClickSpark-TS-TW` — particle sparks on button click

---

## Reactbits Components Summary

| Component | Section | Variant |
|-----------|---------|---------|
| Particles | Hero background | `Particles-TS-TW` |
| SplashCursor | Global cursor | `SplashCursor-TS-TW` |
| BlurText | Hero headline | `BlurText-TS-TW` |
| ScrollVelocity | Marquee | `ScrollVelocity-TS-TW` |
| ScrollReveal | Story section | `ScrollReveal-TS-TW` |
| GlareHover | Constructor block palette | `GlareHover-TS-TW` |
| AnimatedContent | Constructor + Bento | `AnimatedContent-TS-TW` |
| FadeContent | Constructor canvas + Bento tiles | `FadeContent-TS-TW` |
| BounceCards | Theme previews | `BounceCards-TS-TW` |
| StarBorder | CTA button | `StarBorder-TS-TW` |
| ClickSpark | CTA button click | `ClickSpark-TS-TW` |

---

## Implementation Notes

- All reactbits components installed via `pnpm dlx shadcn@latest add @react-bits/<ComponentName-TS-TW>`
- Components are TypeScript + Tailwind variants (`-TS-TW`)
- Keep `SplashCursor` and `Particles` as `'use client'` wrappers, lazy-loaded to avoid SSR issues
- The existing `<Header />` and `<Footer />` components are reused
- `WishlistExample` component is replaced — no longer used on this page
- All section scroll animations use Intersection Observer (built into reactbits scroll components)
- Page background: fixed dark aurora gradient on `<body>` or root wrapper, not repeated per-section

---

## Files to Change

| File | Action |
|------|--------|
| `app/page.tsx` | Full rewrite |
| `components/wishlist-example.tsx` | No longer used on landing (kept for potential other use) |

## New Component Files

| File | Purpose |
|------|---------|
| `app/(landing)/components/hero-section.tsx` | Hero with Particles + BlurText |
| `app/(landing)/components/marquee-section.tsx` | ScrollVelocity marquee |
| `app/(landing)/components/story-section.tsx` | Problem/solution story |
| `app/(landing)/components/constructor-section.tsx` | Constructor showcase |
| `app/(landing)/components/themes-section.tsx` | BounceCards theme previews |
| `app/(landing)/components/features-section.tsx` | Bento features grid |
| `app/(landing)/components/cta-section.tsx` | Final CTA with StarBorder |
