# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing landing page with a cinematic Aurora Night themed page featuring reactbits animations across 7 storytelling sections.

**Architecture:** Each section is an isolated `'use client'` component in `app/(landing)/components/`. The root `app/page.tsx` becomes a thin server component that composes them. Reactbits components are installed via shadcn CLI and land in `components/ui/`.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS, reactbits (`@react-bits` registry), pnpm

---

## Chunk 1: Setup + Hero Section

### Task 1: Install reactbits components

**Files:**
- Install to: `components/ui/` (shadcn default output)

- [ ] **Step 1.1: Install all 11 reactbits components**

Run each command. If the CLI prompts interactively, answer `y` to all.

```bash
pnpm dlx shadcn@latest add @react-bits/Particles-TS-TW
pnpm dlx shadcn@latest add @react-bits/SplashCursor-TS-TW
pnpm dlx shadcn@latest add @react-bits/BlurText-TS-TW
pnpm dlx shadcn@latest add @react-bits/ScrollVelocity-TS-TW
pnpm dlx shadcn@latest add @react-bits/ScrollReveal-TS-TW
pnpm dlx shadcn@latest add @react-bits/GlareHover-TS-TW
pnpm dlx shadcn@latest add @react-bits/AnimatedContent-TS-TW
pnpm dlx shadcn@latest add @react-bits/FadeContent-TS-TW
pnpm dlx shadcn@latest add @react-bits/BounceCards-TS-TW
pnpm dlx shadcn@latest add @react-bits/StarBorder-TS-TW
pnpm dlx shadcn@latest add @react-bits/ClickSpark-TS-TW
```

Expected: each command prints a confirmation line referencing the installed file.

- [ ] **Step 1.2: Verify all components installed**

Read the `components/ui/` directory listing and confirm these files exist (names may be kebab-case):
`particles.tsx`, `splash-cursor.tsx`, `blur-text.tsx`, `scroll-velocity.tsx`, `scroll-reveal.tsx`, `glare-hover.tsx`, `animated-content.tsx`, `fade-content.tsx`, `bounce-cards.tsx`, `star-border.tsx`, `click-spark.tsx`

- [ ] **Step 1.3: Create the landing components directory**

```bash
mkdir -p "app/(landing)/components"
```

Expected: directory `app/(landing)/components/` exists

- [ ] **Step 1.4: Commit installed components**

```bash
git add components/ui/
git commit -m "feat: install reactbits components for landing page redesign"
```

---

### Task 2: HeroSection component

**Files:**
- Create: `app/(landing)/components/hero-section.tsx`

**What it renders:**
- Full-viewport-height section with aurora radial gradient background
- Floating star particles (`Particles`) behind content
- Global liquid cursor effect (`SplashCursor`) — rendered once here, it's `position:fixed` globally
- Badge pill: `✦ бесплатно · красиво · навсегда`
- Headline with `BlurText`: "Твои мечты заслуживают красивого списка."
- The gradient on "красивого списка." is applied via Tailwind `bg-clip-text` on a wrapper `<span>`, not via `style` prop on BlurText (BlurText does not accept a `style` prop)
- Subtext paragraph
- Two CTA buttons: primary gradient "Создать вишлист ✦" → `/wishlist`, secondary ghost "Смотреть пример" → `/s/example`

**Props note:** `Particles` uses `particleCount` (number), `particleColors` (string[]), `particleBaseSize` (number) — NOT `quantity`/`color`/`size`.

- [ ] **Step 2.1: Check Particles exact prop names before writing**

Read `components/ui/particles.tsx` (first 60 lines) and note the actual TypeScript interface props.

- [ ] **Step 2.2: Check BlurText exact prop names**

Read `components/ui/blur-text.tsx` (first 60 lines) and note the actual TypeScript interface props.

- [ ] **Step 2.3: Create hero-section.tsx**

