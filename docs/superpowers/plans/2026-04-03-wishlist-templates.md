# Wishlist Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить страницу `/wishlist/create` с выбором шаблона вишлиста и диалогом ввода названия + даты перед созданием.

**Architecture:** Шаблоны хранятся в `content/templates/index.ts` как массив объектов с фабричной функцией `buildBlocks(title, date?)`. Страница `/wishlist/create` рендерит карточки шаблонов, по клику открывает Dialog с формой, по сабмиту вызывает `useApiCreateConstructorWishlist` и делает редирект в редактор. Кнопка «Создать вишлист» на `/wishlist/page.tsx` меняется с прямого вызова API на `router.push('/wishlist/create')`.

**Tech Stack:** Next.js 16 App Router, React, TanStack Query, react-hook-form + zod, shadcn/ui (Dialog, Calendar, Popover, Form, Input, Button), date-fns + ru locale, Tailwind CSS.

---

## File Map

| Action | File |
|--------|------|
| Create | `content/templates/index.ts` |
| Create | `app/wishlist/create/components/template-card.tsx` |
| Create | `app/wishlist/create/components/template-dialog.tsx` |
| Create | `app/wishlist/create/page.tsx` |
| Modify | `app/wishlist/page.tsx` |

---

### Task 1: Template definitions

**Files:**
- Create: `content/templates/index.ts`

- [ ] **Step 1: Create the file**

```ts
import { Block } from '@/shared/types'

export type WishlistTemplate = {
  id: string
  label: string
  category: string
  emoji: string
  colorScheme: string
  accentColor: string
  gradientFrom: string
  description: string
  buildBlocks: (title: string, date?: Date) => Block[]
}

function toLocalIso(date?: Date): string {
  const d = date ?? (() => {
    const n = new Date()
    n.setMonth(n.getMonth() + 3)
    return n
  })()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T12:00:00`
}

