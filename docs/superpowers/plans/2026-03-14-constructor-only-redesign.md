# Constructor-Only Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Оставить конструктор единственным способом создания вишлистов, переработать UI карточек, вынести создание/редактирование подарков в модалку, упростить шаринг до нативного API.

**Architecture:** Удаляем legacy-страницы и компоненты, создаём `PresentModal` как единую точку входа для CRUD подарков, рефакторим `WishlistCard` под новый дизайн с заглушкой из цветовой схемы, упрощаем share до двух кнопок.

**Tech Stack:** Next.js 16 App Router, React, TanStack Query, shadcn/ui, react-hook-form + zod, Tailwind CSS, lucide-react

**Spec:** `docs/superpowers/specs/2026-03-14-wishlist-constructor-only-redesign.md`

---

## Chunk 1: Удаление legacy-файлов и упрощение edit-страницы

### Task 1: Удалить legacy-файлы

**Files:**
- Delete: `app/wishlist/create/page.tsx`
- Delete: `app/wishlist/components/create-form.tsx`
- Delete: `app/wishlist/[id]/present/create/page.tsx`
- Delete: `app/wishlist/[id]/present/edit/[presentId]/page.tsx`
- Delete: `app/[userId]/[wishlistId]/page.tsx`
- Delete: `components/share-sheet.tsx`
- Delete: `app/wishlist/[id]/components/share-buttons.tsx`

- [ ] **Step 1: Удалить файлы**

```bash
rm "app/wishlist/create/page.tsx"
rm "app/wishlist/components/create-form.tsx"
rm -r "app/wishlist/[id]/present/create"
rm -r "app/wishlist/[id]/present/edit"
rm -r "app/[userId]"
rm "components/share-sheet.tsx"
rm "app/wishlist/[id]/components/share-buttons.tsx"
```

- [ ] **Step 2: Проверить что нет других импортов удалённых файлов**

```bash
pnpm grep -r "create-form\|share-sheet\|share-buttons\|userId.*wishlistId" --include="*.tsx" --include="*.ts" .
```

Ожидаем: только вхождения в файлах которые мы будем менять в следующих задачах (`wishlist-card.tsx`, `edit/[id]/page.tsx`).

- [ ] **Step 3: Проверить сборку**

```bash
pnpm build
```

Ожидаем: ошибки только на импорты из удалённых файлов (которые исправим в следующих задачах).

---

### Task 2: Упростить `edit/[id]/page.tsx`

**Files:**
- Modify: `app/wishlist/edit/[id]/page.tsx`

- [ ] **Step 1: Убрать проверку `isConstructor`, всегда рендерить `ConstructorEditor`**

Заменить весь файл:

```tsx
'use client'

import { useApiGetWishlistById } from '@/api/wishlist'
import { ConstructorEditor } from '@/app/wishlist/components/constructor-editor'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { useParams } from 'next/navigation'
import * as React from 'react'

export default function Page() {
  const { id } = useParams()
  const { data } = useApiGetWishlistById(id as string)
  const wishlist = data?.data

  if (!wishlist) {
    return null
  }

  return (
    <>
      <Breadcrumbs
        items={[{ name: 'Мои вишлисты', url: '/wishlist' }]}
        page={wishlist.title}
      />
      <ConstructorEditor wishlist={wishlist} />
    </>
  )
}
```

- [ ] **Step 2: Проверить lint**

```bash
pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/edit/[id]/page.tsx
git commit -m "refactor: remove legacy wishlist creation flow and old URL route"
```

---

## Chunk 2: Рефактор share-button и обновление wishlist list страницы

### Task 3: Рефактор `components/share-button.tsx`

**Files:**
- Modify: `components/share-button.tsx`

Превращаем в компонент с двумя кнопками: «Поделиться» и «Скопировать ссылку».

- [ ] **Step 1: Переписать компонент**

```tsx
'use client'

import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Copy, Share2 } from 'lucide-react'
import React from 'react'

type Props = {
  title: string
  url: string
  className?: string
}

export function ShareButtons({ title, url, className }: Props) {
  const { toast } = useToast()

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {
        // пользователь отменил — ничего не делаем
      }
    } else {
      await copyToClipboard()
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: 'Ссылка скопирована' })
    } catch {
      toast({ title: 'Не удалось скопировать', variant: 'destructive' })
    }
  }

  return (
    <div className={className}>
      <Button variant="outline" size="sm" onClick={handleShare}>
        <Share2 size={14} className="mr-1.5" />
        Поделиться
      </Button>
      <Button variant="ghost" size="sm" onClick={copyToClipboard}>
        <Copy size={14} className="mr-1.5" />
        Скопировать
      </Button>
    </div>
  )
}

export default ShareButtons
```