```tsx
'use client'

import Link from 'next/link'
import { Particles } from '@/components/ui/particles'
import { SplashCursor } from '@/components/ui/splash-cursor'
import { BlurText } from '@/components/ui/blur-text'

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4">
      {/* Aurora background */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(ellipse at 20% 50%, rgba(6,182,212,0.2) 0%, transparent 50%)',
            'radial-gradient(ellipse at 80% 30%, rgba(139,92,246,0.3) 0%, transparent 50%)',
            'radial-gradient(ellipse at 50% 80%, rgba(16,185,129,0.12) 0%, transparent 40%)',
            '#000d1a',
          ].join(', '),
        }}
      />

      {/* Particles — use actual prop names from Step 2.1 */}
      <Particles
        className="absolute inset-0 z-0"
        particleCount={80}
        particleColors={['#a5f3fc', '#c4b5fd']}
        particleBaseSize={60}
      />

      {/* Splash cursor — global fixed overlay */}
      <SplashCursor />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 text-center max-w-3xl mx-auto">
        {/* Badge */}
        <div
          className="inline-flex items-center px-4 py-1.5 rounded-full text-xs tracking-widest font-medium"
          style={{
            background: 'rgba(139,92,246,0.12)',
            border: '1px solid rgba(139,92,246,0.35)',
            color: '#c4b5fd',
          }}
        >
          ✦ бесплатно · красиво · навсегда
        </div>

        {/* Headline — BlurText does not accept style prop, gradient applied on wrapper */}
        <div className="flex flex-col items-center gap-1">
          <BlurText
            text="Твои мечты заслуживают"
            className="text-5xl md:text-6xl font-black leading-tight tracking-tight text-[#f0f9ff]"
            delay={100}
            animateBy="words"
          />
          <span className="bg-gradient-to-r from-[#06b6d4] via-[#8b5cf6] to-[#10b981] bg-clip-text text-transparent">
            <BlurText
              text="красивого списка."
              className="text-5xl md:text-6xl font-black leading-tight tracking-tight"
              delay={300}
              animateBy="words"
            />
          </span>
        </div>

        {/* Subtext */}
        <p className="text-base md:text-lg text-[#94a3b8] max-w-md leading-relaxed">
          Собери всё что хочешь — и просто отправь ссылку.{' '}
          <span className="text-[#64748b]">Никаких неловких разговоров о подарках.</span>
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link
            href="/wishlist"
            className="px-8 py-3.5 rounded-xl font-bold text-white text-base transition-transform hover:scale-[1.03]"
            style={{
              background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
              boxShadow: '0 0 24px rgba(6,182,212,0.35)',
            }}
          >
            Создать вишлист ✦
          </Link>
          <Link
            href="/s/example"
            className="px-8 py-3.5 rounded-xl font-semibold text-base transition-all hover:text-[#c4b5fd]"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#94a3b8',
            }}
          >
            Смотреть пример
          </Link>
        </div>
      </div>

      {/* Bottom fade to next section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #000d1a)' }}
      />
    </section>
  )
}
```

- [ ] **Step 2.4: If Particles/BlurText props from Steps 2.1–2.2 differ from above, fix them now**

Re-read the actual interface and update the `<Particles>` and `<BlurText>` usages to match.

- [ ] **Step 2.5: Verify no TypeScript errors** (run this after any Step 2.4 corrections)

```bash
pnpm tsc --noEmit
```

Expected: no errors

- [ ] **Step 2.6: Commit**

```bash
git add "app/(landing)/components/hero-section.tsx"
git commit -m "feat: add HeroSection with Particles, SplashCursor, BlurText"
```

---

## Chunk 2: Marquee + Story + Constructor Sections

### Task 3: MarqueeSection component

**Files:**
- Create: `app/(landing)/components/marquee-section.tsx`

**Props note:** `ScrollVelocity` accepts `texts` (string[]), `velocity` (number), `className` (string) — there is NO `textClassName` prop. Color/style for text goes in `className`.

- [ ] **Step 3.1: Check ScrollVelocity exact prop names**

Read `components/ui/scroll-velocity.tsx` (first 60 lines) and note the actual TypeScript interface.

- [ ] **Step 3.2: Create marquee-section.tsx**