export const templates: WishlistTemplate[] = [
  {
    id: 'birthday_boy',
    label: 'Для мальчика',
    category: 'День рождения',
    emoji: '🚀',
    colorScheme: 'cloud',
    accentColor: '#0284c7',
    gradientFrom: '#f0f9ff',
    description: 'Дата, место, программа, чеклист',
    buildBlocks: (title, date) => {
      const dt = toLocalIso(date)
      return [
        {
          type: 'text', row: 0, col: 0, colSpan: 2,
          data: { html: `<p>Привет! 🎉 Приглашаем тебя на <strong>${title}</strong>! Приходи с хорошим настроением — всё остальное мы уже организовали.</p>` },
        },
        { type: 'date', row: 1, col: 0, colSpan: 1, data: { datetime: dt, label: 'День рождения' } },
        { type: 'location', row: 1, col: 1, colSpan: 1, data: { name: 'Место проведения' } },
        { type: 'timing', row: 2, col: 0, colSpan: 2, data: { end: dt } },
        { type: 'divider', row: 3, col: 0, colSpan: 2, data: { style: 'dots' } },
        {
          type: 'agenda', row: 4, col: 0, colSpan: 2,
          data: {
            items: [
              { time: '12:00', text: 'Сбор гостей' },
              { time: '12:30', text: 'Игры и развлечения' },
              { time: '14:00', text: 'Праздничный стол и торт 🎂' },
              { time: '14:45', text: 'Вручение подарков' },
              { time: '15:30', text: 'Свободное время и фото' },
            ],
          },
        },
        {
          type: 'checklist', row: 5, col: 0, colSpan: 1,
          data: {
            title: 'Что взять с собой',
            items: [{ text: 'Хорошее настроение' }, { text: 'Подарок (список ниже 👇)' }],
          },
        },
        { type: 'divider', row: 6, col: 0, colSpan: 2, data: { style: 'line' } },
        { type: 'contact', row: 7, col: 0, colSpan: 1, data: { name: 'Организатор', role: 'Мама именинника', telegram: '' } },
      ]
    },
  },
  {
    id: 'birthday_girl',
    label: 'Для девочки',
    category: 'День рождения',
    emoji: '🦄',
    colorScheme: 'blush',
    accentColor: '#e11d48',
    gradientFrom: '#fff1f2',
    description: 'Дата, место, программа, чеклист',
    buildBlocks: (title, date) => {
      const dt = toLocalIso(date)
      return [
        {
          type: 'text', row: 0, col: 0, colSpan: 2,
          data: { html: `<p>Привет! 🎀 Приглашаем тебя на <strong>${title}</strong>! Будет красиво, вкусно и весело 🌸</p>` },
        },
        { type: 'date', row: 1, col: 0, colSpan: 1, data: { datetime: dt, label: 'День рождения' } },
        { type: 'location', row: 1, col: 1, colSpan: 1, data: { name: 'Место проведения' } },
        { type: 'timing', row: 2, col: 0, colSpan: 2, data: { end: dt } },
        { type: 'divider', row: 3, col: 0, colSpan: 2, data: { style: 'dots' } },
        {
          type: 'agenda', row: 4, col: 0, colSpan: 2,
          data: {
            items: [
              { time: '13:00', text: 'Сбор гостей' },
              { time: '13:30', text: 'Игры и конкурсы 🎉' },
              { time: '15:00', text: 'Праздничный стол и торт 🎂' },
              { time: '15:45', text: 'Вручение подарков 🎁' },
              { time: '16:30', text: 'Фотосессия и свободное время' },
            ],
          },
        },
        {
          type: 'checklist', row: 5, col: 0, colSpan: 1,
          data: {
            title: 'Что взять с собой',
            items: [{ text: 'Хорошее настроение' }, { text: 'Подарок (список ниже 👇)' }],
          },
        },
        { type: 'divider', row: 6, col: 0, colSpan: 2, data: { style: 'line' } },
        { type: 'contact', row: 7, col: 0, colSpan: 1, data: { name: 'Организатор', role: 'Мама именинницы', telegram: '' } },
      ]
    },
  },
  {
    id: 'birthday_man',
    label: 'Для него',
    category: 'День рождения',
    emoji: '🎯',
    colorScheme: 'cosmic',
    accentColor: '#8b5cf6',
    gradientFrom: '#08001a',
    description: 'Дата, место, цитата, контакты',
    buildBlocks: (title, date) => {
      const dt = toLocalIso(date)
      return [
        {
          type: 'text', row: 0, col: 0, colSpan: 2,
          data: { html: `<p>Привет! Отмечаем <strong>${title}</strong> — будет по-настоящему круто. Приходи!</p>` },
        },
        { type: 'date', row: 1, col: 0, colSpan: 1, data: { datetime: dt, label: 'День рождения' } },
        { type: 'location', row: 1, col: 1, colSpan: 1, data: { name: 'Место проведения' } },
        { type: 'timing', row: 2, col: 0, colSpan: 2, data: { end: dt } },
        { type: 'divider', row: 3, col: 0, colSpan: 2, data: { style: 'dots' } },
        {
          type: 'quote', row: 4, col: 0, colSpan: 2,
          data: { text: 'Лучший подарок — это время, проведённое вместе.' },
        },
        { type: 'divider', row: 5, col: 0, colSpan: 2, data: { style: 'line' } },
        { type: 'contact', row: 6, col: 0, colSpan: 1, data: { name: 'Организатор', role: 'Контакт', telegram: '' } },
      ]
    },
  },
  {
    id: 'birthday_woman',
    label: 'Для неё',
    category: 'День рождения',
    emoji: '💐',
    colorScheme: 'lavender',
    accentColor: '#7c3aed',
    gradientFrom: '#faf5ff',
    description: 'Дата, место, цитата, контакты',
    buildBlocks: (title, date) => {
      const dt = toLocalIso(date)
      return [
        {
          type: 'text', row: 0, col: 0, colSpan: 2,
          data: { html: `<p>Привет! 💜 Отмечаем <strong>${title}</strong> — будет тепло, красиво и очень душевно. Ждём тебя!</p>` },
        },
        { type: 'date', row: 1, col: 0, colSpan: 1, data: { datetime: dt, label: 'День рождения' } },
        { type: 'location', row: 1, col: 1, colSpan: 1, data: { name: 'Место проведения' } },
        { type: 'timing', row: 2, col: 0, colSpan: 2, data: { end: dt } },
        { type: 'divider', row: 3, col: 0, colSpan: 2, data: { style: 'dots' } },
        {
          type: 'quote', row: 4, col: 0, colSpan: 2,
          data: { text: 'Самый лучший день — это тот, когда рядом любимые люди.' },
        },
        { type: 'divider', row: 5, col: 0, colSpan: 2, data: { style: 'line' } },
        { type: 'contact', row: 6, col: 0, colSpan: 1, data: { name: 'Организатор', role: 'Контакт', telegram: '' } },
      ]
    },
  },
  {
    id: 'wedding',
    label: 'Свадьба',
    category: 'Свадьба',
    emoji: '💍',
    colorScheme: 'sand',
    accentColor: '#d97706',
    gradientFrom: '#fffbeb',
    description: 'Дата, место, программа, контакты пары',
    buildBlocks: (title, date) => {
      const dt = toLocalIso(date)
      return [
        {
          type: 'text', row: 0, col: 0, colSpan: 2,
          data: { html: `<p>Дорогие гости! 💍 Приглашаем вас разделить с нами этот особенный день — <strong>${title}</strong>. Нам важно, что вы будете рядом 🤍</p>` },
        },
        { type: 'date', row: 1, col: 0, colSpan: 1, data: { datetime: dt, label: 'День свадьбы' } },
        { type: 'location', row: 1, col: 1, colSpan: 1, data: { name: 'Место проведения' } },
        { type: 'timing', row: 2, col: 0, colSpan: 2, data: { end: dt } },
        { type: 'divider', row: 3, col: 0, colSpan: 2, data: { style: 'dots' } },
        {
          type: 'agenda', row: 4, col: 0, colSpan: 2,
          data: {
            items: [
              { time: '15:00', text: 'Сбор гостей' },
              { time: '16:00', text: 'Торжественная церемония' },
              { time: '17:00', text: 'Фуршет и фотосессия' },
              { time: '18:00', text: 'Праздничный банкет 🥂' },
            ],
          },
        },
        { type: 'divider', row: 5, col: 0, colSpan: 2, data: { style: 'line' } },
        { type: 'contact', row: 6, col: 0, colSpan: 1, data: { name: 'Жених', role: 'Организатор', telegram: '' } },
        { type: 'contact', row: 6, col: 1, colSpan: 1, data: { name: 'Невеста', role: 'Организатор', telegram: '' } },
      ]
    },
  },
]
```

- [ ] **Step 2: Verify lint passes**

```bash
pnpm lint
```

Expected: no errors related to `content/templates/index.ts`.

- [ ] **Step 3: Commit**

```bash
git add content/templates/index.ts
git commit -m "feat: add wishlist template definitions"
```

---

### Task 2: Template card component

**Files:**
- Create: `app/wishlist/create/components/template-card.tsx`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p app/wishlist/create/components
```