- [ ] **Step 2: Проверить lint**

```bash
pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add components/share-button.tsx
git commit -m "refactor: simplify share to native share API + copy button"
```

---

### Task 4: Обновить страницу списка вишлистов

**Files:**
- Modify: `app/wishlist/page.tsx`

- [ ] **Step 1: Убрать кнопку «Обычный вишлист», добавить пустое состояние, сетку**

```tsx
'use client'

import { useApiCreateConstructorWishlist, useApiGetAllWishlists } from '@/api/wishlist'
import { WishlistCard } from '@/app/wishlist/components/wishlist-card'
import { Button } from '@/components/ui/button'
import { LayoutTemplate, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

export default function Page() {
  const { data } = useApiGetAllWishlists()
  const { mutate: createConstructor, isPending } = useApiCreateConstructorWishlist()
  const router = useRouter()
  const wishlists = data?.data ?? []

  const handleCreate = () => {
    createConstructor(
      { title: 'Новый вишлист', blocks: [] },
      {
        onSuccess: (res) => {
          if (res.data?.id) {
            router.push(`/wishlist/edit/${res.data.id}`)
          }
        },
      }
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-4xl">Мои вишлисты</h2>
        <Button onClick={handleCreate} disabled={isPending}>
          {isPending ? (
            <Loader2 className="mr-2 animate-spin" size={18} />
          ) : (
            <LayoutTemplate className="mr-2" size={18} />
          )}
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
          <Button onClick={handleCreate} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 animate-spin" size={18} /> : null}
            Создать первый вишлист
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlists.map((wishlist) => (
            <WishlistCard key={wishlist.id} wishlist={wishlist} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Lint**

```bash
pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/page.tsx
git commit -m "feat: update wishlist list page — single create button, empty state, grid layout"
```

---

## Chunk 3: Редизайн WishlistCard

### Task 5: Переписать `WishlistCard`

**Files:**
- Modify: `app/wishlist/components/wishlist-card.tsx`

Новый дизайн: компактная карточка с обложкой сверху, заглушка на основе цветовой схемы, кнопки «Поделиться» + «Открыть».

- [ ] **Step 1: Переписать компонент**

```tsx
'use client'

