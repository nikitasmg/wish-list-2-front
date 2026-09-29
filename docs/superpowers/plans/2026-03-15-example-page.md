# Example Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать страницу `/example` с тремя статическими примерами вишлистов в виде превью-карточек с открытием полного вишлиста в модальном окне.

**Architecture:** Два файла: `app/example/data.ts` с мок-данными трёх вишлистов и `app/example/page.tsx` с сеткой карточек и единым контролируемым `Dialog`, рендерящим `WishlistLanding`.

**Tech Stack:** Next.js 16 App Router, shadcn/ui Dialog, WishlistLanding, Tailwind CSS, colorSchema из shared/constants

**Spec:** `docs/superpowers/specs/2026-03-14-example-page-design.md`

---

## Chunk 1: Мок-данные

### Task 1: Создать `app/example/data.ts`

**Files:**
- Create: `app/example/data.ts`

- [ ] **Step 1: Создать файл с данными**

```ts
import { Present, Wishlist } from '@/shared/types'

export type ExampleData = {
  wishlist: Wishlist
  presents: Present[]
}

const STUB_DATE = '2026-01-01T00:00:00Z'

// ── День рождения ────────────────────────────────────────────────
const birthdayWishlist: Wishlist = {
  id: 'example-birthday',
  title: 'День рождения Саши 🎂',
  description: 'Сашке исполняется 7 лет! Он обожает конструкторы, активный отдых и книги про волшебников.',
  cover: '',
  presentsCount: 4,
  userId: 'example',
  settings: {
    colorScheme: 'blush',
    showGiftAvailability: false,
    presentsLayout: 'grid2',
  },
  location: { name: '' },
  blocks: [],
  createdAt: STUB_DATE,
  updatedAt: STUB_DATE,
}

const birthdayPresents: Present[] = [
  {
    id: 'ex-b-1',
    wishlistId: 'example-birthday',
    title: 'LEGO City — Пожарная станция',
    description: 'Набор 60320, 540 деталей',
    cover: '',
    price: 4990,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
  {
    id: 'ex-b-2',
    wishlistId: 'example-birthday',
    title: 'Самокат Micro Sprite',
    description: 'Складной, для детей 5–12 лет',
    cover: '',
    price: 7500,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
  {
    id: 'ex-b-3',
    wishlistId: 'example-birthday',
    title: 'Наушники JBL JR310',
    description: 'Детские, с ограничением громкости',
    cover: '',
    price: 2490,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
  {
    id: 'ex-b-4',
    wishlistId: 'example-birthday',
    title: 'Гарри Поттер и философский камень',
    description: 'Иллюстрированное издание',
    cover: '',
    price: 890,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
]

// ── Свадьба ──────────────────────────────────────────────────────
const weddingWishlist: Wishlist = {
  id: 'example-wedding',
  title: 'Свадьба Кати и Димы 💍',
  description: 'Мы женимся! Если хочешь сделать нам подарок — здесь собрали всё самое нужное для нашего нового дома.',
  cover: '',
  presentsCount: 4,
  userId: 'example',
  settings: {
    colorScheme: 'cloud',
    showGiftAvailability: false,
    presentsLayout: 'grid2',
  },
  location: { name: '' },
  blocks: [],
  createdAt: STUB_DATE,
  updatedAt: STUB_DATE,
}

const weddingPresents: Present[] = [
  {
    id: 'ex-w-1',
    wishlistId: 'example-wedding',
    title: 'Чайник Smeg KLF04',
    description: 'Ретро-стиль, 1,7 л, кремовый',
    cover: '',
    price: 12900,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
  {
    id: 'ex-w-2',
    wishlistId: 'example-wedding',
    title: 'Постельное бельё IKEA NATTJASMIN',
    description: 'Комплект евро, 100% хлопок',
    cover: '',
    price: 3490,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
  {
    id: 'ex-w-3',
    wishlistId: 'example-wedding',
    title: 'Сертификат в ресторан Björn',
    description: 'На романтический ужин на двоих',
    cover: '',
    price: 5000,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
  {
    id: 'ex-w-4',
    wishlistId: 'example-wedding',
    title: 'Ваза Villeroy & Boch',
    description: 'Коллекция Manufacture Glow, 30 см',
    cover: '',
    price: 8200,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
]

// ── Вечеринка ────────────────────────────────────────────────────
const partyWishlist: Wishlist = {
  id: 'example-party',
  title: 'Вечеринка у Макса 🎉',
  description: 'Собираемся в эту пятницу! Принесите что-нибудь из списка — сделаем вечер незабываемым.',
  cover: '',
  presentsCount: 4,
  userId: 'example',
  settings: {
    colorScheme: 'cosmic',
    showGiftAvailability: false,
    presentsLayout: 'grid2',
  },
  location: { name: '' },
  blocks: [],
  createdAt: STUB_DATE,
  updatedAt: STUB_DATE,
}

const partyPresents: Present[] = [
  {
    id: 'ex-p-1',
    wishlistId: 'example-party',
    title: 'Коктейльный набор Barfly',
    description: 'Шейкер, стрейнер, мерник, ложка',
    cover: '',
    price: 3200,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
  {
    id: 'ex-p-2',
    wishlistId: 'example-party',
    title: 'Настолка «Имаджинариум»',
    description: 'Компактная версия, 6 игроков',
    cover: '',
    price: 1890,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
  {
    id: 'ex-p-3',
    wishlistId: 'example-party',
    title: 'Bluetooth-колонка JBL Flip 6',
    description: 'Водостойкая, 12 ч работы',
    cover: '',
    price: 4990,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
  {
    id: 'ex-p-4',
    wishlistId: 'example-party',
    title: 'Флешка с плейлистом вечера',
    description: '64 ГБ, подборка от хозяина вечеринки',
    cover: '',
    price: 990,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
]

// ── Экспорт ──────────────────────────────────────────────────────
export const examples: ExampleData[] = [
  { wishlist: birthdayWishlist, presents: birthdayPresents },
  { wishlist: weddingWishlist, presents: weddingPresents },
  { wishlist: partyWishlist, presents: partyPresents },
]
```