```tsx
// app/wishlist/create/components/template-card.tsx
'use client'

import * as React from 'react'
import { WishlistTemplate } from '@/content/templates'

type Props = {
  template: WishlistTemplate
  onClick: (template: WishlistTemplate) => void
}

export function TemplateCard({ template, onClick }: Props) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer transition-transform duration-150"
      style={{
        boxShadow: hovered
          ? `0 6px 16px ${template.accentColor}40`
          : '0 1px 4px rgba(0,0,0,0.08)',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(template)}
    >
      <div
        className="px-4 pt-5 pb-3.5 text-center"
        style={{
          background: `linear-gradient(135deg, ${template.gradientFrom}, ${template.accentColor})`,
        }}
      >
        <div className="text-4xl mb-1">{template.emoji}</div>
        <div className="text-[10px] uppercase tracking-widest font-semibold text-white/90 drop-shadow-sm">
          {template.category}
        </div>
      </div>
      <div
        className="bg-white px-3.5 py-3"
        style={{ borderTop: `2px solid ${template.accentColor}` }}
      >
        <div className="font-bold text-sm mb-0.5">{template.label}</div>
        <div className="text-xs text-muted-foreground leading-relaxed">{template.description}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify lint**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/create/components/template-card.tsx
git commit -m "feat: add TemplateCard component"
```