```tsx
'use client'

import { ScrollVelocity } from '@/components/ui/scroll-velocity'

const ROW_1 = '🎁 новые кроссовки · 🎧 наушники мечты · 📚 книги на год · 🌿 путешествие · 💻 MacBook · 💍 украшения · 🎮 PlayStation · '
const ROW_2 = '🌸 цветы и уход · 🍾 ужин в ресторане · 🎨 курс рисования · 🏋️ абонемент · 📷 фотосессия · 🧴 skincare · 🎸 гитара · '

export function MarqueeSection() {
  return (
    <section
      className="relative py-8 overflow-hidden"
      style={{ background: '#000d1a' }}
    >
      {/* Top fade */}
      <div
        className="absolute top-0 left-0 right-0 h-8 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to bottom, #000d1a, transparent)' }}
      />

      {/* velocity={30} for visible motion — adjust if too fast/slow */}
      <ScrollVelocity
        texts={[ROW_1, ROW_2]}
        velocity={30}
        className="text-sm font-medium text-[#8b5cf6]"
      />

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to top, #000d1a, transparent)' }}
      />
    </section>
  )
}
```

- [ ] **Step 3.3: Fix props if they differ from Step 3.1 findings**

- [ ] **Step 3.4: Verify no TypeScript errors**

```bash
pnpm tsc --noEmit
```

Expected: no errors

- [ ] **Step 3.5: Commit**

```bash
git add "app/(landing)/components/marquee-section.tsx"
git commit -m "feat: add MarqueeSection with ScrollVelocity"
```

---

### Task 4: StorySection component

**Files:**
- Create: `app/(landing)/components/story-section.tsx`

**Important:** `ScrollReveal` only accepts plain `string` children — it cannot wrap JSX blocks. Use `AnimatedContent` (which is a proper generic wrapper) for the full entry divs. `ScrollReveal` is only used if you want to animate a single string of text.

**`AnimatedContent` direction values:** `"vertical"` (slide up) and `"horizontal"` (slide sideways). NOT `"up"`/`"down"`/`"left"`/`"right"`. Use `reverse={true}` to invert direction.

**`AnimatedContent` delay:** expects **seconds** (float), not milliseconds. `delay={0.2}` = 200ms.

- [ ] **Step 4.1: Check AnimatedContent exact prop names**

Read `components/ui/animated-content.tsx` (first 60 lines) and note the actual TypeScript interface.

- [ ] **Step 4.2: Create story-section.tsx**

```tsx
'use client'

import { AnimatedContent } from '@/components/ui/animated-content'

export function StorySection() {
  return (
    <section
      className="relative py-24 px-4"
      style={{
        background: 'linear-gradient(180deg, #000d1a 0%, #05111f 50%, #0a0020 100%)',
      }}
    >
      <div className="max-w-2xl mx-auto flex flex-col gap-0">

        {/* Problem entry */}
        <AnimatedContent direction="vertical" reverse={false} delay={0}>
          <div className="flex gap-5 items-start">
            <span className="text-4xl flex-shrink-0 mt-1">😩</span>
            <div>
              <h3 className="text-xl font-bold text-[#e2e8f0] mb-2">
                "Что тебе подарить?"
              </h3>
              <p className="text-[#64748b] leading-relaxed">
                Этот вопрос каждый раз ставит в тупик. Отвечаешь "всё нормально" — получаешь что попало.
              </p>
            </div>
          </div>
        </AnimatedContent>

        {/* Connector */}
        <div
          className="w-px h-16 ml-[22px] mt-2 mb-2"
          style={{
            background: 'linear-gradient(to bottom, rgba(139,92,246,0.5), transparent)',
          }}
        />

        {/* Solution entry */}
        <AnimatedContent direction="vertical" reverse={false} delay={0.15}>
          <div className="flex gap-5 items-start">
            <span className="text-4xl flex-shrink-0 mt-1">✨</span>
            <div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#a5f3fc' }}>
                Собери мечты — отправь ссылку
              </h3>
              <p className="text-[#94a3b8] leading-relaxed">
                GetMyWishlist — это красивая страница с твоими желаниями.{' '}
                Друзья сами выбирают что подарить.
              </p>
            </div>
          </div>
        </AnimatedContent>

      </div>
    </section>
  )
}
```

- [ ] **Step 4.3: Fix props if they differ from Step 4.1 findings**

- [ ] **Step 4.4: Verify no TypeScript errors**

```bash
pnpm tsc --noEmit
```

Expected: no errors

- [ ] **Step 4.5: Commit**

```bash
git add "app/(landing)/components/story-section.tsx"
git commit -m "feat: add StorySection with AnimatedContent scroll reveal"
```

---

### Task 5: ConstructorSection component

**Files:**
- Create: `app/(landing)/components/constructor-section.tsx`