- [ ] **Step 2: Проверить lint**

```bash
pnpm exec eslint app/example/data.ts
```

Ожидаем: нет ошибок.

- [ ] **Step 3: Commit**

```bash
git add app/example/data.ts
git commit -m "feat: add example page mock data"
```

---

## Chunk 2: Страница

### Task 2: Создать `app/example/page.tsx`

**Files:**
- Create: `app/example/page.tsx`

- [ ] **Step 1: Создать страницу**

```tsx
'use client'

import { examples, ExampleData } from '@/app/example/data'
import { WishlistLanding } from '@/app/s/[shortId]/components/wishlist-landing'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { colorSchema } from '@/shared/constants'
import * as React from 'react'

function ExampleCoverPlaceholder({ colorScheme }: { colorScheme: string }) {
  const scheme = colorSchema.find((s) => s.value === colorScheme) ?? colorSchema[0]
  const [bg, accent] = scheme.colors
  return (
    <div
      className="w-full h-[140px] rounded-t-xl"
      style={{
        backgroundImage: [
          `radial-gradient(circle, ${accent}26 1px, transparent 1px)`,
          `linear-gradient(135deg, ${accent}40 0%, ${bg}26 100%)`,
        ].join(', '),
        backgroundSize: '18px 18px, 100% 100%',
        backgroundColor: bg,
      }}
    />
  )
}

function ExampleCard({ data, onOpen }: { data: ExampleData; onOpen: () => void }) {
  return (
    <div className="border rounded-xl shadow hover:shadow-md transition-shadow bg-card flex flex-col">
      <ExampleCoverPlaceholder colorScheme={data.wishlist.settings.colorScheme} />
      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3 className="font-semibold text-base leading-snug">{data.wishlist.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{data.wishlist.description}</p>
        <p className="text-xs text-muted-foreground">{data.presents.length} подарков</p>
        <Button size="sm" className="w-full mt-1" onClick={onOpen}>
          Посмотреть
        </Button>
      </div>
    </div>
  )
}

export default function ExamplePage() {
  const [selected, setSelected] = React.useState<ExampleData | null>(null)

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Примеры вишлистов</h1>
        <p className="text-muted-foreground">
          Посмотри, как выглядят вишлисты для разных поводов — и создай свой
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {examples.map((ex) => (
          <ExampleCard
            key={ex.wishlist.id}
            data={ex}
            onOpen={() => setSelected(ex)}
          />
        ))}
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => { if (!open) setSelected(null) }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <DialogTitle className="sr-only">
            {selected?.wishlist.title ?? 'Пример вишлиста'}
          </DialogTitle>
          {selected && (
            <WishlistLanding
              wishlist={selected.wishlist}
              presents={selected.presents}
              isMyWishlist={false}
              disableBodyTheme
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 2: Проверить lint**

```bash
pnpm exec eslint app/example/page.tsx
```

Ожидаем: нет ошибок.

- [ ] **Step 3: Проверить визуально**

```bash
pnpm dev
```

Открыть `http://localhost:3000/example`:
- Три карточки в сетке с цветными заглушками
- Клик «Посмотреть» → модалка с полным вишлистом
- Закрытие крестиком / кликом вне — модалка закрывается
- Подарки отображаются в grid2 внутри вишлиста

- [ ] **Step 4: Commit**

```bash
git add app/example/page.tsx
git commit -m "feat: add /example page with wishlist previews"
```