---

### Task 3: Template dialog component

**Files:**
- Create: `app/wishlist/create/components/template-dialog.tsx`

Note: The existing `DatePicker` component (`app/wishlist/components/date-picker.tsx`) wraps itself in `FormItem`/`FormLabel`/`FormMessage` with a hardcoded Russian label. We inline a Calendar+Popover directly to keep the dialog self-contained.

- [ ] **Step 1: Create the file**

```tsx
// app/wishlist/create/components/template-dialog.tsx
'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { WishlistTemplate } from '@/content/templates'

const schema = z.object({
  title: z.string().min(1, { message: 'Название обязательно' }),
})

type FormData = z.infer<typeof schema>

type Props = {
  template: WishlistTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (template: WishlistTemplate, title: string, date?: Date) => void
  isPending: boolean
}

export function TemplateDialog({ template, open, onOpenChange, onSubmit, isPending }: Props) {
  const [date, setDate] = React.useState<Date | undefined>()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '' },
  })

  React.useEffect(() => {
    if (!open) {
      form.reset()
      setDate(undefined)
    }
  }, [open, form])

  const handleSubmit = (data: FormData) => {
    if (!template) return
    onSubmit(template, data.title, date)
  }

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${template.gradientFrom}, ${template.accentColor})`,
              }}
            >
              {template.emoji}
            </div>
            <DialogTitle>{template.label}</DialogTitle>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название вишлиста</FormLabel>
                  <FormControl>
                    <Input placeholder="День рождения Маши" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Дата события
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    type="button"
                    className={cn(
                      'w-full pl-3 text-left font-normal',
                      !date && 'text-muted-foreground',
                    )}
                  >
                    {date ? format(date, 'PPP', { locale: ru }) : <span>Выбери дату</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    locale={ru}
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-[2] text-white"
                style={{ background: template.accentColor }}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Создать вишлист
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Verify lint**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/create/components/template-dialog.tsx
git commit -m "feat: add TemplateDialog component"
```

---

### Task 4: Create page

**Files:**
- Create: `app/wishlist/create/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
// app/wishlist/create/page.tsx
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useApiCreateConstructorWishlist } from '@/api/wishlist'
import { templates, WishlistTemplate } from '@/content/templates'
import { TemplateCard } from './components/template-card'
import { TemplateDialog } from './components/template-dialog'

export default function Page() {
  const router = useRouter()
  const { mutate: createWishlist, isPending } = useApiCreateConstructorWishlist()

  const [selectedTemplate, setSelectedTemplate] = React.useState<WishlistTemplate | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const handleTemplateClick = (template: WishlistTemplate) => {
    setSelectedTemplate(template)
    setDialogOpen(true)
  }

  const handleTemplateSubmit = (template: WishlistTemplate, title: string, date?: Date) => {
    createWishlist(
      {
        title,
        colorScheme: template.colorScheme,
        blocks: template.buildBlocks(title, date),
      },
      {
        onSuccess: (res) => {
          if (res.data?.id) {
            router.push(`/wishlist/edit/${res.data.id}`)
          }
        },
      },
    )
  }

  const handleEmpty = () => {
    createWishlist(
      { title: 'Новый вишлист', blocks: [] },
      {
        onSuccess: (res) => {
          if (res.data?.id) {
            router.push(`/wishlist/edit/${res.data.id}`)
          }
        },
      },
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors"
      >
        <ChevronLeft size={16} />
        Назад
      </button>

      <h2 className="text-4xl mb-2">Создать вишлист</h2>
      <p className="text-muted-foreground mb-8">
        Начни с шаблона — мы уже собрали структуру за тебя.
      </p>

      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
        Выбери шаблон
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} onClick={handleTemplateClick} />
        ))}
        <div className="rounded-2xl overflow-hidden opacity-60 cursor-default">
          <div className="bg-gradient-to-br from-muted to-muted/60 px-4 pt-5 pb-3.5 text-center">
            <div className="text-4xl mb-1 opacity-40">✨</div>
            <div className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
              Скоро
            </div>
          </div>
          <div className="bg-muted/30 px-3.5 py-3 border-t-2 border-muted">
            <div className="font-bold text-sm mb-0.5 text-muted-foreground">Больше шаблонов</div>
            <div className="text-xs text-muted-foreground/60">Новый год, юбилей…</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">или</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <button
        onClick={handleEmpty}
        disabled={isPending}
        className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-primary transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <Loader2 className="text-2xl animate-spin text-muted-foreground" size={24} />
        ) : (
          <span className="text-2xl">📋</span>
        )}
        <div>
          <div className="font-semibold text-sm">Пустой вишлист</div>
          <div className="text-xs text-muted-foreground">Начни с чистого листа, добавь блоки сам</div>
        </div>
      </button>

      <TemplateDialog
        template={selectedTemplate}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleTemplateSubmit}
        isPending={isPending}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify lint**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/create/page.tsx