**`AnimatedContent` direction:** `"vertical"` for up, `"horizontal"` for left/right. Use `reverse` to flip.
**`AnimatedContent` delay:** seconds (float). `i * 0.06` for stagger, NOT `i * 60`.
**`GlareHover` border:** Pass `borderColor` as a dedicated prop if available, or use `className` with Tailwind `border` utilities. Do not rely on a `style` prop for the border — check the actual interface.
**`FadeContent` delay:** Read the actual component to confirm whether `delay` is ms or seconds.

- [ ] **Step 5.1: Check GlareHover and FadeContent prop names**

Read `components/ui/glare-hover.tsx` (first 60 lines) — note how border is controlled.
Read `components/ui/fade-content.tsx` (first 60 lines) — note `delay` unit (ms or seconds).

- [ ] **Step 5.2: Create constructor-section.tsx**

```tsx
'use client'

import { GlareHover } from '@/components/ui/glare-hover'
import { AnimatedContent } from '@/components/ui/animated-content'
import { FadeContent } from '@/components/ui/fade-content'

const BLOCKS = [
  { icon: '📝', label: 'Текст',    bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.2)',   text: '#a5f3fc' },
  { icon: '🖼️', label: 'Фото',    bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.2)',  text: '#c4b5fd' },
  { icon: '🎬', label: 'Видео',   bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)',  text: '#6ee7b7' },
  { icon: '⏱️', label: 'Таймер',  bg: 'rgba(217,70,239,0.08)',  border: 'rgba(217,70,239,0.2)',  text: '#f5d0fe' },
  { icon: '📍', label: 'Место',   bg: 'rgba(251,146,60,0.08)',  border: 'rgba(251,146,60,0.2)',  text: '#fed7aa' },
  { icon: '✅', label: 'Чеклист', bg: 'rgba(6,182,212,0.06)',   border: 'rgba(6,182,212,0.15)',  text: '#7dd3fc' },
  { icon: '🖼️', label: 'Галерея', bg: 'rgba(139,92,246,0.05)', border: 'rgba(139,92,246,0.15)', text: '#a5b4fc' },
]

export function ConstructorSection() {
  return (
    <section
      className="relative py-24 px-4"
      style={{ background: '#040e1a' }}
    >
      <div className="max-w-5xl mx-auto">

        {/* Heading */}
        <AnimatedContent direction="vertical" reverse={false} delay={0}>
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-black tracking-tight mb-2"
              style={{ color: '#a5f3fc' }}
            >
              Не просто список — твоя страница
            </h2>
            <p className="text-[#475569] text-base">
              Собирай из блоков всё что важно
            </p>
          </div>
        </AnimatedContent>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

          {/* Left: Block palette */}
          <div className="flex flex-col gap-3">
            {BLOCKS.map((block, i) => (
              <AnimatedContent
                key={block.label}
                direction="horizontal"
                reverse={false}
                delay={i * 0.06}
              >
                {/* GlareHover: use className + inline style for border, not style prop */}
                <GlareHover
                  className="rounded-xl w-full cursor-default"
                  style={{
                    background: block.bg,
                    border: `1px solid ${block.border}`,
                  }}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="text-lg">{block.icon}</span>
                    <span className="text-sm font-semibold" style={{ color: block.text }}>
                      {block.label}
                    </span>
                  </div>
                </GlareHover>
              </AnimatedContent>
            ))}
          </div>

          {/* Right: Canvas preview — FadeContent delay in ms (1000 = 1s) */}
          <FadeContent blur duration={800} delay={200}>
            <div
              className="rounded-2xl p-5 flex flex-col gap-3"
              style={{
                background: 'linear-gradient(180deg, #0a1628, #0d0025)',
                border: '1px solid rgba(139,92,246,0.12)',
              }}
            >
              {/* Title block */}
              <div
                className="rounded-xl px-4 py-3"
                style={{
                  background: 'linear-gradient(90deg, rgba(6,182,212,0.15), rgba(139,92,246,0.1))',
                  borderLeft: '2px solid #06b6d4',
                }}
              >
                <p className="text-sm font-bold" style={{ color: '#a5f3fc' }}>
                  День рождения Маши 🎂
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                  25 января · Жду вас!
                </p>
              </div>

              {/* Photo block */}
              <div
                className="rounded-xl px-4 py-3"
                style={{ background: 'rgba(139,92,246,0.08)', borderLeft: '2px solid #8b5cf6' }}
              >
                <p className="text-xs" style={{ color: '#c4b5fd' }}>🖼️ Обложка события</p>
              </div>

              {/* Timer block */}
              <div
                className="rounded-xl px-4 py-3"
                style={{ background: 'rgba(16,185,129,0.07)', borderLeft: '2px solid #10b981' }}
              >
                <p className="text-xs" style={{ color: '#6ee7b7' }}>⏱️ До праздника: 12 дней</p>
              </div>

              {/* Location block */}
              <div
                className="rounded-xl px-4 py-3"
                style={{
                  background: 'rgba(251,146,60,0.06)',
                  borderLeft: '2px solid rgba(251,146,60,0.4)',
                }}
              >
                <p className="text-xs" style={{ color: '#fed7aa' }}>📍 Москва, Патриаршие пруды</p>
              </div>

              {/* Empty drop zone */}
              <div
                className="rounded-xl px-4 py-3 text-center"
                style={{ border: '1px dashed rgba(6,182,212,0.15)' }}
              >
                <p className="text-xs" style={{ color: '#1e3a4a' }}>+ добавь блок</p>
              </div>
            </div>
          </FadeContent>

        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5.3: Fix GlareHover and FadeContent props if they differ from Step 5.1 findings**

Pay special attention to: how GlareHover accepts `style`, and whether `FadeContent` `delay` is ms or seconds.

- [ ] **Step 5.4: Verify no TypeScript errors**

```bash
pnpm tsc --noEmit
```

Expected: no errors

- [ ] **Step 5.5: Commit**

```bash
git add "app/(landing)/components/constructor-section.tsx"
git commit -m "feat: add ConstructorSection with GlareHover, AnimatedContent, FadeContent"
```

---

## Chunk 3: Themes + Features + CTA + Page Assembly

### Task 6: ThemesSection component

**Files:**
- Create: `app/(landing)/components/themes-section.tsx`

**Important:** `BounceCards` has an unknown prop API — it may only support image URLs, not arbitrary JSX content. You MUST read the installed file before writing this component.

- [ ] **Step 6.1: Read BounceCards source to understand its API**

Read `components/ui/bounce-cards.tsx` completely and note:
- What is the required prop for card content? (`images`? `cards`? Something else?)
- Does it accept JSX children or only image URLs?
- What are all available props?

- [ ] **Step 6.2: Create themes-section.tsx based on actual BounceCards API**

If `BounceCards` only accepts image URLs — use it with placeholder gradient image URLs (e.g. from `https://placehold.co`) and overlay text absolutely positioned on top.

