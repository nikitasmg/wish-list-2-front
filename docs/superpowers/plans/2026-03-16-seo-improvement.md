# SEO Improvement Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full-stack SEO for prosto-namekni.ru — fix technical issues, add structured data, create occasion landing pages, and set up a blog.

**Architecture:** Three phases in parallel: (1) fix broken metadata/lang/font in existing files, (2) create 7 static occasion landing pages under `/wishlist-for/[occasion]`, (3) set up MDX blog with 5 articles under `/blog/[slug]`. No test framework — verification is `pnpm build` + HTML inspection.

**Tech Stack:** Next.js 16 App Router, TypeScript, `next-sitemap`, `@next/mdx`, `@tailwindcss/typography` (already installed), pnpm.

**Spec:** `docs/superpowers/specs/2026-03-16-seo-improvement-design.md`

---

## File Map

### Modified
- `app/layout.tsx` — lang, Cyrillic font subset, root metadata, verification tokens
- `app/page.tsx` — expanded description, OG tags, JSON-LD
- `app/how-it-works/page.tsx` — remove `<Head>`, add `metadata` export, fix H1 + brand name, add HowTo JSON-LD
- `app/terms-of-service/page.tsx` — remove `<Head>`, add `metadata` export with noindex
- `next-sitemap.config.js` — exclude /s/*, /login, /registration; per-path priorities
- `public/robots.txt` — add Disallow rules
- `next.config.ts` — add MDX support

### Created
- `app/s/[shortId]/layout.tsx` — noindex layout, no client code touched
- `components/json-ld.tsx` — reusable `<script type="application/ld+json">` component
- `content/occasions/index.ts` — occasion data (slug, title, description, gift ideas)
- `app/wishlist-for/[occasion]/page.tsx` — static occasion landing page
- `content/blog/index.ts` — blog article manifest (slug, title, description, date)
- `lib/blog.ts` — utility to get article list and find by slug
- `app/blog/page.tsx` — blog listing page
- `app/blog/[slug]/page.tsx` — blog post page with dynamic MDX import
- `content/blog/how-to-create-wishlist.mdx`
- `content/blog/wishlist-ideas.mdx`
- `content/blog/what-is-wishlist.mdx`
- `content/blog/share-wishlist.mdx`
- `content/blog/wishlist-gifts.mdx`
- `mdx-components.tsx` — required by Next.js MDX integration

---

## Chunk 1: Technical SEO Fixes

### Task 1: Fix lang attribute and Cyrillic font subset

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update `lang` and font `subsets`**

In `app/layout.tsx`, make two changes:
1. Change `<html lang="en"` to `<html lang="ru"`
2. Change `subsets: ['latin']` to `subsets: ['latin', 'cyrillic']`

```tsx
// app/layout.tsx — change these two lines only

// Line 11-13: font definition
const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin', 'cyrillic'],  // was: ['latin']
})

// Line 26: html tag
<html lang="ru" suppressHydrationWarning>  // was: lang="en"
```

- [ ] **Step 2: Verify build passes**

```bash
pnpm build
```

Expected: build completes without errors. Check `.next/server/app/index.html` contains `lang="ru"`.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "fix: set lang=ru and add Cyrillic font subset"
```

---

### Task 2: Refactor root metadata in layout.tsx

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace root metadata export**

Replace the existing `metadata` export in `app/layout.tsx` with:

```tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://prosto-namekni.ru'),
  title: {
    default: 'Просто намекни — Создай вишлист и отправь ссылку',
    template: '%s | Просто намекни',
  },
  description: 'Создай красивый вишлист онлайн и просто отправь ссылку друзьям. Бесплатно, без скачиваний.',
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: 'https://prosto-namekni.ru',
    siteName: 'Просто намекни',
    // images: — add ONLY after public/og-image.png is created and deployed (Task 11)
  },
  twitter: {
    card: 'summary_large_image',
  },
  // Replace tokens after registering in Google Search Console and Yandex Webmaster
  verification: {
    yandex: 'REPLACE_WITH_YANDEX_TOKEN',
    google: 'REPLACE_WITH_GOOGLE_TOKEN',
  },
}
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

Expected: no errors. Check `.next/server/app/index.html` — `<title>` should contain "Просто намекни".

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: refactor root metadata for SEO"
```

---

### Task 3: Create noindex layout for /s/[shortId]

**Files:**
- Create: `app/s/[shortId]/layout.tsx`

This approach adds noindex WITHOUT touching the client component `page.tsx`.

- [ ] **Step 1: Create the layout file**

```tsx
// app/s/[shortId]/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

Expected: no errors.

- [ ] **Step 3: Verify noindex in output**

```bash
# Start dev server and check the HTML head of any /s/ page
pnpm dev &
curl -s http://localhost:3000/s/test 2>/dev/null | grep -i "noindex" || echo "noindex tag not found in initial HTML (expected for client-rendered page — verify in browser DevTools > Network > index.html response headers or page source)"
# Alternative: open http://localhost:3000/s/any-slug in browser, View Source, search for "noindex"
```

- [ ] **Step 4: Commit**

```bash
git add app/s/[shortId]/layout.tsx
git commit -m "feat: add noindex to public wishlist pages"
```

---

### Task 4: Fix how-it-works page metadata and content

**Files:**
- Modify: `app/how-it-works/page.tsx`

- [ ] **Step 1: Remove `Head` import and add `metadata` export**

At the top of `app/how-it-works/page.tsx`:
1. Remove: `import Head from 'next/head'`
2. Add: `import type { Metadata } from 'next'`

Add this export before the component function:

```tsx
export const metadata: Metadata = {
  title: 'Как создать вишлист — Пошаговая инструкция',
  description: 'Подробное руководство по созданию идеального вишлиста. Узнайте, как быстро настроить и поделиться своим списком желаний за 6 шагов.',
  alternates: {
    canonical: 'https://prosto-namekni.ru/how-it-works',
  },
  openGraph: {
    type: 'article',
    title: 'Как создать вишлист — Пошаговая инструкция',
    description: '6 простых шагов к идеальному списку желаний',
    url: 'https://prosto-namekni.ru/how-it-works',
  },
}
```

- [ ] **Step 2: Remove the `<Head>` JSX block**

Delete the entire `<Head>...</Head>` block from the JSX return (lines 56–72 in the current file). Keep the `<>` fragment wrapper as-is — it is still needed to co-locate `<Header />` and the inner `<div>`. Do NOT replace it with a `<div>` (would wrap Header unnecessarily).

- [ ] **Step 3: Fix H1 and brand name**

Change:
```tsx
// H1 text (line 79 in current file)
<h1 className="text-4xl md:text-6xl font-bold text-primary mb-4">
  Как это работает         {/* ← change this */}