import { WishlistMenu } from '@/app/wishlist/[id]/components/wishlist-menu'
import { ShareButtons } from '@/components/share-button'
import { Button } from '@/components/ui/button'
import { colorSchema } from '@/shared/constants'
import { Wishlist } from '@/shared/types'
import { toDate } from 'date-fns'
import { ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import * as React from 'react'

interface WishlistCardProps {
  wishlist: Wishlist
}

function WishlistCoverPlaceholder({ colorScheme }: { colorScheme: string }) {
  const scheme = colorSchema.find((s) => s.value === colorScheme) ?? colorSchema[0]
  const [bg, accent] = scheme.colors
  return (
    <div
      className="w-full h-[110px] rounded-t-xl"
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

export const WishlistCard = ({ wishlist }: WishlistCardProps) => {
  const router = useRouter()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const shareUrl = wishlist.shortId ? `${appUrl}/s/${wishlist.shortId}` : ''

  return (
    <div className="group relative border text-card-foreground rounded-xl shadow hover:shadow-md transition-shadow bg-card flex flex-col">
      {/* Обложка */}
      {wishlist.cover ? (
        <div className="relative h-[110px] rounded-t-xl overflow-hidden">
          <Image
            src={wishlist.cover}
            alt={wishlist.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>
      ) : (
        <WishlistCoverPlaceholder colorScheme={wishlist.settings.colorScheme} />
      )}

      {/* Контент */}
      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-1 mb-1">
          <h3 className="text-sm font-semibold line-clamp-2 leading-snug flex-1">
            {wishlist.title}
          </h3>
          <WishlistMenu wishlist={wishlist} />
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          {wishlist.presentsCount} подарков
          {wishlist.location.time && (
            <> · {toDate(wishlist.location.time).toLocaleDateString('ru-RU')}</>
          )}
        </p>

        <div className="flex gap-1.5 mt-auto">
          {shareUrl && (
            <ShareButtons
              title={wishlist.title}
              url={shareUrl}
              className="flex gap-1"
            />
          )}
          <Button
            size="sm"
            className="flex-1"
            onClick={() => router.push(`/wishlist/edit/${wishlist.id}`)}
          >
            <ExternalLink size={13} className="mr-1" />
            Открыть
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Lint**

```bash
pnpm lint
```

- [ ] **Step 3: Проверить визуально в браузере**

```bash
pnpm dev
```

Открыть `/wishlist`, убедиться:
- Карточки отображаются в сетке
- Без обложки — точечный паттерн с цветами схемы вишлиста
- Кнопки «Поделиться» и «Скопировать» работают
- Кнопка «Открыть» ведёт в конструктор

- [ ] **Step 4: Commit**

```bash
git add app/wishlist/components/wishlist-card.tsx
git commit -m "feat: redesign WishlistCard — compact grid, scheme placeholder, share buttons"
```

---

## Chunk 4: Модалка создания/редактирования подарка

### Task 6: Создать `PresentModal`

**Files:**
- Create: `app/wishlist/components/present-modal.tsx`

- [ ] **Step 1: Создать компонент**

```tsx
'use client'

import { useApiCreatePresent, useApiEditPresent } from '@/api/present'
import { ImageUpload, ImageUploadValue } from '@/components/image-upload'
import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Present } from '@/shared/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const FormSchema = z.object({
  title: z.string().min(1, { message: 'Название обязательно' }),
  description: z.string().optional(),
  link: z
    .string()
    .refine(
      (v) => v === '' || z.string().url().safeParse(v).success,
      { message: 'Некорректный URL' }
    )
    .optional(),
  price: z
    .string()
    .refine((v) => v === '' || !isNaN(parseFloat(v ?? '')), { message: 'Значение не число' })
    .optional(),
  coverUrl: z.string().optional(),
})

type FormValues = z.infer<typeof FormSchema>

type Props = {
  wishlistId: string
  present?: Present
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PresentModal({ wishlistId, present, open, onOpenChange }: Props) {
  const isEdit = !!present
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { mutate: createMutate, isPending: createPending } = useApiCreatePresent(wishlistId)
  const { mutate: editMutate, isPending: editPending } = useApiEditPresent(wishlistId)
  const isPending = createPending || editPending

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: present?.title ?? '',
      description: present?.description ?? '',
      link: present?.link ?? '',
      price: present?.price != null ? String(present.price) : '',
      coverUrl: present?.cover ?? '',
    },
  })

  // Сбрасываем форму при открытии/смене подарка
  React.useEffect(() => {
    if (open) {
      form.reset({
        title: present?.title ?? '',
        description: present?.description ?? '',
        link: present?.link ?? '',
        price: present?.price != null ? String(present.price) : '',
        coverUrl: present?.cover ?? '',
      })
    }
  }, [open, present, form])

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['presents', wishlistId] })
    onOpenChange(false)
  }

  async function onSubmit(data: FormValues) {
    const formData = new FormData()
    formData.append('title', data.title)
    if (data.description) formData.append('description', data.description)
    if (data.link) formData.append('link', data.link)
    if (data.price) formData.append('price', data.price)
    if (data.coverUrl) formData.append('cover_url', data.coverUrl)

    if (isEdit && present) {
      editMutate({ data: formData, id: present.id }, { onSuccess })
    } else {
      createMutate(formData, { onSuccess })
    }
  }

  const handleParserClick = () => {
    toast({ title: 'Скоро появится 🚀', description: 'Автозаполнение с маркетплейсов в разработке' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать подарок' : 'Новый подарок'}</DialogTitle>
        </DialogHeader>

        {/* Парсер ссылки */}
        <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Заполнить с маркетплейса
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Вставить ссылку с Ozon, Wildberries, Яндекс Маркет..."
              className="text-xs h-8"
              readOnly
              onClick={handleParserClick}
            />
            <Button
              size="sm"
              variant="secondary"
              type="button"
              onClick={handleParserClick}
              className="shrink-0 h-8 text-xs"
            >
              <ExternalLink size={12} className="mr-1" />
              Найти
            </Button>
          </div>
          <div className="flex gap-1.5">
            {['Ozon', 'Wildberries', 'Яндекс Маркет'].map((store) => (
              <span
                key={store}
                className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium"
              >
                {store}
              </span>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 my-1">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">или заполни вручную</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Форма */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="coverUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ImageUpload
                      previewUrl={field.value}
                      onChange={(val: ImageUploadValue | null) => {
                        field.onChange(val?.type === 'url' ? val.value : undefined)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input placeholder="Название подарка" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Цена, ₽</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        value={field.value ?? ''}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ссылка</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Описание подарка"
                      className="resize-none h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isPending || !form.watch('title')}
                loading={isPending}
              >
                {isEdit ? 'Сохранить' : 'Добавить'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Lint**

```bash
pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/components/present-modal.tsx
git commit -m "feat: add PresentModal component with marketplace parser placeholder"
```

---

### Task 7: Подключить `PresentModal` в конструктор

**Files:**
- Modify: `app/wishlist/components/constructor-editor.tsx`
- Modify: `app/wishlist/[id]/present/components/present-menu.tsx`
- Modify: `app/wishlist/[id]/present/components/present-card.tsx`

- [ ] **Step 1: Обновить `constructor-editor.tsx` — заменить `PlusCard` на кнопку, открывающую модалку**

```tsx
'use client'

import { useApiUpdateWishlistBlocks } from '@/api/wishlist'
import { useApiGetAllPresents } from '@/api/present'
import { BlockCanvas } from '@/app/wishlist/components/constructor/block-canvas'
import { ConstructorHeader } from '@/app/wishlist/components/constructor/constructor-header'
import { CoverSection } from '@/app/wishlist/components/constructor/cover-section'
import { WishlistLanding } from '@/app/s/[shortId]/components/wishlist-landing'
import { PresentCard } from '@/app/wishlist/[id]/present/components/present-card'
import { PresentModal } from '@/app/wishlist/components/present-modal'
import { Button } from '@/components/ui/button'
import { Block, Wishlist } from '@/shared/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import React from 'react'
import { useToast } from '@/hooks/use-toast'
import { Eye, Pencil, Gift, Plus } from 'lucide-react'

type Props = {
  wishlist: Wishlist
}

type Mode = 'editor' | 'preview' | 'presents'

export function ConstructorEditor({ wishlist }: Props) {
  const { mutate } = useApiUpdateWishlistBlocks(wishlist.id)
  const { toast } = useToast()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mode, setMode] = useState<Mode>('editor')
  const [presentModalOpen, setPresentModalOpen] = useState(false)

  const { data: presentsData } = useApiGetAllPresents(wishlist.id)
  const presents = presentsData?.data ?? []

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  const handleBlocksChange = useCallback(
    (blocks: Block[]) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        mutate(blocks, {
          onError: () => {
            toast({ title: 'Ошибка сохранения блоков', variant: 'destructive' })
          },
        })
      }, 500)
    },
    [mutate, toast]
  )

  const tabClass = (tab: Mode) =>
    `flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      mode === tab
        ? 'bg-primary text-primary-foreground'
        : 'bg-muted text-muted-foreground hover:bg-accent'
    }`

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setMode('editor')} className={tabClass('editor')}>
          <Pencil size={14} /> Редактор
        </button>
        <button type="button" onClick={() => setMode('preview')} className={tabClass('preview')}>
          <Eye size={14} /> Превью
        </button>
        <button type="button" onClick={() => setMode('presents')} className={tabClass('presents')}>
          <Gift size={14} /> Подарки
          {presents.length > 0 && (
            <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
              {presents.length}
            </span>
          )}
        </button>
      </div>

      {mode === 'editor' && (
        <div className="space-y-6">
          <ConstructorHeader wishlist={wishlist} />
          <CoverSection wishlist={wishlist} />
          <BlockCanvas
            initialBlocks={wishlist.blocks ?? []}
            onBlocksChange={handleBlocksChange}
          />
        </div>
      )}

      {mode === 'preview' && (
        <div className="rounded-xl border overflow-hidden">
          <WishlistLanding wishlist={wishlist} presents={presents} isMyWishlist={false} disableBodyTheme />
        </div>
      )}

      {mode === 'presents' && (
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={() => setPresentModalOpen(true)}
          >
            <Plus size={16} className="mr-2" />
            Добавить подарок
          </Button>
          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap">
            {presents.map((present) => (
              <PresentCard
                key={present.id}
                present={present}
                wishlistId={wishlist.id}
              />
            ))}
          </div>
          {presents.length === 0 && (
            <p className="text-muted-foreground text-sm">Подарков пока нет. Добавь первый!</p>
          )}
        </div>
      )}

      <PresentModal
        wishlistId={wishlist.id}
        open={presentModalOpen}
        onOpenChange={setPresentModalOpen}
      />
    </div>
  )
}
```

- [ ] **Step 2: Обновить `present-menu.tsx` — «Редактировать» открывает модалку**

`PresentMenu` теперь принимает `onEdit` колбэк вместо навигации:

```tsx
import { useApiDeletePresent } from '@/api/present'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Ellipsis } from 'lucide-react'
import * as React from 'react'