git commit -m "feat: add /wishlist/create page"
```

---

### Task 5: Update wishlist page button

**Files:**
- Modify: `app/wishlist/page.tsx`

Current behaviour: кнопка «Создать вишлист» вызывает `createConstructor` напрямую.
New behaviour: кнопка делает `router.push('/wishlist/create')`.

- [ ] **Step 1: Rewrite the file**

Replace the full contents of `app/wishlist/page.tsx`:

```tsx
'use client'

import { useApiGetAllWishlists } from '@/api/wishlist'
import { WishlistCard } from '@/app/wishlist/components/wishlist-card'
import { Button } from '@/components/ui/button'
import { LayoutTemplate } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

export default function Page() {
  const { data } = useApiGetAllWishlists()
  const router = useRouter()
  const wishlists = data?.data ?? []

  const handleCreate = () => {
    router.push('/wishlist/create')
  }

  return (
    <div>
      <div className="flex flex-col gap-2 items-center justify-between mb-6 lg:flex-row">
        <h2 className="text-4xl">Мои вишлисты</h2>
        <Button onClick={handleCreate}>
          <LayoutTemplate className="mr-2" size={18} />
          Создать вишлист
        </Button>
      </div>

      {wishlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="text-6xl">🎁</div>
          <h3 className="text-xl font-semibold">Пока нет вишлистов</h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            Создай первый вишлист и поделись им с теми, кто хочет сделать тебе подарок
          </p>
          <Button onClick={handleCreate}>
            <LayoutTemplate className="mr-2" size={18} />
            Создать первый вишлист
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlists.map((wishlist) => (
            <WishlistCard key={wishlist.id} wishlist={wishlist} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify lint and build**

```bash
pnpm lint
```

Expected: no errors. The removed `useApiCreateConstructorWishlist` import should no longer appear.

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/page.tsx
git commit -m "feat: route create button to /wishlist/create"
```

---

## Self-Review

**Spec coverage:**
- ✅ Страница `/wishlist/create` с шаблонами — Task 4
- ✅ 5 шаблонов (birthday_boy, birthday_girl, birthday_man, birthday_woman, wedding) — Task 1
- ✅ Карточки с градиентом из цветов темы — Task 2
- ✅ «Скоро больше» disabled карточка — Task 4
- ✅ Разделитель «или» + «Пустой вишлист» — Task 4
- ✅ Dialog с заголовком только «Для неё» (без «День рождения ·») — Task 3
- ✅ Поля: Название + Дата — Task 3
- ✅ Кнопка «Создать вишлист» в акцентном цвете темы — Task 3
- ✅ `buildBlocks(title, date)` вшивает данные в блоки — Task 1
- ✅ `colorScheme` из шаблона передаётся при создании — Task 4
- ✅ Кнопка на `/wishlist` меняется на `router.push` — Task 5
- ✅ «Пустой вишлист» создаёт без шаблона — Task 4

**Placeholders:** нет.

**Type consistency:** `WishlistTemplate` определён в Task 1, импортируется в Tasks 2, 3, 4 — консистентно. `buildBlocks` возвращает `Block[]` — тип из `@/shared/types`, используется в Task 4 при передаче в `useApiCreateConstructorWishlist`.