</h1>
```
To:
```tsx
<h1 className="text-4xl md:text-6xl font-bold text-primary mb-4">
  Как создать вишлист
</h1>
```

The "WishMaker" brand name only appeared in the old `<Head>` title which is now removed — no further change needed.

- [ ] **Step 4: Verify build**

```bash
pnpm build
```

Expected: no errors. Check `.next/server/app/how-it-works.html` — should have correct title and no `<Head>` artifacts.

- [ ] **Step 5: Commit**

```bash
git add app/how-it-works/page.tsx
git commit -m "fix: migrate how-it-works to App Router metadata, fix H1 keyword"
```

---

### Task 5: Fix terms-of-service page metadata

**Files:**
- Modify: `app/terms-of-service/page.tsx`

- [ ] **Step 1: Remove `Head` import and add `metadata` export with noindex**

1. Remove: `import Head from 'next/head'`
2. Add: `import type { Metadata } from 'next'`

Add before the component:

```tsx
export const metadata: Metadata = {
  title: 'Пользовательское соглашение',
  description: 'Пользовательское соглашение сервиса Просто намекни',
  robots: { index: false, follow: true },
}
```

- [ ] **Step 2: Remove `<Head>` JSX block**

Delete the entire `<Head>...</Head>` block from the JSX (lines 8–13 in current file).

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/terms-of-service/page.tsx
git commit -m "fix: migrate terms-of-service to App Router metadata, add noindex"
```

---

### Task 6: Expand homepage metadata

**Files:**
- Modify: `app/page.tsx`

The title is already correct. Only description and OG tags need updating.

- [ ] **Step 1: Update metadata export**

Replace the existing metadata in `app/page.tsx`:

```tsx
export const metadata: Metadata = {
  title: 'Просто намекни — Создай вишлист и отправь ссылку',
  description: 'Намекни на то, чего хочешь — создай красивый вишлист онлайн и отправь ссылку. Никаких неловких разговоров о подарках. Бесплатно.',
  openGraph: {
    title: 'Просто намекни — Создай вишлист онлайн',
    description: 'Создай вишлист за минуту и поделись с друзьями. Бесплатно.',
    url: 'https://prosto-namekni.ru',
    // images: — add ONLY after public/og-image.png is deployed (Task 11)
  },
  alternates: {
    canonical: 'https://prosto-namekni.ru',
  },
}
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: expand homepage metadata for SEO"
```

---

### Task 7: Create JSON-LD component and add to homepage

**Files:**
- Create: `components/json-ld.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create reusable JSON-LD component**

```tsx
// components/json-ld.tsx
type Props = {
  data: Record<string, unknown>
}

export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

- [ ] **Step 2: Add JSON-LD schemas to homepage**

In `app/page.tsx`, import and add two `<JsonLd>` components inside `<main>` (before `<HeroSection />`):

```tsx
import { JsonLd } from '@/components/json-ld'

// Inside the return, before <HeroSection />:
<JsonLd data={{
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Просто намекни',
  url: 'https://prosto-namekni.ru',
}} />

<JsonLd data={{
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Просто намекни',
  url: 'https://prosto-namekni.ru',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'RUB' },
  description: 'Бесплатный сервис создания вишлистов онлайн',
}} />
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

Expected: no errors. Open `.next/server/app/index.html` and verify two `<script type="application/ld+json">` blocks are present.

- [ ] **Step 4: Validate JSON-LD (manual)**

After `pnpm dev`, open browser, view page source, copy the JSON-LD script content, paste into https://validator.schema.org/ — should show no errors.

- [ ] **Step 5: Commit**

```bash
git add components/json-ld.tsx app/page.tsx
git commit -m "feat: add JSON-LD structured data to homepage"
```

---

### Task 8: Update sitemap config and robots.txt

**Files:**
- Modify: `next-sitemap.config.js`
- Modify: `public/robots.txt`

- [ ] **Step 1: Replace `next-sitemap.config.js`**

```js
// next-sitemap.config.js
module.exports = {
  siteUrl: 'https://prosto-namekni.ru',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  exclude: ['/oauth', '/wishlist/*', '/s/*', '/login', '/registration'],
  transform: async (config, path) => {
    let priority = 0.7
    let changefreq = 'monthly'

    if (path === '/') {
      priority = 1.0
      changefreq = 'weekly'
    } else if (path.startsWith('/wishlist-for/')) {
      priority = 0.9
      changefreq = 'monthly'
    } else if (path.startsWith('/blog/')) {
      priority = 0.8
      changefreq = 'monthly'
    } else if (path === '/how-it-works') {
      priority = 0.7
      changefreq = 'monthly'
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    }
  },
}
```

- [ ] **Step 2: Replace `public/robots.txt`**

```
User-agent: *
Allow: /
Disallow: /s/
Disallow: /wishlist/
Disallow: /oauth/
Disallow: /login/
Disallow: /registration/

Host: https://prosto-namekni.ru
Sitemap: https://prosto-namekni.ru/sitemap.xml
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

Expected: no errors. A `sitemap.xml` file should be generated in `.next/`.

- [ ] **Step 4: Commit**

```bash
git add next-sitemap.config.js public/robots.txt
git commit -m "feat: update sitemap config and robots.txt for SEO"
```

---

### Task 9: Add HowTo JSON-LD to how-it-works page

**Depends on:** Task 7 (creates `components/json-ld.tsx`)

**Files:**
- Modify: `app/how-it-works/page.tsx`

- [ ] **Step 1: Import JsonLd component**