type MenuProps = {
  id: string
  wishlistId: string
  onEdit: () => void
}

export const PresentMenu = ({ id, wishlistId, onEdit }: MenuProps) => {
  const { mutate } = useApiDeletePresent(id, wishlistId)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Ellipsis />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={onEdit}>
          Редактировать
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => mutate()}>
          Удалить
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 3: Обновить `present-card.tsx` — передавать `onEdit`, открывать модалку**

```tsx
'use client'

import { PresentMenu } from '@/app/wishlist/[id]/present/components/present-menu'
import { PresentModal } from '@/app/wishlist/components/present-modal'
import { CardCover } from '@/components/card-cover'
import { Present } from '@/shared/types'
import { Heart } from 'lucide-react'
import * as React from 'react'

type Props = {
  present: Present
  wishlistId: string
}

export const PresentCard = ({ present, wishlistId }: Props) => {
  const [editOpen, setEditOpen] = React.useState(false)

  return (
    <>
      <div className="relative w-full md:w-[250px] bg-accent flex flex-col rounded-2xl shadow hover:shadow-xl transition">
        {present.cover ? (
          <CardCover className="h-[180px]" cover={present.cover} title={present.title} />
        ) : (
          <div className="flex justify-center items-center bg-primary w-full h-[180px] rounded-t-2xl">
            <Heart size={50} />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="font-bold mb-2 truncate">{present.title}</div>
            <PresentMenu
              id={present.id}
              wishlistId={wishlistId}
              onEdit={() => setEditOpen(true)}
            />
          </div>
          {present.description && (
            <div className="truncate text-sm text-muted-foreground">{present.description}</div>
          )}
        </div>
      </div>

      <PresentModal
        wishlistId={wishlistId}
        present={present}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}
```