If `BounceCards` accepts JSX content per card — use the shape below:

```tsx
'use client'

import { BounceCards } from '@/components/ui/bounce-cards'

// Adjust this component entirely based on the actual BounceCards API found in Step 6.1.
// The pattern below is a starting point — modify to match the real interface.

const THEME_IMAGES = [
  'https://placehold.co/160x200/1a0040/c4b5fd?text=🌙+Cosmos',
  'https://placehold.co/160x200/1a0020/f5d0fe?text=🌸+Rose',
  'https://placehold.co/160x200/000d1a/a5f3fc?text=🌊+Aurora',
]

export function ThemesSection() {
  return (
    <section
      className="relative py-24 px-4"
      style={{ background: '#050b15' }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2
          className="text-3xl md:text-4xl font-black tracking-tight mb-2"
          style={{ color: '#c4b5fd' }}
        >
          Красивые темы для любого случая
        </h2>
        <p className="text-[#475569] mb-12">10 цветовых схем — найди свою</p>

        {/* Replace props below with actual API from Step 6.1 */}
        <BounceCards
          images={THEME_IMAGES}
          containerWidth={500}
          containerHeight={250}
          animationDelay={0.1}
          animationStagger={0.08}
        />
      </div>
    </section>
  )
}
```

- [ ] **Step 6.3: Verify no TypeScript errors**

```bash
pnpm tsc --noEmit
```

Expected: no errors

- [ ] **Step 6.4: Commit**

```bash
git add "app/(landing)/components/themes-section.tsx"
git commit -m "feat: add ThemesSection with BounceCards"
```