Add to imports in `app/how-it-works/page.tsx`:

```tsx
import { JsonLd } from '@/components/json-ld'
```

- [ ] **Step 2: Add HowTo schema before the step list**

Inside the root element, directly after `<Header />`:

```tsx
<JsonLd data={{
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Как создать вишлист',
  description: 'Пошаговая инструкция по созданию вишлиста на Просто намекни',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Регистрация',
      text: 'Создайте аккаунт за 30 секунд через email или социальные сети',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Создайте вишлист',
      text: 'Назовите ваш вишлист и придумайте описание',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Настройте оформление',
      text: 'Выберите цветовую тему, дату и время праздника',
    },
    {
      '@type': 'HowToStep',
      position: 4,
      name: 'Добавьте подарки',
      text: 'Загрузите фото и придумайте описание',
    },
    {
      '@type': 'HowToStep',
      position: 5,
      name: 'Поделитесь с друзьями',
      text: 'Отправьте уникальную ссылку или опубликуйте в соцсетях',
    },
    {
      '@type': 'HowToStep',
      position: 6,
      name: 'Наслаждайтесь',
      text: 'Получайте только нужные подарки!',
    },
  ],
}} />
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/how-it-works/page.tsx
git commit -m "feat: add HowTo JSON-LD to how-it-works page"
```

---

## Chunk 2: Occasion Landing Pages

### Task 10: Create occasion content data

**Files:**
- Create: `content/occasions/index.ts`

- [ ] **Step 1: Create the occasion data file**