- [ ] **Step 4: Lint**

```bash
pnpm lint
```

- [ ] **Step 5: Проверить визуально**

```bash
pnpm dev
```

Открыть конструктор любого вишлиста, вкладка «Подарки»:
- Кнопка «Добавить подарок» открывает модалку
- После добавления: остаёмся на вкладке, подарок появляется в списке
- Меню «Редактировать» на карточке открывает модалку с заполненными полями
- После сохранения: модалка закрывается, данные обновились
- Меню «Удалить» работает
- Парсер ссылок: клик по полю или кнопке «Найти» — toast «Скоро появится»

- [ ] **Step 6: Проверить сборку**

```bash
pnpm build
```

- [ ] **Step 7: Commit**

```bash
git add app/wishlist/components/constructor-editor.tsx \
        app/wishlist/[id]/present/components/present-menu.tsx \
        app/wishlist/[id]/present/components/present-card.tsx
git commit -m "feat: wire PresentModal into constructor, replace page navigation with modal"
```

---

## Chunk 5: Финальная проверка

### Task 8: Проверить что всё удалено и ничего не сломано

- [ ] **Step 1: Убедиться что нет ссылок на удалённые страницы**

```bash
grep -r "present/create\|present/edit\|wishlist/create\|share-sheet\|ShareSheet\|userId.*wishlistId" \
  app/ components/ --include="*.tsx" --include="*.ts"
```

Ожидаем: пусто.

- [ ] **Step 2: Финальная сборка**

```bash
pnpm build
```

Ожидаем: успешная сборка без ошибок.

- [ ] **Step 3: Проверить ключевые сценарии в браузере**

```bash
pnpm dev
```

Чеклист:
- [ ] `/wishlist` — одна кнопка «Создать вишлист», сетка карточек, пустое состояние если нет вишлистов
- [ ] Создание вишлиста → редирект в конструктор
- [ ] Карточка без обложки — точечный паттерн с цветами схемы
- [ ] Кнопки «Поделиться» и «Скопировать» на карточке работают
- [ ] Кнопка «Открыть» ведёт в конструктор
- [ ] Конструктор, вкладка «Подарки» — кнопка добавления, модалка, список
- [ ] Создание подарка через модалку — остаёмся на вкладке «Подарки»
- [ ] Редактирование подарка через меню — модалка заполнена
- [ ] Удаление подарка работает
- [ ] `/wishlist/create` — 404 (страница удалена)
- [ ] Старые URL `/[userId]/[wishlistId]` — 404

- [ ] **Step 4: Финальный commit**

```bash
git add -A
git commit -m "chore: final cleanup and verification of constructor-only redesign"
```