---

### Task 7: FeaturesSection component

**Files:**
- Create: `app/(landing)/components/features-section.tsx`

**`AnimatedContent` direction:** `"vertical"` (not `"up"`). Delay in seconds.
**`FadeContent` delay:** confirm unit from Task 5 Step 5.1 findings and use consistently.

- [ ] **Step 7.1: Create features-section.tsx**

```tsx
'use client'

import { FadeContent } from '@/components/ui/fade-content'
import { AnimatedContent } from '@/components/ui/animated-content'

const FEATURES = [
  {
    icon: '🎨',
    title: '10 тем оформления',
    desc: 'Для каждого случая',
    bg: 'rgba(6,182,212,0.07)',
    border: 'rgba(6,182,212,0.18)',
    text: '#a5f3fc',
  },
  {
    icon: '🔗',
    title: 'Короткая ссылка',
    desc: 'Один клик — и готово',
    bg: 'rgba(139,92,246,0.07)',
    border: 'rgba(139,92,246,0.18)',
    text: '#c4b5fd',
  },
  {
    icon: '✅',
    title: 'Отметки "куплено"',
    desc: 'Друзья не задвоят',
    bg: 'rgba(16,185,129,0.07)',
    border: 'rgba(16,185,129,0.18)',
    text: '#6ee7b7',
  },
  {
    icon: '⚡',
    title: '2 минуты',
    desc: 'До готового вишлиста',
    bg: 'rgba(217,70,239,0.07)',
    border: 'rgba(217,70,239,0.18)',
    text: '#f5d0fe',
  },
]

export function FeaturesSection() {
  return (
    <section
      className="relative py-24 px-4"
      style={{ background: '#040f0a' }}
    >
      <div className="max-w-3xl mx-auto">
        <AnimatedContent direction="vertical" reverse={false} delay={0}>
          <h2
            className="text-3xl md:text-4xl font-black tracking-tight text-center mb-12"
            style={{ color: '#6ee7b7' }}
          >
            Всё что нужно
          </h2>
        </AnimatedContent>

        <div className="grid grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            /* FadeContent delay: use ms if component expects ms, seconds if it expects seconds.
               Adjust based on findings from Task 5 Step 5.1. Here using ms (100ms stagger). */
            <FadeContent key={f.title} duration={600} delay={i * 100}>
              <div
                className="rounded-2xl p-5"
                style={{ background: f.bg, border: `1px solid ${f.border}` }}
              >
                <span className="text-2xl">{f.icon}</span>
                <p className="text-sm font-bold mt-2" style={{ color: f.text }}>
                  {f.title}
                </p>
                <p className="text-xs mt-1 text-[#334155]">{f.desc}</p>
              </div>
            </FadeContent>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 7.2: Verify no TypeScript errors**

```bash
pnpm tsc --noEmit
```

Expected: no errors

- [ ] **Step 7.3: Commit**

```bash
git add "app/(landing)/components/features-section.tsx"
git commit -m "feat: add FeaturesSection with FadeContent bento grid"
```

---

### Task 8: CtaSection component

**Files:**
- Create: `app/(landing)/components/cta-section.tsx`

**Important:** Read `StarBorder` and `ClickSpark` installed files before writing — their prop APIs are unverified.

- [ ] **Step 8.1: Read StarBorder and ClickSpark prop names**

Read `components/ui/star-border.tsx` (first 60 lines).
Read `components/ui/click-spark.tsx` (first 60 lines).
Note all available props for each.

- [ ] **Step 8.2: Create cta-section.tsx**

```tsx
'use client'

import Link from 'next/link'
import { StarBorder } from '@/components/ui/star-border'
import { ClickSpark } from '@/components/ui/click-spark'

// Adjust StarBorder and ClickSpark props based on Step 8.1 findings.
// The props below are best-guess starting points.