```ts
// content/occasions/index.ts

export type Occasion = {
  slug: string
  title: string
  h1: string
  description: string
  metaDescription: string
  intro: string
  giftIdeas: string[]
  steps: string[]
  canonicalUrl: string
}

export const occasions: Occasion[] = [
  {
    slug: 'birthday',
    title: 'Вишлист на день рождения',
    h1: 'Вишлист на день рождения',
    description: 'Создай вишлист на день рождения и отправь ссылку друзьям. Никаких ненужных подарков — только то, что ты действительно хочешь.',
    metaDescription: 'Создай вишлист на день рождения онлайн бесплатно. Добавь желаемые подарки и поделись ссылкой с друзьями и родными.',
    intro: 'День рождения — лучший повод намекнуть на то, чего ты действительно хочешь. Создай вишлист онлайн за пару минут: добавь подарки, которые тебе нравятся, и просто отправь ссылку. Друзья и родные сами выберут, что подарить — без неловких вопросов и ненужных сюрпризов.',
    giftIdeas: [
      'Наушники или беспроводные колонки',
      'Подарочная карта любимого магазина',
      'Книги из вишлиста на Литресе или Озоне',
      'Настольная игра для компании',
      'Сертификат на спа или массаж',
      'Техника для дома или кухни',
      'Одежда или обувь нужного размера',
      'Курс или мастер-класс по интересному хобби',
      'Духи или косметика любимого бренда',
      'Путешествие или билеты на мероприятие',
    ],
    steps: [
      'Зарегистрируйся на Просто намекни',
      'Создай вишлист с названием "День рождения [твоё имя]"',
      'Добавь подарки с фото и ссылками',
      'Скопируй ссылку и отправь друзьям',
    ],
    canonicalUrl: 'https://prosto-namekni.ru/wishlist-for/birthday',
  },
  {
    slug: 'new-year',
    title: 'Вишлист на Новый год',
    h1: 'Вишлист на Новый год',
    description: 'Создай вишлист на Новый год и расскажи близким, что тебе подарить. Встречай праздник с подарками, которые радуют.',
    metaDescription: 'Создай вишлист на Новый год онлайн бесплатно. Добавь желаемые подарки и поделись ссылкой до праздника.',
    intro: 'Новый год — время подарков и праздничного настроения. Чтобы получить именно то, о чём мечтаешь, создай вишлист заранее и отправь ссылку близким. Так они точно не ошибутся с выбором, а ты встретишь праздник с нужными подарками.',
    giftIdeas: [
      'Умные устройства: смарт-часы, фитнес-браслет',
      'Игровая консоль или аксессуары к ней',
      'Подписка на стриминговый сервис',
      'Тёплый плед или уютная пижама',
      'Новогодний набор косметики',
      'Книги или подписка на библиотеку',
      'Кофемашина или чайник с настроением',
      'Новогодний адвент-календарь',
      'Подарочный сертификат в ресторан',
      'Сумка или кошелёк мечты',
    ],
    steps: [
      'Зарегистрируйся на Просто намекни',
      'Создай вишлист "Мои новогодние желания"',
      'Добавь подарки, которые хочешь получить',
      'Отправь ссылку до 20 декабря — чтобы близкие успели',
    ],
    canonicalUrl: 'https://prosto-namekni.ru/wishlist-for/new-year',
  },
  {
    slug: 'wedding',
    title: 'Вишлист на свадьбу',
    h1: 'Вишлист на свадьбу',
    description: 'Свадебный вишлист онлайн: создай список желаний для молодожёнов и поделитесь с гостями. Получите именно то, что нужно в новой жизни.',
    metaDescription: 'Создай свадебный вишлист онлайн. Добавь подарки для молодожёнов и отправь ссылку гостям — пусть выбирают с удовольствием.',
    intro: 'Свадьба — особый день, и подарки должны быть особенными. Создайте совместный вишлист для молодожёнов: добавьте всё, что пригодится в новой жизни вместе, и отправьте ссылку гостям. Так они смогут выбрать подарок с душой, а вы получите то, что действительно нужно.',
    giftIdeas: [
      'Комплект постельного белья',
      'Набор посуды или кастрюль',
      'Робот-пылесос',
      'Сертификат на путешествие',
      'Мультиварка или техника для кухни',
      'Картины или декор для нового дома',
      'Подписка на доставку продуктов',
      'Фотосессия или фотокнига',
      'Денежный взнос на ипотеку / первый взнос',
      'Сертификат на мебель',
    ],
    steps: [
      'Зарегистрируйтесь на Просто намекни',
      'Создайте совместный вишлист "Подарки на свадьбу"',
      'Добавьте подарки с приоритетами',
      'Укажите ссылку в свадебных приглашениях',
    ],
    canonicalUrl: 'https://prosto-namekni.ru/wishlist-for/wedding',
  },
  {
    slug: 'valentines',
    title: 'Вишлист на 14 февраля',
    h1: 'Вишлист на 14 февраля',
    description: 'Создай вишлист на День святого Валентина. Намекни партнёру на романтичный подарок — без неловких вопросов.',
    metaDescription: 'Вишлист на 14 февраля онлайн. Намекни любимому человеку на подарок мечты ко Дню Валентина.',
    intro: 'День влюблённых — прекрасный повод получить подарок, о котором давно мечтаешь. Создай вишлист и ненавязчиво поделись ссылкой с партнёром. Пусть он выберет то, что тебе действительно понравится — это гораздо лучше, чем очередной набор конфет.',
    giftIdeas: [
      'Ювелирное украшение или браслет',
      'Парные аксессуары',
      'Романтический ужин в ресторане',
      'SPA-процедуры для двоих',
      'Парфюм',
      'Именной подарок с гравировкой',
      'Подписка на любимый сервис',
      'Плед и уютный вечер дома',
      'Цветы любимого сорта',
      'Сертификат на совместный мастер-класс',
    ],
    steps: [
      'Создай аккаунт на Просто намекни',
      'Составь вишлист с романтичными пожеланиями',
      'Поделись ссылкой с партнёром за несколько дней',
      'Жди подарка с нетерпением',
    ],
    canonicalUrl: 'https://prosto-namekni.ru/wishlist-for/valentines',
  },
  {
    slug: 'march-8',
    title: 'Вишлист на 8 марта',
    h1: 'Вишлист на 8 марта',
    description: 'Создай вишлист на 8 марта и расскажи, что тебе подарить. Никакой мимозы — только то, что по-настоящему радует.',
    metaDescription: 'Вишлист на 8 марта онлайн бесплатно. Намекни на подарок мечты к Международному женскому дню.',
    intro: '8 марта — повод получить не просто цветы, а подарок, который действительно нужен. Создай вишлист заранее и поделись ссылкой. Мужчины оценят конкретику: не надо гадать, что подарить — всё уже указано.',
    giftIdeas: [
      'Уходовая косметика или набор от любимого бренда',
      'Цветы — сорт и количество на твой вкус',
      'Украшения',
      'Сертификат на маникюр, педикюр или spa',
      'Книги',
      'Сумка или кошелёк',
      'Подписка на фитнес или йогу',
      'Курс по интересной теме',
      'Техника для красоты (фен, стайлер)',
      'Ужин в любимом ресторане',
    ],
    steps: [
      'Зарегистрируйся на Просто намекни',
      'Создай вишлист "Мои желания на 8 марта"',
      'Добавь от 5 до 10 подарков',
      'Поделись ссылкой заранее — за 1-2 недели до праздника',
    ],
    canonicalUrl: 'https://prosto-namekni.ru/wishlist-for/march-8',
  },
  {
    slug: 'christmas',
    title: 'Вишлист на Рождество',
    h1: 'Вишлист на Рождество',
    description: 'Создай рождественский вишлист онлайн. Поделись с близкими списком желаний и встречай Рождество с подарками мечты.',
    metaDescription: 'Рождественский вишлист онлайн. Создай список желаний на Рождество и поделись с семьёй и друзьями.',
    intro: 'Рождество — семейный праздник с особой атмосферой. Создай рождественский вишлист и поделись с близкими: пусть каждый выберет подарок с любовью. Никакого стресса от выбора — только радость.',
    giftIdeas: [
      'Рождественский адвент-календарь',
      'Тёплая одежда: свитер, шарф, варежки',
      'Набор для ароматерапии или свечи',
      'Настольные игры для семьи',
      'Книги',
      'Гаджеты и умные устройства',
      'Сертификат на впечатления',
      'Украшения для дома',
      'Сладкий подарочный набор',
      'Фотоальбом или фотокнига',
    ],
    steps: [
      'Создай аккаунт на Просто намекни',
      'Составь рождественский вишлист',
      'Поделись ссылкой с семьёй',
      'Наслаждайся праздником',
    ],
    canonicalUrl: 'https://prosto-namekni.ru/wishlist-for/christmas',
  },
  {
    slug: 'kids',
    title: 'Вишлист для ребёнка',
    h1: 'Вишлист для ребёнка',
    description: 'Создай вишлист для ребёнка: добавь игрушки и подарки, которые он хочет, и поделись ссылкой с бабушками, дедушками и друзьями.',
    metaDescription: 'Вишлист для ребёнка онлайн. Создай список желаемых игрушек и подарков, поделись с родственниками и друзьями.',
    intro: 'Знакомая ситуация: бабушки спрашивают "чего хочет ребёнок?" — и начинается суматоха. Создай вишлист для ребёнка один раз и дай ссылку всем, кто хочет порадовать малыша. Никаких дублей, только желанные подарки.',
    giftIdeas: [
      'Конструктор LEGO нужной серии',
      'Мягкая игрушка любимого персонажа',
      'Настольные игры по возрасту',
      'Книги из любимой серии',
      'Набор для творчества',
      'Велосипед или самокат',
      'Обучающие игрушки',
      'Одежда нужного размера',
      'Сертификат в детский магазин',
      'Билеты в театр, цирк или на представление',
    ],
    steps: [
      'Зарегистрируйся на Просто намекни',
      'Создай вишлист "Хочу на день рождения" (или другой праздник)',
      'Добавь игрушки и подарки с фото',
      'Отправь ссылку бабушкам, дедушкам и друзьям',
    ],
    canonicalUrl: 'https://prosto-namekni.ru/wishlist-for/kids',
  },
]

export function getOccasionBySlug(slug: string): Occasion | undefined {
  return occasions.find((o) => o.slug === slug)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add content/occasions/index.ts
git commit -m "feat: add occasion content data"
```

---

### Task 11: Create occasion landing page component