export function CtaSection() {
  return (
    <section
      className="relative py-32 px-4 text-center overflow-hidden"
      style={{
        background: [
          'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.18) 0%, transparent 60%)',
          'linear-gradient(135deg, #000d1a, #0d0030, #001a2e)',
        ].join(', '),
      }}
    >
      <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-4">
        <span className="text-5xl">🌟</span>

        <h2
          className="text-3xl md:text-4xl font-black tracking-tight"
          style={{ color: '#f0f9ff' }}
        >
          Готов создать свой вишлист?
        </h2>

        <p className="text-[#475569] text-base">
          Бесплатно. Красиво. Навсегда.
        </p>

        <div className="mt-4">
          <ClickSpark sparkColor="#06b6d4" sparkSize={10} sparkCount={8} duration={400}>
            <StarBorder color="#06b6d4" speed="4s" className="rounded-2xl">
              <Link
                href="/wishlist"
                className="block px-10 py-4 font-extrabold text-white text-lg rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #8b5cf6, #10b981)',
                  boxShadow: '0 0 30px rgba(6,182,212,0.3)',
                }}
              >
                ✦ Начать бесплатно
              </Link>
            </StarBorder>
          </ClickSpark>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 8.3: Fix StarBorder and ClickSpark props based on Step 8.1 findings**

- [ ] **Step 8.4: Verify no TypeScript errors**

```bash
pnpm tsc --noEmit
```

Expected: no errors

- [ ] **Step 8.5: Commit**

```bash
git add "app/(landing)/components/cta-section.tsx"
git commit -m "feat: add CtaSection with StarBorder and ClickSpark"
```

---

### Task 9: Assemble app/page.tsx

**Files:**
- Modify: `app/page.tsx` — full rewrite

**What it does:** Server component that imports all 7 section components and composes them. Adds `metadata` export so the page title is preserved (the original page had a title tag).

- [ ] **Step 9.1: Rewrite app/page.tsx**

```tsx
import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { HeroSection } from '@/app/(landing)/components/hero-section'
import { MarqueeSection } from '@/app/(landing)/components/marquee-section'
import { StorySection } from '@/app/(landing)/components/story-section'
import { ConstructorSection } from '@/app/(landing)/components/constructor-section'
import { ThemesSection } from '@/app/(landing)/components/themes-section'
import { FeaturesSection } from '@/app/(landing)/components/features-section'
import { CtaSection } from '@/app/(landing)/components/cta-section'

export const metadata: Metadata = {
  title: 'GetMyWishlist — Создавайте красивые вишлисты бесплатно',
  description: 'Собери всё что хочешь в красивый список и просто отправь ссылку. Никаких неловких разговоров о подарках.',
}

export default function Home() {
  return (
    <div style={{ background: '#000d1a' }} className="min-h-screen font-manrope">
      <Header />
      <main>
        <HeroSection />
        <MarqueeSection />
        <StorySection />
        <ConstructorSection />
        <ThemesSection />
        <FeaturesSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 9.2: Verify full TypeScript check passes**

```bash
pnpm tsc --noEmit
```

Expected: no errors

- [ ] **Step 9.3: Run lint**

```bash
pnpm lint
```

Expected: no errors

- [ ] **Step 9.4: Start dev server and visually verify**

```bash
pnpm dev
```

Open http://localhost:3000 and verify:
- Page loads with dark navy background
- Hero is full-viewport with aurora glow, particles floating, headline animates in with blur effect
- Cursor creates liquid splash effect across entire page
- Scrolling shows marquee with gift phrases, text moves faster when you scroll faster
- Story section: problem emoji + text animates in, gradient connector line, solution animates in
- Constructor section: left column block palette glares on hover, right canvas fades in
- Themes section: three cards bounce in on load
- Features section: 2×2 bento grid fades in on scroll
- CTA section: star border animates around button, sparks appear on button click

- [ ] **Step 9.5: Commit**

```bash
git add app/page.tsx
git commit -m "feat: assemble new landing page from section components"
```

---

### Task 10: Fix prop mismatches (if any)

**Context:** Steps 2.1–2.2, 3.1, 4.1, 5.1, 6.1, 8.1 asked you to verify prop names from installed files. If any adjustments were noted but not yet applied, fix them here.

- [ ] **Step 10.1: Final TypeScript check**

```bash
pnpm tsc --noEmit
```

Fix any remaining errors by reading the relevant `components/ui/<name>.tsx` file and updating the section component to pass correct props.

- [ ] **Step 10.2: Final lint**

```bash
pnpm lint
```

Expected: clean output

- [ ] **Step 10.3: Final commit (only if changes were made)**

```bash
git add "app/(landing)/components/"
git commit -m "fix: correct reactbits prop types in landing section components"
```