**Files:**
- Create: `app/wishlist-for/[occasion]/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// app/wishlist-for/[occasion]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { JsonLd } from '@/components/json-ld'
import { occasions, getOccasionBySlug } from '@/content/occasions'

type Props = {
  params: { occasion: string }
}

export async function generateStaticParams() {
  return occasions.map((o) => ({ occasion: o.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const occasion = getOccasionBySlug(params.occasion)
  if (!occasion) return {}

  return {
    title: occasion.title,
    description: occasion.metaDescription,
    alternates: { canonical: occasion.canonicalUrl },
    openGraph: {
      title: occasion.title,
      description: occasion.metaDescription,
      url: occasion.canonicalUrl,
    },
  }
}

export default function OccasionPage({ params }: Props) {
  const occasion = getOccasionBySlug(params.occasion)
  if (!occasion) notFound()

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Как создать ${occasion.h1.toLowerCase()}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: occasion.steps.join('. '),
        },
      },
      {
        '@type': 'Question',
        name: 'Это бесплатно?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Да, сервис Просто намекни полностью бесплатный.',
        },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-manrope">
      <JsonLd data={faqSchema} />
      <Header />

      <main>
        {/* Hero */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-primary mb-4">
              {occasion.h1}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              {occasion.description}
            </p>
            <Link
              href="/wishlist"
              className="inline-block bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors"
            >
              Создать вишлист бесплатно
            </Link>
          </div>
        </section>

        {/* Intro */}
        <section className="container mx-auto px-4 pb-12">
          <div className="max-w-2xl mx-auto">
            <p className="text-lg text-muted-foreground leading-relaxed">
              {occasion.intro}
            </p>
          </div>
        </section>

        {/* Gift ideas */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">
              Идеи подарков
            </h2>
            <ul className="space-y-3">
              {occasion.giftIdeas.map((idea, i) => (
                <li key={i} className="flex items-start gap-3 text-muted-foreground">
                  <span className="text-primary font-bold mt-0.5">✓</span>
                  <span>{idea}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How to steps */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">
              Как создать
            </h2>
            <ol className="space-y-4">
              {occasion.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary/10 py-16 md:py-24 mt-8">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-xl mx-auto">
              <h2 className="text-3xl font-bold text-primary mb-4">
                Готов создать вишлист?
              </h2>
              <p className="text-muted-foreground mb-8">
                Бесплатно, красиво, и занимает 2 минуты.
              </p>
              <Link
                href="/wishlist"
                className="inline-block bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors"
              >
                Создать вишлист ✦
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

Expected: 7 static pages generated under `/wishlist-for/`. Check output: `Route (app) /wishlist-for/[occasion]` should show as static.

- [ ] **Step 3: Quick smoke check**

```bash
pnpm dev
# Open http://localhost:3000/wishlist-for/birthday in browser
# Verify: H1 "Вишлист на день рождения", gift ideas list, CTA button visible
```

- [ ] **Step 4: Commit**

```bash
git add app/wishlist-for/
git commit -m "feat: add occasion landing pages for SEO"
```

---

## Chunk 3: Blog Infrastructure + Content

### Task 12: Install MDX and configure Next.js

**Files:**
- Modify: `next.config.ts`
- Create: `mdx-components.tsx`

- [ ] **Step 1: Install MDX packages**

```bash
pnpm add @next/mdx @mdx-js/loader @mdx-js/react
pnpm add -D @types/mdx
```

Expected: packages added to `package.json`, no peer dependency warnings.

- [ ] **Step 2: Update `next.config.ts` to enable MDX**

Replace the contents of `next.config.ts`:

```ts
// next.config.ts
import type { NextConfig } from 'next'
import createMDX from '@next/mdx'

const withMDX = createMDX({})

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/minio/:path*',
        destination: 'http://localhost:9000/:path*',
      },
    ]
  },
  images: {
    remotePatterns: [
      { hostname: 'localhost' },
      { hostname: 'prosto-namekni.ru' },
      { hostname: 'minio' },
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
}

export default withMDX(nextConfig)
```

- [ ] **Step 3: Create `mdx-components.tsx` (required by Next.js MDX)**

```tsx
// mdx-components.tsx  (root of project, next to package.json)
import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { ...components }
}
```

- [ ] **Step 4: Verify build**

```bash
pnpm build
```

Expected: build succeeds. MDX support enabled.

- [ ] **Step 5: Commit**

```bash
git add next.config.ts mdx-components.tsx package.json pnpm-lock.yaml
git commit -m "feat: add MDX support for blog"
```

---

### Task 13: Create blog manifest and utility

**Files:**
- Create: `content/blog/index.ts`
- Create: `lib/blog.ts`

- [ ] **Step 1: Create blog manifest**

```ts
// content/blog/index.ts

export type BlogPost = {
  slug: string
  title: string
  description: string
  date: string  // ISO format: YYYY-MM-DD
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'how-to-create-wishlist',
    title: 'Как создать вишлист: пошаговая инструкция',
    description: 'Подробный гид по созданию вишлиста онлайн. Рассказываем, как добавлять подарки, настраивать оформление и делиться с друзьями.',
    date: '2026-03-16',
  },
  {
    slug: 'wishlist-ideas',
    title: '50 идей для вишлиста на любой случай',
    description: 'Не знаешь, что добавить в вишлист? Собрали 50 идей подарков для разных праздников и поводов.',
    date: '2026-03-16',
  },
  {
    slug: 'what-is-wishlist',
    title: 'Что такое вишлист и зачем он нужен',
    description: 'Объясняем, что такое вишлист, как он помогает получать нужные подарки и почему это удобнее, чем устные подсказки.',
    date: '2026-03-16',
  },
  {
    slug: 'share-wishlist',
    title: 'Как поделиться вишлистом с друзьями',
    description: 'Способы поделиться вишлистом: через ссылку, мессенджеры, социальные сети. Советы по правильному тайминогу.',
    date: '2026-03-16',
  },
  {
    slug: 'wishlist-gifts',
    title: 'Вишлист вместо списка подарков: почему это удобно',
    description: 'Чем вишлист онлайн лучше обычного списка в заметках. Преимущества и советы по ведению вишлиста.',
    date: '2026-03-16',
  },
]
```

- [ ] **Step 2: Create blog utility**

```ts
// lib/blog.ts
import { blogPosts, type BlogPost } from '@/content/blog'

export function getAllPosts(): BlogPost[] {
  return [...blogPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug)
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
pnpm build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add content/blog/index.ts lib/blog.ts
git commit -m "feat: add blog manifest and utility"
```

---

### Task 14: Create blog listing page

**Files:**
- Create: `app/blog/page.tsx`

- [ ] **Step 1: Create the blog listing page**

```tsx
// app/blog/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { getAllPosts } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Блог о вишлистах',
  description: 'Советы по созданию вишлистов, идеи подарков и гиды для разных праздников.',
  alternates: {
    canonical: 'https://prosto-namekni.ru/blog',
  },
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen bg-background text-foreground font-manrope">
      <Header />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Блог
          </h1>
          <p className="text-muted-foreground text-lg mb-12">
            Советы по вишлистам, идеи подарков и руководства для всех поводов.
          </p>

          <div className="space-y-8">
            {posts.map((post) => (
              <article key={post.slug} className="border-b border-border pb-8">
                <Link href={`/blog/${post.slug}`} className="group">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground mb-3">{post.description}</p>
                  <span className="text-sm text-muted-foreground">
                    {new Date(post.date).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

Expected: `/blog` route generated.

- [ ] **Step 3: Commit**

```bash
git add app/blog/page.tsx
git commit -m "feat: add blog listing page"
```

---

### Task 15: Create blog post page

**Files:**
- Create: `app/blog/[slug]/page.tsx`

- [ ] **Step 1: Create the blog post page**

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { JsonLd } from '@/components/json-ld'
import { getAllPosts, getPostBySlug } from '@/lib/blog'

type Props = {
  params: { slug: string }
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPostBySlug(params.slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `https://prosto-namekni.ru/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: `https://prosto-namekni.ru/blog/${post.slug}`,
      publishedTime: post.date,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  let MDXContent: React.ComponentType
  try {
    const mod = await import(`@/content/blog/${params.slug}.mdx`)
    MDXContent = mod.default
  } catch {
    notFound()
  }

  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      '@type': 'Organization',
      name: 'Просто намекни',
      url: 'https://prosto-namekni.ru',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Просто намекни',
      url: 'https://prosto-namekni.ru',
    },
    url: `https://prosto-namekni.ru/blog/${post.slug}`,
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://prosto-namekni.ru' },
      { '@type': 'ListItem', position: 2, name: 'Блог', item: 'https://prosto-namekni.ru/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: `https://prosto-namekni.ru/blog/${post.slug}` },
    ],
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-manrope">
      <JsonLd data={blogPostingSchema} />
      <JsonLd data={breadcrumbSchema} />
      <Header />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-sm text-muted-foreground mb-8">
            <Link href="/" className="hover:text-primary">Главная</Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-primary">Блог</Link>
            <span className="mx-2">/</span>
            <span>{post.title}</span>
          </nav>

          <article className="prose prose-neutral dark:prose-invert max-w-none">
            <MDXContent />
          </article>

          <div className="mt-12 pt-8 border-t border-border">
            <Link href="/blog" className="text-primary hover:underline">
              ← Все статьи
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles (MDX files don't exist yet — expect a build error if they don't exist)**

Before adding MDX files, run:

```bash
pnpm build 2>&1 | head -30
```

Expected: may error on missing MDX files — that's OK. The next tasks add them.

- [ ] **Step 3: Commit**

```bash
git add app/blog/[slug]/page.tsx
git commit -m "feat: add blog post page with JSON-LD"
```

---

### Task 16: Write blog article — "Как создать вишлист"

**Files:**
- Create: `content/blog/how-to-create-wishlist.mdx`

- [ ] **Step 1: Create the article**

```mdx
# Как создать вишлист: пошаговая инструкция

Вишлист — это список желаний, которым ты делишься с близкими. Вместо того чтобы намекать устно или надеяться, что угадают, ты просто отправляешь ссылку. Удобно для тебя, понятно для других.

В этой инструкции расскажем, как создать вишлист на [Просто намекни](https://prosto-namekni.ru) за несколько минут.

## Шаг 1: Зарегистрируйся

Перейди на [prosto-namekni.ru](https://prosto-namekni.ru) и создай аккаунт. Это займёт 30 секунд: нужен только email или Telegram.

## Шаг 2: Создай новый вишлист

В личном кабинете нажми «Создать вишлист». Придумай название — например, «День рождения 2026» или «Хочу на НГ» — и добавь короткое описание.

## Шаг 3: Выбери оформление

Выбери цветовую тему, которая тебе нравится. Есть более 10 вариантов: от минималистичных до ярких. Можно указать дату праздника — тогда на странице появится таймер обратного отсчёта.

## Шаг 4: Добавь подарки

Нажми «Добавить подарок» и заполни:
- **Название** — например, «Наушники Sony WH-1000XM5»
- **Ссылка** — скопируй адрес товара в магазине
- **Цена** — чтобы друзья понимали бюджет
- **Фото** — загрузи или оно подтянется по ссылке

Добавь столько подарков, сколько хочешь. Разные ценовые категории — разные возможности для дарителей.

## Шаг 5: Поделись вишлистом

Нажми «Поделиться» и скопируй уникальную ссылку. Отправь её в мессенджер, опубликуй в соцсетях или просто расскажи друзьям.

Всё. Теперь твои близкие знают, что тебе нравится, и могут выбрать подарок без лишних вопросов.

## Полезные советы

- **Добавляй подарки разного бюджета** — от 500 до 10 000 рублей, чтобы каждый мог выбрать по возможностям.
- **Указывай ссылки на конкретные товары** — это экономит время дарителей.
- **Обновляй вишлист** — если что-то уже не хочется, убирай из списка.
- **Не жди идеального момента** — делись вишлистом за 2–3 недели до праздника.

## Часто задаваемые вопросы

**Это бесплатно?**
Да, полностью бесплатно.

**Видят ли друзья, кто что выбрал?**
Да — гости видят статус «уже выбрали», чтобы не дублировать подарки. Ты сам можешь скрыть эту информацию в настройках.

**Можно создать несколько вишлистов?**
Да, создавай сколько угодно под разные праздники.
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

Expected: 1 of 5 blog routes generates. No errors.

- [ ] **Step 3: Commit**

```bash
git add content/blog/how-to-create-wishlist.mdx
git commit -m "content: add blog article — как создать вишлист"
```

---

### Task 17: Write remaining 4 blog articles

**Files:**
- Create: `content/blog/wishlist-ideas.mdx`
- Create: `content/blog/what-is-wishlist.mdx`
- Create: `content/blog/share-wishlist.mdx`
- Create: `content/blog/wishlist-gifts.mdx`

- [ ] **Step 1: Create `content/blog/wishlist-ideas.mdx`**

```mdx
# 50 идей для вишлиста на любой случай

Не знаешь, что добавить в вишлист? Мы собрали 50 идей подарков на самые разные поводы и бюджеты.

## День рождения

1. Беспроводные наушники
2. Подарочная карта любимого магазина
3. Книги из твоего списка на прочтение
4. Настольная игра для компании
5. Сертификат на SPA или массаж
6. Умные часы или фитнес-браслет
7. Курс по интересному хобби
8. Ужин в ресторане
9. Духи или парфюм
10. Билеты на концерт или в театр

## Новый год

11. Уютный плед или пижама
12. Адвент-календарь с косметикой или сладостями
13. Подписка на стриминговый сервис (Netflix, Яндекс Плюс)
14. Кофемашина или чайник
15. Набор для ароматерапии
16. Настольные игры для семьи
17. Книга-бестселлер этого года
18. Умная колонка
19. Украшение для дома
20. Сертификат на впечатления

## Свадьба

21. Комплект постельного белья
22. Набор посуды или кастрюль
23. Робот-пылесос
24. Мультиварка или хлебопечка
25. Картины или постеры для интерьера
26. Сертификат на путешествие
27. Подписка на доставку продуктов
28. Фотокнига или фотосессия
29. Сертификат на мебель
30. Набор полотенец

## Для детей

31. Конструктор LEGO нужной серии
32. Мягкая игрушка любимого персонажа
33. Велосипед или самокат
34. Набор для творчества
35. Настольная игра по возрасту
36. Книги из любимой серии
37. Обучающие игрушки
38. Одежда нужного размера
39. Сертификат в детский магазин
40. Билеты в цирк или театр

## Универсальные идеи

41. Сертификат в любимый магазин
42. Подписка на онлайн-кинотеатр
43. Подписка на музыкальный сервис
44. Онлайн-курс (программирование, языки, дизайн)
45. Книги по интересной теме
46. Подарочная коробка с едой (шоколад, чай, кофе)
47. Зарядное устройство или powerbank
48. Красивый ежедневник или блокнот
49. Уходовая косметика
50. Сертификат на мастер-класс (кулинария, гончарство, живопись)

---

Создай свой вишлист на [Просто намекни](https://prosto-namekni.ru) и добавь всё, что тебе нравится. Бесплатно и за пару минут.
```

- [ ] **Step 2: Create `content/blog/what-is-wishlist.mdx`**

```mdx
# Что такое вишлист и зачем он нужен

Слово «вишлист» (англ. wish list) буквально означает «список желаний». Это список вещей, которые человек хочет получить в подарок — с описаниями, фото, ценами и ссылками.

## Чем вишлист отличается от устного намёка

Устный намёк теряется. «Я хочу наушники» — это широко. Какие именно? Какого цвета? По какой ссылке заказать?

Вишлист даёт конкретику:
- Точное название товара
- Ссылка в магазине
- Цена
- Приоритет (хочу очень / хочу / было бы приятно)

Даритель видит всё это и принимает решение без лишних вопросов.

## Зачем нужен вишлист

**Для тебя:**
- Получаешь именно то, что хочешь
- Не нужно неловко намекать или отвечать «да всё хорошо, ничего не надо»
- Один раз составил — используешь на все праздники

**Для дарителей:**
- Нет стресса от выбора
- Уверенность, что подарок понравится
- Можно объединиться с другими на более дорогой подарок

## Когда стоит создать вишлист

- За 2–3 недели до дня рождения
- Перед новогодними праздниками
- На свадьбу или новоселье
- На любой другой праздник, где ждёшь подарков

## Как это работает на практике

Ты создаёшь вишлист на [Просто намекни](https://prosto-namekni.ru), добавляешь подарки с фото и ссылками, и просто отправляешь ссылку друзьям. Они видят список, выбирают что-то конкретное и отмечают «я дарю это» — чтобы никто не задублировал подарок.

Всё просто, и никаких неловких разговоров о подарках.
```

- [ ] **Step 3: Create `content/blog/share-wishlist.mdx`**

```mdx
# Как поделиться вишлистом с друзьями

Вишлист создан — теперь нужно сделать так, чтобы нужные люди его увидели. Рассказываем о лучших способах поделиться.

## Способ 1: Ссылка в мессенджер

Самый простой и надёжный способ. Скопируй уникальную ссылку вишлиста и отправь в:
- WhatsApp или Telegram — лично или в групповой чат
- ВКонтакте — в личные сообщения
- Viber, iMessage — любой мессенджер

**Когда использовать:** когда хочешь поделиться с конкретными людьми или группой.

## Способ 2: Публикация в соцсетях

Опубликуй ссылку в своём профиле ВКонтакте или Telegram-канале с подписью «Мой вишлист на день рождения — если хочешь порадовать, вот список 😊».

**Когда использовать:** когда у тебя большой круг общения и ты не знаешь, кто что планирует дарить.

## Способ 3: В описании профиля

Добавь ссылку в bio в Instagram, ВКонтакте или Telegram. Особенно удобно перед праздником: все кто заходит на твою страницу — видят вишлист.

## Способ 4: QR-код

На Просто намекни есть встроенная генерация QR-кода. Распечатай и прикрепи к приглашению на день рождения или свадьбу — гости смогут отсканировать прямо на мероприятии.

## Советы по тайминогу

- **День рождения:** поделись за 2–3 недели. Те, кто хочет заказать онлайн, успеют с доставкой.
- **Новый год:** поделись в конце ноября или начале декабря.
- **Свадьба:** укажи ссылку в приглашениях или на свадебном сайте.

## Что писать при отправке

Не нужно ничего сложного. Несколько вариантов:
- «Привет! Скоро день рождения, вот мой вишлист если будешь выбирать подарок: [ссылка]»
- «Составила список желаний, буду рада если поможет: [ссылка]»
- «Пусть будет так — если что-то хочешь подарить: [ссылка]»

Люди ценят конкретику. Большинство дарителей облегчённо вздохнут и скажут спасибо за подсказку.
```

- [ ] **Step 4: Create `content/blog/wishlist-gifts.mdx`**

```mdx
# Вишлист вместо списка подарков: почему это удобно

Многие ведут список желаний в заметках телефона или просто держат в голове. Это работает, пока тебя не спрашивают «что тебе подарить?» — и ты снова говоришь «да ничего не надо».

Онлайн-вишлист решает эту проблему. Вот почему это удобнее.

## 1. Всё в одном месте

Заметки теряются, устные намёки забываются. Онлайн-вишлист — это постоянная ссылка, которую можно обновлять и отправлять снова и снова.

## 2. Конкретика вместо догадок

«Хочу наушники» — это плохая подсказка. «Хочу Sony WH-1000XM5 в чёрном цвете, вот ссылка, стоит 18 000 рублей» — это отличная подсказка.

В вишлисте на [Просто намекни](https://prosto-namekni.ru) можно добавить:
- Фото товара
- Ссылку в магазин
- Цену
- Приоритет

## 3. Нет дублей

Это одна из главных проблем без вишлиста: трое друзей дарят одно и то же, потому что не знали о планах друг друга.

В вишлисте гости видят, что уже «занято», и выбирают что-то другое. Никаких трёх одинаковых кофемашин.

## 4. Разные бюджеты

Добавляй подарки на разные суммы: от 500 рублей до 20 000 и выше. Каждый даритель выберет по своим возможностям — и будет доволен.

## 5. Можно обновлять

В отличие от устного разговора, вишлист можно менять в любой момент. Передумал хотеть что-то? Убрал. Появилось новое желание? Добавил.

## 6. Просто и ненавязчиво

Отправить ссылку — это не «требовать подарок». Это помочь людям, которые всё равно собираются что-то подарить, сделать правильный выбор.

---

Создай свой первый вишлист на [Просто намекни](https://prosto-namekni.ru) — это займёт 2 минуты и полностью бесплатно.
```

- [ ] **Step 5: Verify full build**

```bash
pnpm build
```

Expected: all 5 blog routes generated (`/blog/how-to-create-wishlist`, etc.), all static, no errors.

- [ ] **Step 6: Smoke check blog**

```bash
pnpm dev
# Open http://localhost:3000/blog — should list 5 articles
# Open http://localhost:3000/blog/how-to-create-wishlist — should render article content
```

- [ ] **Step 7: Commit**

```bash
git add content/blog/
git commit -m "content: add 5 blog articles"
```

---

### Task 18: Add OG image (manual step) and enable in metadata

**Files:**
- Create: `public/og-image.png` (manual design task)
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create OG image**

Design a 1200×630 px image (Figma, Canva, or any tool) with:
- Dark background (`#000d1a` matches the landing page)
- Logo / site name "Просто намекни" (large, white or gradient text)
- Tagline: "Создай вишлист и отправь ссылку"

Save as `public/og-image.png`.

- [ ] **Step 2: Verify the file exists**

```bash
ls -la public/og-image.png
```

Expected: file present, size > 50KB.

- [ ] **Step 3: Enable OG image in root layout metadata**

In `app/layout.tsx`, uncomment the images line in `openGraph`:

```ts
openGraph: {
  type: 'website',
  locale: 'ru_RU',
  url: 'https://prosto-namekni.ru',
  siteName: 'Просто намекни',
  images: [{ url: '/og-image.png', width: 1200, height: 630 }],  // ← uncomment this
},
```

- [ ] **Step 4: Enable OG image in homepage metadata**

In `app/page.tsx`, uncomment the images line in `openGraph`:

```ts
openGraph: {
  title: 'Просто намекни — Создай вишлист онлайн',
  description: 'Создай вишлист за минуту и поделись с друзьями. Бесплатно.',
  url: 'https://prosto-namekni.ru',
  images: [{ url: '/og-image.png', width: 1200, height: 630 }],  // ← uncomment this
},
```

- [ ] **Step 5: Verify build**

```bash
pnpm build
```

Expected: no errors.

- [ ] **Step 6: Test OG preview**

After deploy, paste the URL into https://t.me/share/url or https://cards-dev.twitter.com/validator to verify the OG image appears.

- [ ] **Step 7: Commit**

```bash
git add public/og-image.png app/layout.tsx app/page.tsx
git commit -m "feat: add OG image and enable in metadata"
```

---

### Task 19: Register in search engines (post-deploy checklist)

This task is done manually after deploying to production. No code changes needed.

- [ ] **Step 1: Google Search Console**
  1. Go to https://search.google.com/search-console
  2. Add property `https://prosto-namekni.ru`
  3. Copy the verification token
  4. In `app/layout.tsx`, replace `'REPLACE_WITH_GOOGLE_TOKEN'` with the actual token
  5. Deploy
  6. Click "Verify" in Search Console
  7. Submit sitemap: `https://prosto-namekni.ru/sitemap.xml`

- [ ] **Step 2: Yandex Webmaster**
  1. Go to https://webmaster.yandex.ru
  2. Add site `https://prosto-namekni.ru`
  3. Copy the verification token
  4. In `app/layout.tsx`, replace `'REPLACE_WITH_YANDEX_TOKEN'` with the actual token
  5. Deploy
  6. Click "Verify" in Yandex Webmaster
  7. Submit sitemap: `https://prosto-namekni.ru/sitemap.xml`

- [ ] **Step 3: Commit verification tokens**

```bash
git add app/layout.tsx
git commit -m "feat: add search engine verification tokens"
```
