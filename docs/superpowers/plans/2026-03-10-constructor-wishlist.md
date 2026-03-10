# Constructor Wishlist Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a drag-and-drop block constructor as a second wishlist creation mode, short public links (`/s/:shortId`), and dual file/URL image upload.

**Architecture:** Separate routes for constructor (`/wishlist/create-constructor`) keep the old flow untouched. Edit page auto-detects wishlist type via `blocks` field. Public view renders blocks above presents when present. Short link route `/s/[shortId]` fetches by short ID and reuses the same public view component.

**Tech Stack:** Next.js 16 App Router, @dnd-kit/core + @dnd-kit/sortable, react-hook-form + zod, TanStack Query, shadcn/ui, Tailwind CSS

---

## Chunk 1: Foundation — Types, API, Dependencies

### Task 1: Install @dnd-kit

**Files:**
- Modify: `package.json` (via pnpm)

- [ ] **Step 1: Install packages**

```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Expected: packages added to `package.json` and `pnpm-lock.yaml`

- [ ] **Step 2: Verify lint passes**

```bash
pnpm lint
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: install @dnd-kit packages for constructor DnD"
```

---

### Task 2: Update shared types

**Files:**
- Modify: `shared/types.ts`

- [ ] **Step 1: Add Block types and update Wishlist**

Replace contents of `shared/types.ts`:

```typescript
export type User = {
  id: string;
  username: string;
}

export type BlockType =
  | 'text'
  | 'text_image'
  | 'image'
  | 'date'
  | 'location'
  | 'color_scheme'
  | 'timing'

export type Block = {
  type: BlockType
  position: number
  mobilePosition?: number
  data: Record<string, unknown>
}

// Block data shapes per type:
// text:         { content: string }
// text_image:   { content: string; imageUrl: string }
// image:        { url: string }
// date:         { datetime: string; label?: string }
// location:     { name: string; link?: string }
// color_scheme: { scheme: string }
// timing:       { start: string; end?: string }

export type Wishlist = {
  id: string;
  title: string;
  description: string;
  cover: string;
  presentsCount: number;
  userId: string
  settings: {
    colorScheme: string
    showGiftAvailability: boolean
  }
  location: {
    name: string,
    link?: string,
    time?: string
  }
  shortId?: string
  blocks?: Block[]
  createdAt: string,
  updatedAt: string,
}

export type Present = {
  id: string;
  title: string;
  description: string;
  cover: string;
  link?: string;
  price?: number;
  reserved: boolean;
  createdAt: string,
  updatedAt: string,
  wishlistId: string
}

export type AuthProps = {
  id: number
  first_name: string
  last_name: string
  username: string
  auth_date: number
  photo_url: string
  hash: string
}
```

- [ ] **Step 2: Verify lint passes**

```bash
pnpm lint
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add shared/types.ts
git commit -m "feat: add Block types and shortId to Wishlist"
```

---

### Task 3: Add new API hooks

**Files:**
- Modify: `api/wishlist/index.ts`

- [ ] **Step 1: Add three new hooks and update existing ones**

Replace contents of `api/wishlist/index.ts`:

```typescript
import api from '@/lib/api'
import { Block, Wishlist } from '@/shared/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

export const useApiGetAllWishlists = () => {
  return useQuery({
    queryKey: [ 'wishlists' ],
    queryFn: async () => api.get<{ data: Wishlist[] }>('wishlists'),
  })
}

export const useApiGetWishlistById = (id: string) => {
  return useQuery<{ data: Wishlist }>({
    queryKey: [ 'wishlist', id ],
    queryFn: async () => api.get<{ data: Wishlist }>(`wishlists/${id}`),
  })
}

export const useApiGetWishlistByShortId = (shortId: string) => {
  return useQuery<{ data: Wishlist }>({
    queryKey: [ 'wishlist-short', shortId ],
    queryFn: async () => api.get<{ data: Wishlist }>(`wishlists/s/${shortId}`),
    enabled: !!shortId,
  })
}

export const useApiCreateWishlist = () => {
  const queryClient = useQueryClient()
  return useMutation<{ data: Wishlist }, AxiosError, FormData>({
    mutationFn: async data => {
      return api.post('wishlists', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ 'wishlists' ] })
    },
  })
}

export const useApiEditWishlist = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation<{ data: Wishlist }, AxiosError, FormData>({
    mutationFn: async data => {
      return api.put(`wishlists/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ 'wishlists' ] })
      await queryClient.invalidateQueries({ queryKey: [ 'wishlist', id ] })
    },
  })
}

type CreateConstructorInput = {
  title: string
  description?: string
  coverUrl?: string
  colorScheme?: string
  showGiftAvailability?: boolean
  locationName?: string
  locationLink?: string
  locationTime?: string
  blocks?: Block[]
}

export const useApiCreateConstructorWishlist = () => {
  const queryClient = useQueryClient()
  return useMutation<{ data: Wishlist }, AxiosError, CreateConstructorInput>({
    mutationFn: async (input) => {
      return api.post('wishlists/constructor', {
        title: input.title,
        description: input.description ?? '',
        cover_url: input.coverUrl ?? '',
        color_scheme: input.colorScheme ?? 'main',
        show_gift_availability: input.showGiftAvailability ?? false,
        location_name: input.locationName ?? '',
        location_link: input.locationLink ?? '',
        location_time: input.locationTime ?? '',
        blocks: input.blocks ?? [],
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ 'wishlists' ] })
    },
  })
}

export const useApiUpdateWishlistBlocks = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation<{ data: Wishlist }, AxiosError, Block[]>({
    mutationFn: async (blocks) => {
      return api.put(`wishlists/${id}/blocks`, blocks)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ 'wishlist', id ] })
    },
  })
}

export const useApiDeleteWishlist = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation<{ data: Wishlist }, AxiosError>({
    mutationFn: async () => {
      return api.delete(`wishlists/${id}`)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ 'wishlists' ] })
    },
  })
}
```

- [ ] **Step 2: Verify lint passes**

```bash
pnpm lint
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add api/wishlist/index.ts
git commit -m "feat: add constructor wishlist and short-id API hooks"
```

---

## Chunk 2: ImageUpload Component + Update Create Form

### Task 4: Create ImageUpload component

**Files:**
- Create: `components/image-upload.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/image-upload.tsx
'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UploadIcon } from 'lucide-react'
import React, { useRef, useState } from 'react'

export type ImageUploadValue =
  | { type: 'file'; value: File }
  | { type: 'url'; value: string }

type Props = {
  label?: string
  onChange: (value: ImageUploadValue | null) => void
  previewUrl?: string
}

export function ImageUpload({ label = 'Обложка', onChange, previewUrl }: Props) {
  const [preview, setPreview] = useState<string | undefined>(previewUrl)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file)
    setPreview(url)
    onChange({ type: 'file', value: file })
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleFile(file)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value.trim()
    if (url) {
      setPreview(url)
      onChange({ type: 'url', value: url })
    } else {
      setPreview(undefined)
      onChange(null)
    }
  }

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      {/* Preview */}
      {preview && (
        <div className="relative w-full h-40 rounded-lg overflow-hidden border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        <UploadIcon className="mx-auto mb-2 text-muted-foreground" size={24} />
        <p className="text-sm text-muted-foreground">Перетащи или нажми для выбора файла</p>
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG до 2MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              if (file.size > 2 * 1024 * 1024) {
                alert('Файл должен быть менее 2MB')
                return
              }
              handleFile(file)
            }
          }}
        />
      </div>

      {/* OR divider */}
      <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
        <span className="relative z-10 bg-background px-2 text-muted-foreground">или</span>
      </div>

      {/* URL input */}
      <Input
        placeholder="https://example.com/image.jpg"
        onChange={handleUrlChange}
        defaultValue={previewUrl && !previewUrl.startsWith('blob:') ? previewUrl : ''}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify lint passes**

```bash
pnpm lint
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/image-upload.tsx
git commit -m "feat: add ImageUpload component with file dropzone and URL input"
```

---

### Task 5: Update create-form to support cover_url

**Files:**
- Modify: `app/wishlist/components/create-form.tsx`

> **Notes on behavioral changes:**
> - `fileSchema` (which required cover on create, enforced 2MB limit) is removed from the Zod schema. Cover becomes optional on create. The 2MB limit is now enforced inside `ImageUpload` directly.
> - `createFileFromUrl` (which re-fetched the existing cover as a `File` on edit) is replaced with `cover_url` appended to FormData.

- [ ] **Step 0: Verify backend supports `cover_url` on regular PUT**

Open `C:\Users\nvsma\OneDrive\Документы\projects\wish-list-2-back\internal\controller\restapi\v1\wishlist.go` and check the `update` handler. Confirm it reads `cover_url` from the multipart form alongside `file`.

- If `cover_url` **is supported** → proceed with Step 1 as written.
- If `cover_url` **is NOT supported** → in the `onSubmit` function keep the `createFileFromUrl` fallback for the edit path instead of `formData.append('cover_url', wishlist.cover)`. Import `createFileFromUrl` from `@/lib/utils` and restore the async pattern from the original file.

- [ ] **Step 1: Replace file input with ImageUpload, add cover_url support**

Replace the entire contents of `app/wishlist/components/create-form.tsx`:

```typescript
'use client'

import { useApiCreateWishlist, useApiEditWishlist } from '@/api/wishlist'
import { ColorsSelect } from '@/app/wishlist/components/colors-select'
import { DatePicker } from '@/app/wishlist/components/date-picker'
import { ImageUpload, ImageUploadValue } from '@/components/image-upload'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Wishlist } from '@/shared/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const locationLink = z.string().refine(value => {
  if (!value) return true
  const regex = /^(https?:\/\/(go\.2gis\.com|2gis\.ru|yandex\.ru)\/[^\s]+)/
  return regex.test(value ?? '')
}, { message: 'Некорректная ссылка' }).optional()

type Props = {
  edit?: boolean
  wishlist?: Wishlist
}

export function CreateForm({ edit, wishlist }: Props) {
  const FormSchema = z.object({
    title: z.string().min(1, { message: 'Название обязательно' }),
    description: z.string(),
    settings: z.object({
      colorScheme: z.string(),
      showGiftAvailability: z.boolean(),
    }),
    location: z.object({
      name: z.string().optional(),
      link: locationLink,
      time: z.date().optional(),
    }).optional(),
  })

  const { mutate: createMutate } = useApiCreateWishlist()
  const { mutate: editMutate } = useApiEditWishlist(wishlist?.id ?? '')
  const navigation = useRouter()
  const [coverValue, setCoverValue] = useState<ImageUploadValue | null>(null)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: edit ? wishlist?.title : '',
      description: edit ? wishlist?.description : '',
      settings: {
        colorScheme: edit ? wishlist?.settings.colorScheme : 'main',
        showGiftAvailability: edit ? wishlist?.settings.showGiftAvailability : false,
      },
      location: {
        name: edit ? wishlist?.location.name : '',
        link: edit ? wishlist?.location.link : '',
        time: wishlist?.location.time ? new Date(wishlist.location.time) : undefined,
      },
    },
  })

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    const formData = new FormData()
    formData.append('title', data.title)
    if (data.description) formData.append('description', data.description)

    if (coverValue?.type === 'file') {
      formData.append('file', coverValue.value)
    } else if (coverValue?.type === 'url') {
      formData.append('cover_url', coverValue.value)
    } else if (edit && wishlist?.cover) {
      formData.append('cover_url', wishlist.cover)
    }

    formData.append('settings[colorScheme]', data.settings.colorScheme)
    formData.append('settings[showGiftAvailability]', String(data.settings.showGiftAvailability))
    formData.append('location[name]', data.location?.name ?? '')
    formData.append('location[link]', data.location?.link ?? '')
    if (data.location?.time) {
      formData.append('location[time]', data.location.time.toISOString())
    }

    if (edit && wishlist) {
      editMutate(formData, {
        onSuccess: () => navigation.push('/wishlist'),
      })
    } else {
      createMutate(formData, {
        onSuccess: () => navigation.push('/wishlist'),
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">Основная информация</span>
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название*</FormLabel>
              <FormControl>
                <Input placeholder="Мой день рождения" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">Дата и локация</span>
        </div>

        <FormField
          control={form.control}
          name="location.time"
          render={({ field }) => (
            <DatePicker value={field.value} onChange={field.onChange} />
          )}
        />
        <FormField
          control={form.control}
          name="location.name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Место проведения</FormLabel>
              <FormControl>
                <Input placeholder="Название места проведения" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location.link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ссылка на геопозицию</FormLabel>
              <FormControl>
                <Input placeholder="Ссылка на место в 2gis/Yandex" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">Детали праздника</span>
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Описание</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Что будет на празднике, программа развлечений и тд" className="resize-none h-[200px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ImageUpload
          label="Обложка"
          onChange={setCoverValue}
          previewUrl={edit ? wishlist?.cover : undefined}
        />

        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">Настройки</span>
        </div>

        <FormField
          control={form.control}
          name="settings.colorScheme"
          render={({ field }) => (
            <ColorsSelect value={field.value} onChange={field.onChange} />
          )}
        />
        <FormField
          control={form.control}
          name="settings.showGiftAvailability"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Видимость брони</FormLabel>
                <FormDescription>Если хотите видеть, что кто-то забронировал подарок</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} aria-readonly />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {edit ? 'Сохранить' : 'Создать'}
        </Button>
      </form>
    </Form>
  )
}
```

- [ ] **Step 2: Verify lint passes**

```bash
pnpm lint
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/components/create-form.tsx
git commit -m "feat: replace file input with ImageUpload in create-form, support cover_url"
```

---

## Chunk 3: Constructor Create Page

### Task 6: Constructor meta form (step 1)

**Files:**
- Create: `app/wishlist/components/constructor-meta-form.tsx`

- [ ] **Step 1: Create the meta form component**

```typescript
// app/wishlist/components/constructor-meta-form.tsx
'use client'

import { useApiCreateConstructorWishlist } from '@/api/wishlist'
import { ColorsSelect } from '@/app/wishlist/components/colors-select'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useToast } from '@/hooks/use-toast'

// NOTE: Constructor endpoint is JSON-only (not multipart), so cover is URL-only.
// File upload is intentionally not supported here.

const FormSchema = z.object({
  title: z.string().min(1, { message: 'Название обязательно' }),
  description: z.string(),
  coverUrl: z.string().url({ message: 'Некорректный URL' }).optional().or(z.literal('')),
  settings: z.object({
    colorScheme: z.string(),
    showGiftAvailability: z.boolean(),
  }),
})

export function ConstructorMetaForm() {
  const { mutate, isPending } = useApiCreateConstructorWishlist()
  const navigation = useRouter()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: '',
      description: '',
      coverUrl: '',
      settings: { colorScheme: 'main', showGiftAvailability: false },
    },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    mutate(
      {
        title: data.title,
        description: data.description,
        coverUrl: data.coverUrl || undefined,
        colorScheme: data.settings.colorScheme,
        showGiftAvailability: data.settings.showGiftAvailability,
        blocks: [],
      },
      {
        onSuccess: (res) => {
          navigation.push(`/wishlist/edit/${res.data.id}`)
        },
        onError: () => {
          toast({ title: 'Ошибка создания вишлиста', variant: 'destructive' })
        },
      }
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">Основная информация</span>
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название*</FormLabel>
              <FormControl>
                <Input placeholder="Мой день рождения" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Описание</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Расскажи о своём событии" className="resize-none h-[140px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="coverUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Обложка (ссылка на картинку)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/image.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="settings.colorScheme"
          render={({ field }) => (
            <ColorsSelect value={field.value} onChange={field.onChange} />
          )}
        />

        <FormField
          control={form.control}
          name="settings.showGiftAvailability"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Видимость брони</FormLabel>
                <FormDescription>Показывать забронированные подарки</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} aria-readonly />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Создаём...' : 'Далее → собрать блоки'}
        </Button>
      </form>
    </Form>
  )
}
```

- [ ] **Step 2: Verify lint passes**

```bash
pnpm lint
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/components/constructor-meta-form.tsx
git commit -m "feat: add constructor meta form (step 1)"
```

---

### Task 7: Constructor create page

**Files:**
- Create: `app/wishlist/create-constructor/page.tsx`

> **Auth note:** The existing `middleware.ts` already protects all `/wishlist/*` routes via `matcher: '/wishlist/:path*'`. The new `/wishlist/create-constructor` route is automatically protected — no middleware changes needed.

- [ ] **Step 1: Create the page**

```typescript
// app/wishlist/create-constructor/page.tsx
import { ConstructorMetaForm } from '@/app/wishlist/components/constructor-meta-form'
import * as React from 'react'

export default function Page() {
  return (
    <div>
      <h2 className="text-4xl mb-5">Конструктор вишлиста</h2>
      <p className="text-muted-foreground mb-8">
        Создай вишлист из блоков: добавь текст, фото, дату, место и многое другое.
      </p>
      <ConstructorMetaForm />
    </div>
  )
}
```

- [ ] **Step 2: Verify lint passes**

```bash
pnpm lint
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/create-constructor/page.tsx
git commit -m "feat: add constructor wishlist create page"
```

---

## Chunk 4: Block Editor Components

### Task 8: Block editor modal

**Files:**
- Create: `app/wishlist/components/constructor/block-editor-modal.tsx`
- Create: `app/wishlist/components/constructor/blocks/text-block-editor.tsx`
- Create: `app/wishlist/components/constructor/blocks/image-block-editor.tsx`
- Create: `app/wishlist/components/constructor/blocks/date-block-editor.tsx`
- Create: `app/wishlist/components/constructor/blocks/location-block-editor.tsx`
- Create: `app/wishlist/components/constructor/blocks/color-scheme-block-editor.tsx`
- Create: `app/wishlist/components/constructor/blocks/timing-block-editor.tsx`
- Create: `app/wishlist/components/constructor/blocks/text-image-block-editor.tsx`

- [ ] **Step 1: Create block editor modal**

```typescript
// app/wishlist/components/constructor/block-editor-modal.tsx
'use client'

import { ColorSchemeBlockEditor } from '@/app/wishlist/components/constructor/blocks/color-scheme-block-editor'
import { DateBlockEditor } from '@/app/wishlist/components/constructor/blocks/date-block-editor'
import { ImageBlockEditor } from '@/app/wishlist/components/constructor/blocks/image-block-editor'
import { LocationBlockEditor } from '@/app/wishlist/components/constructor/blocks/location-block-editor'
import { TextBlockEditor } from '@/app/wishlist/components/constructor/blocks/text-block-editor'
import { TextImageBlockEditor } from '@/app/wishlist/components/constructor/blocks/text-image-block-editor'
import { TimingBlockEditor } from '@/app/wishlist/components/constructor/blocks/timing-block-editor'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Block } from '@/shared/types'
import React, { useState } from 'react'

const BLOCK_LABELS: Record<string, string> = {
  text: 'Текст',
  text_image: 'Текст + картинка',
  image: 'Картинка',
  date: 'Дата',
  location: 'Место',
  color_scheme: 'Цветовая схема',
  timing: 'Таймер',
}

type Props = {
  block: Block
  open: boolean
  onClose: () => void
  onSave: (data: Record<string, unknown>) => void
}

export function BlockEditorModal({ block, open, onClose, onSave }: Props) {
  const [data, setData] = useState<Record<string, unknown>>(block.data)

  // Re-sync state when block data changes (e.g. modal reopened for an updated block)
  React.useEffect(() => {
    setData(block.data)
  }, [block])

  const handleSave = () => {
    onSave(data)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Редактировать: {BLOCK_LABELS[block.type] ?? block.type}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {block.type === 'text' && <TextBlockEditor data={data} onChange={setData} />}
          {block.type === 'text_image' && <TextImageBlockEditor data={data} onChange={setData} />}
          {block.type === 'image' && <ImageBlockEditor data={data} onChange={setData} />}
          {block.type === 'date' && <DateBlockEditor data={data} onChange={setData} />}
          {block.type === 'location' && <LocationBlockEditor data={data} onChange={setData} />}
          {block.type === 'color_scheme' && <ColorSchemeBlockEditor data={data} onChange={setData} />}
          {block.type === 'timing' && <TimingBlockEditor data={data} onChange={setData} />}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSave}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Create text block editor**

```typescript
// app/wishlist/components/constructor/blocks/text-block-editor.tsx
'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function TextBlockEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Label>Текст</Label>
      <Textarea
        className="resize-none h-32"
        placeholder="Введи текст..."
        value={(data.content as string) ?? ''}
        onChange={(e) => onChange({ ...data, content: e.target.value })}
      />
    </div>
  )
}
```

- [ ] **Step 3: Create image block editor**

```typescript
// app/wishlist/components/constructor/blocks/image-block-editor.tsx
'use client'

import { ImageUpload, ImageUploadValue } from '@/components/image-upload'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function ImageBlockEditor({ data, onChange }: Props) {
  const handleChange = (val: ImageUploadValue | null) => {
    if (val?.type === 'url') {
      onChange({ ...data, url: val.value })
    } else if (val?.type === 'file') {
      const url = URL.createObjectURL(val.value)
      onChange({ ...data, url })
    }
  }

  return (
    <ImageUpload
      label="Картинка"
      onChange={handleChange}
      previewUrl={data.url as string | undefined}
    />
  )
}
```

- [ ] **Step 4: Create date block editor**

```typescript
// app/wishlist/components/constructor/blocks/date-block-editor.tsx
'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function DateBlockEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Дата и время</Label>
        <Input
          type="datetime-local"
          value={(data.datetime as string) ?? ''}
          onChange={(e) => onChange({ ...data, datetime: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Подпись (необязательно)</Label>
        <Input
          placeholder="Например: Начало праздника"
          value={(data.label as string) ?? ''}
          onChange={(e) => onChange({ ...data, label: e.target.value })}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create location block editor**

```typescript
// app/wishlist/components/constructor/blocks/location-block-editor.tsx
'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function LocationBlockEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Название места</Label>
        <Input
          placeholder="Кафе «Уют»"
          value={(data.name as string) ?? ''}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Ссылка на карту (2GIS / Yandex)</Label>
        <Input
          placeholder="https://2gis.ru/..."
          value={(data.link as string) ?? ''}
          onChange={(e) => onChange({ ...data, link: e.target.value })}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create color_scheme block editor**

```typescript
// app/wishlist/components/constructor/blocks/color-scheme-block-editor.tsx
'use client'

import { ColorsSelect } from '@/app/wishlist/components/colors-select'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function ColorSchemeBlockEditor({ data, onChange }: Props) {
  return (
    <ColorsSelect
      value={(data.scheme as string) ?? 'main'}
      onChange={(scheme) => onChange({ ...data, scheme })}
    />
  )
}
```

- [ ] **Step 7: Create timing block editor**

```typescript
// app/wishlist/components/constructor/blocks/timing-block-editor.tsx
'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function TimingBlockEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Начало</Label>
        <Input
          type="datetime-local"
          value={(data.start as string) ?? ''}
          onChange={(e) => onChange({ ...data, start: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Конец (необязательно)</Label>
        <Input
          type="datetime-local"
          value={(data.end as string) ?? ''}
          onChange={(e) => onChange({ ...data, end: e.target.value })}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Create text_image block editor**

```typescript
// app/wishlist/components/constructor/blocks/text-image-block-editor.tsx
'use client'

import { ImageUpload, ImageUploadValue } from '@/components/image-upload'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function TextImageBlockEditor({ data, onChange }: Props) {
  const handleImage = (val: ImageUploadValue | null) => {
    if (val?.type === 'url') {
      onChange({ ...data, imageUrl: val.value })
    } else if (val?.type === 'file') {
      onChange({ ...data, imageUrl: URL.createObjectURL(val.value) })
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Текст</Label>
        <Textarea
          className="resize-none h-24"
          placeholder="Введи текст..."
          value={(data.content as string) ?? ''}
          onChange={(e) => onChange({ ...data, content: e.target.value })}
        />
      </div>
      <ImageUpload
        label="Картинка"
        onChange={handleImage}
        previewUrl={data.imageUrl as string | undefined}
      />
    </div>
  )
}
```

- [ ] **Step 9: Verify lint passes**

```bash
pnpm lint
```

Expected: no errors

- [ ] **Step 10: Commit**

```bash
git add app/wishlist/components/constructor/
git commit -m "feat: add block editor modal and all block editor components"
```

---

### Task 9: Block palette, canvas and item

**Files:**
- Create: `app/wishlist/components/constructor/block-palette.tsx`
- Create: `app/wishlist/components/constructor/block-item.tsx`
- Create: `app/wishlist/components/constructor/block-canvas.tsx`

- [ ] **Step 1: Create block palette**

```typescript
// app/wishlist/components/constructor/block-palette.tsx
'use client'

import { Block, BlockType } from '@/shared/types'
import { CalendarIcon, ImageIcon, MapPinIcon, PaletteIcon, TextIcon, TimerIcon, LayoutIcon } from 'lucide-react'
import React from 'react'

const PALETTE_ITEMS: { type: BlockType; label: string; icon: React.ReactNode }[] = [
  { type: 'text', label: 'Текст', icon: <TextIcon size={18} /> },
  { type: 'image', label: 'Картинка', icon: <ImageIcon size={18} /> },
  { type: 'text_image', label: 'Текст + фото', icon: <LayoutIcon size={18} /> },
  { type: 'date', label: 'Дата', icon: <CalendarIcon size={18} /> },
  { type: 'location', label: 'Место', icon: <MapPinIcon size={18} /> },
  { type: 'color_scheme', label: 'Цвет', icon: <PaletteIcon size={18} /> },
  { type: 'timing', label: 'Таймер', icon: <TimerIcon size={18} /> },
]

type Props = {
  onAdd: (block: Block) => void
  existingCount: number
}

export function BlockPalette({ onAdd, existingCount }: Props) {
  const handleAdd = (type: BlockType) => {
    onAdd({
      type,
      position: existingCount,
      data: {},
    })
  }

  return (
    <div className="w-56 shrink-0 space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Блоки</h3>
      {PALETTE_ITEMS.map((item) => (
        <button
          key={item.type}
          type="button"
          onClick={() => handleAdd(item.type)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium"
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create block item**

```typescript
// app/wishlist/components/constructor/block-item.tsx
'use client'

import { BlockEditorModal } from '@/app/wishlist/components/constructor/block-editor-modal'
import { Button } from '@/components/ui/button'
import { Block } from '@/shared/types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import React, { useState } from 'react'

const BLOCK_LABELS: Record<string, string> = {
  text: 'Текст',
  text_image: 'Текст + картинка',
  image: 'Картинка',
  date: 'Дата',
  location: 'Место',
  color_scheme: 'Цветовая схема',
  timing: 'Таймер',
}

type Props = {
  block: Block
  id: string
  onUpdate: (data: Record<string, unknown>) => void
  onDelete: () => void
}

export function BlockItem({ block, id, onUpdate, onDelete }: Props) {
  const [editOpen, setEditOpen] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const preview = getPreview(block)

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-3 p-3 rounded-lg border bg-card shadow-sm"
      >
        <button
          type="button"
          className="cursor-grab text-muted-foreground hover:text-foreground shrink-0"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {BLOCK_LABELS[block.type] ?? block.type}
          </p>
          <p className="text-sm truncate text-foreground">{preview}</p>
        </div>

        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)}>
            <Pencil size={14} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <BlockEditorModal
        block={block}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={onUpdate}
      />
    </>
  )
}

function getPreview(block: Block): string {
  const d = block.data
  switch (block.type) {
    case 'text': return (d.content as string) || 'Нет текста'
    case 'text_image': return (d.content as string) || 'Текст + картинка'
    case 'image': return (d.url as string) ? 'Картинка загружена' : 'Нет картинки'
    case 'date': return (d.datetime as string) || 'Дата не указана'
    case 'location': return (d.name as string) || 'Место не указано'
    case 'color_scheme': return (d.scheme as string) || 'main'
    case 'timing': return (d.start as string) || 'Время не указано'
    default: return ''
  }
}
```

- [ ] **Step 3: Create block canvas**

```typescript
// app/wishlist/components/constructor/block-canvas.tsx
'use client'

import { BlockItem } from '@/app/wishlist/components/constructor/block-item'
import { BlockPalette } from '@/app/wishlist/components/constructor/block-palette'
import { Block } from '@/shared/types'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import React, { useCallback, useState } from 'react'

type Props = {
  initialBlocks: Block[]
  onBlocksChange: (blocks: Block[]) => void
}

export function BlockCanvas({ initialBlocks, onBlocksChange }: Props) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks)

  const sensors = useSensors(useSensor(PointerSensor))

  const syncBlocks = useCallback(
    (next: Block[]) => {
      const normalized = next.map((b, i) => ({ ...b, position: i }))
      setBlocks(normalized)
      onBlocksChange(normalized)
    },
    [onBlocksChange]
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b, i) => String(i) === active.id)
      const newIndex = blocks.findIndex((b, i) => String(i) === over.id)
      syncBlocks(arrayMove(blocks, oldIndex, newIndex))
    }
  }

  const handleAdd = (block: Block) => {
    syncBlocks([...blocks, block])
  }

  const handleUpdate = (index: number, data: Record<string, unknown>) => {
    const next = blocks.map((b, i) => (i === index ? { ...b, data } : b))
    syncBlocks(next)
  }

  const handleDelete = (index: number) => {
    syncBlocks(blocks.filter((_, i) => i !== index))
  }

  const ids = blocks.map((_, i) => String(i))

  return (
    <div className="flex gap-6 items-start">
      <BlockPalette onAdd={handleAdd} existingCount={blocks.length} />

      <div className="flex-1 space-y-3 min-h-[200px]">
        {blocks.length === 0 && (
          <div className="border-2 border-dashed border-border rounded-lg p-12 text-center text-muted-foreground text-sm">
            Добавь блоки из панели слева
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {blocks.map((block, i) => (
              <BlockItem
                key={i}
                id={String(i)}
                block={block}
                onUpdate={(data) => handleUpdate(i, data)}
                onDelete={() => handleDelete(i)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify lint passes**

```bash
pnpm lint
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add app/wishlist/components/constructor/block-palette.tsx app/wishlist/components/constructor/block-item.tsx app/wishlist/components/constructor/block-canvas.tsx
git commit -m "feat: add block palette, item, and canvas with DnD"
```

---

### Task 10: Constructor editor wrapper + update edit page

**Files:**
- Create: `app/wishlist/components/constructor-editor.tsx`
- Modify: `app/wishlist/edit/[id]/page.tsx`

- [ ] **Step 1: Create constructor editor wrapper**

```typescript
// app/wishlist/components/constructor-editor.tsx
'use client'

import { useApiUpdateWishlistBlocks } from '@/api/wishlist'
import { BlockCanvas } from '@/app/wishlist/components/constructor/block-canvas'
import { Block, Wishlist } from '@/shared/types'
import { useCallback, useRef } from 'react'
import React from 'react'
import { useToast } from '@/hooks/use-toast'

type Props = {
  wishlist: Wishlist
}

export function ConstructorEditor({ wishlist }: Props) {
  const { mutate } = useApiUpdateWishlistBlocks(wishlist.id)
  const { toast } = useToast()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Блоки конструктора</h3>
        <span className="text-xs text-muted-foreground">Сохраняется автоматически</span>
      </div>
      <BlockCanvas
        initialBlocks={wishlist.blocks ?? []}
        onBlocksChange={handleBlocksChange}
      />
    </div>
  )
}
```

- [ ] **Step 2: Update edit page to auto-detect wishlist type**

Replace contents of `app/wishlist/edit/[id]/page.tsx`:

```typescript
'use client'

import { useApiGetWishlistById } from '@/api/wishlist'
import { CreateForm } from '@/app/wishlist/components/create-form'
import { ConstructorEditor } from '@/app/wishlist/components/constructor-editor'
import { useParams } from 'next/navigation'
import * as React from 'react'

export default function Page() {
  const { id } = useParams()
  const { data } = useApiGetWishlistById(id as string)
  const wishlist = data?.data

  if (!wishlist) {
    return null
  }

  const isConstructor = Array.isArray(wishlist.blocks)

  return (
    <>
      <h2 className='text-4xl mb-5'>{wishlist.title}</h2>
      {isConstructor ? (
        <ConstructorEditor wishlist={wishlist} />
      ) : (
        <CreateForm edit wishlist={wishlist} />
      )}
    </>
  )
}
```

- [ ] **Step 3: Verify lint passes**

```bash
pnpm lint
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/wishlist/components/constructor-editor.tsx app/wishlist/edit/[id]/page.tsx
git commit -m "feat: add constructor editor with auto-save and update edit page to detect wishlist type"
```

---

## Chunk 5: Public View, Short Links, List Page

### Task 11: Block view components

**Files:**
- Modify: `next.config.ts`
- Create: `app/[userId]/[wishlistId]/components/blocks/block-renderer.tsx`
- Create: `app/[userId]/[wishlistId]/components/blocks/text-block-view.tsx`
- Create: `app/[userId]/[wishlistId]/components/blocks/image-block-view.tsx`
- Create: `app/[userId]/[wishlistId]/components/blocks/date-block-view.tsx`
- Create: `app/[userId]/[wishlistId]/components/blocks/location-block-view.tsx`
- Create: `app/[userId]/[wishlistId]/components/blocks/color-scheme-block-view.tsx`
- Create: `app/[userId]/[wishlistId]/components/blocks/timing-block-view.tsx`
- Create: `app/[userId]/[wishlistId]/components/blocks/text-image-block-view.tsx`

- [ ] **Step 0: Update next.config.ts to allow external image URLs**

Block images come from user-supplied URLs (any domain). Add a wildcard pattern to `next.config.ts`:

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { hostname: "localhost" },
      { hostname: "get-my-wishlist.ru" },
      { hostname: "minio" },
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ]
  }
};

export default nextConfig;
```

- [ ] **Step 1: Create text block view**

```typescript
// app/[userId]/[wishlistId]/components/blocks/text-block-view.tsx
import { Block } from '@/shared/types'
import React from 'react'

export function TextBlockView({ block }: { block: Block }) {
  const content = block.data.content as string
  if (!content) return null
  return (
    <div className="pl-8 md:pl-12 border-l-4 border-accent">
      <div className="text-xl md:text-2xl leading-relaxed text-foreground max-w-3xl whitespace-pre-wrap">
        {content}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create image block view**

```typescript
// app/[userId]/[wishlistId]/components/blocks/image-block-view.tsx
import { Block } from '@/shared/types'
import Image from 'next/image'
import React from 'react'

export function ImageBlockView({ block }: { block: Block }) {
  const url = block.data.url as string
  if (!url) return null
  return (
    <div className="rounded-2xl overflow-hidden max-w-2xl">
      <Image src={url} alt="block image" width={800} height={450} className="w-full object-cover" />
    </div>
  )
}
```

- [ ] **Step 3: Create date block view**

```typescript
// app/[userId]/[wishlistId]/components/blocks/date-block-view.tsx
import { Block } from '@/shared/types'
import { CalendarIcon } from 'lucide-react'
import React from 'react'

export function DateBlockView({ block }: { block: Block }) {
  const datetime = block.data.datetime as string
  const label = block.data.label as string | undefined
  if (!datetime) return null
  return (
    <div className="flex gap-4 items-center bg-card p-6 rounded-2xl shadow-md max-w-sm">
      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
        <CalendarIcon className="w-6 h-6 text-primary" />
      </div>
      <div>
        {label && <p className="text-sm text-muted-foreground">{label}</p>}
        <p className="text-xl font-medium text-foreground">
          {new Date(datetime).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create location block view**

```typescript
// app/[userId]/[wishlistId]/components/blocks/location-block-view.tsx
import { Block } from '@/shared/types'
import { MapPinIcon } from 'lucide-react'
import React from 'react'

export function LocationBlockView({ block }: { block: Block }) {
  const name = block.data.name as string
  const link = block.data.link as string | undefined
  if (!name) return null
  return (
    <div className="flex gap-4 items-center bg-card p-6 rounded-2xl shadow-md max-w-sm">
      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
        <MapPinIcon className="w-6 h-6 text-primary" />
      </div>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-xl font-medium text-primary hover:text-accent underline underline-offset-4">
          {name}
        </a>
      ) : (
        <span className="text-xl font-medium text-foreground">{name}</span>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Create color_scheme block view**

```typescript
// app/[userId]/[wishlistId]/components/blocks/color-scheme-block-view.tsx
import { Block } from '@/shared/types'
import { useEffect } from 'react'
import React from 'react'

export function ColorSchemeBlockView({ block }: { block: Block }) {
  const scheme = block.data.scheme as string
  useEffect(() => {
    if (!scheme || typeof window === 'undefined') return
    document.body.classList.add(scheme)
    return () => { document.body.classList.remove(scheme) }
  }, [scheme])
  return null
}
```

- [ ] **Step 6: Create timing block view**

```typescript
// app/[userId]/[wishlistId]/components/blocks/timing-block-view.tsx
import { Block } from '@/shared/types'
import { TimerIcon } from 'lucide-react'
import React from 'react'

export function TimingBlockView({ block }: { block: Block }) {
  const start = block.data.start as string
  const end = block.data.end as string | undefined
  if (!start) return null
  return (
    <div className="flex gap-4 items-center bg-card p-6 rounded-2xl shadow-md max-w-sm">
      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
        <TimerIcon className="w-6 h-6 text-primary" />
      </div>
      <div>
        <p className="text-xl font-medium text-foreground">
          {new Date(start).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          {end && ` — ${new Date(end).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create text_image block view**

```typescript
// app/[userId]/[wishlistId]/components/blocks/text-image-block-view.tsx
import { Block } from '@/shared/types'
import Image from 'next/image'
import React from 'react'

export function TextImageBlockView({ block }: { block: Block }) {
  const content = block.data.content as string
  const imageUrl = block.data.imageUrl as string
  if (!content && !imageUrl) return null
  return (
    <div className="grid md:grid-cols-2 gap-6 items-center">
      {content && (
        <div className="pl-8 border-l-4 border-accent text-xl leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      )}
      {imageUrl && (
        <div className="rounded-2xl overflow-hidden">
          <Image src={imageUrl} alt="block image" width={600} height={400} className="w-full object-cover" />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 8: Create block renderer**

```typescript
// app/[userId]/[wishlistId]/components/blocks/block-renderer.tsx
import { ColorSchemeBlockView } from '@/app/[userId]/[wishlistId]/components/blocks/color-scheme-block-view'
import { DateBlockView } from '@/app/[userId]/[wishlistId]/components/blocks/date-block-view'
import { ImageBlockView } from '@/app/[userId]/[wishlistId]/components/blocks/image-block-view'
import { LocationBlockView } from '@/app/[userId]/[wishlistId]/components/blocks/location-block-view'
import { TextBlockView } from '@/app/[userId]/[wishlistId]/components/blocks/text-block-view'
import { TextImageBlockView } from '@/app/[userId]/[wishlistId]/components/blocks/text-image-block-view'
import { TimingBlockView } from '@/app/[userId]/[wishlistId]/components/blocks/timing-block-view'
import { Block } from '@/shared/types'
import React from 'react'

type Props = {
  blocks: Block[]
}

export function BlockRenderer({ blocks }: Props) {
  const sorted = [...blocks].sort((a, b) => a.position - b.position)

  return (
    <div className="space-y-12">
      {sorted.map((block, i) => (
        <div key={i}>
          {block.type === 'text' && <TextBlockView block={block} />}
          {block.type === 'text_image' && <TextImageBlockView block={block} />}
          {block.type === 'image' && <ImageBlockView block={block} />}
          {block.type === 'date' && <DateBlockView block={block} />}
          {block.type === 'location' && <LocationBlockView block={block} />}
          {block.type === 'color_scheme' && <ColorSchemeBlockView block={block} />}
          {block.type === 'timing' && <TimingBlockView block={block} />}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 9: Verify lint passes**

```bash
pnpm lint
```

Expected: no errors

- [ ] **Step 10: Commit**

```bash
git add "app/[userId]/[wishlistId]/components/blocks/"
git commit -m "feat: add block view components and block renderer for public wishlist"
```

---

### Task 12: Update public wishlist page to render blocks

**Files:**
- Modify: `app/[userId]/[wishlistId]/page.tsx`

- [ ] **Step 1: Replace contents of `app/[userId]/[wishlistId]/page.tsx`**

```typescript
'use client'

import { useApiGetAllPresents } from '@/api/present'
import { useApiGetMe } from '@/api/user'
import { useApiGetWishlistById } from '@/api/wishlist'
import { BlockRenderer } from '@/app/[userId]/[wishlistId]/components/blocks/block-renderer'
import { PresentItem } from '@/app/[userId]/[wishlistId]/components/present-item'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { MapPinIcon, CalendarIcon } from 'lucide-react'
import { useEffect } from 'react'
import * as React from 'react'

export default function Page() {
  const { wishlistId } = useParams()

  const { data: presentsData } = useApiGetAllPresents(wishlistId as string)
  const { data } = useApiGetWishlistById(wishlistId as string)
  const { data: userData } = useApiGetMe()

  const wishlist = data?.data
  const presents = presentsData?.data
  const isMyWishlist = userData?.user.id === wishlist?.userId
  const isPresentHidden = (isMyWishlist && !wishlist?.settings.showGiftAvailability)

  useEffect(() => {
    if (typeof window !== 'undefined' && document.body.classList) {
      const colorScheme = wishlist?.settings?.colorScheme;
      if (colorScheme) {
        document.body.classList.add(colorScheme)
      }
      return () => {
        if (colorScheme)
        document.body.classList.remove(colorScheme)
      };
    }
  }, [wishlist]);

  if (!wishlist) {
    return null
  }

  return (
    <div className={cn('min-h-screen bg-background relative overflow-hidden', wishlist.settings.colorScheme)}>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-16">
        {/* Шапка с обложкой */}
        <div className="grid md:grid-cols-[1fr_400px] gap-8 items-start">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-black text-primary leading-[0.9]">
              Добро пожаловать в мой вишлист!
            </h1>

            <div className="text-2xl md:text-3xl font-medium text-muted-foreground max-w-2xl">
              Приглашаю вас на праздник <br />
              <span className="text-primary font-bold italic text-4xl md:text-5xl">&#34;{wishlist.title}&#34;</span>
            </div>
          </div>

          {
            wishlist?.cover &&
            <Image className="rounded-2xl" src={wishlist.cover} alt="wishlist-cover" width={400} height={400} />
          }
        </div>

        {/* Основной контент */}
        <div className="relative space-y-20 whitespace-pre-wrap">
          {/* Описание */}
          {wishlist?.description && (
            <div className="relative pl-8 md:pl-12 border-l-4 border-accent">
              <div className="text-xl md:text-2xl leading-relaxed text-foreground space-y-4 max-w-3xl">
                {wishlist.description}
              </div>
            </div>
          )}

          {/* Блоки конструктора */}
          {wishlist.blocks && wishlist.blocks.length > 0 && (
            <BlockRenderer blocks={wishlist.blocks} />
          )}

          {/* Детали мероприятия */}
          {(wishlist?.location.time || wishlist.location.name) && (
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="sticky top-24 space-y-4 md:space-y-6">
                <h2 className="text-3xl md:text-5xl font-bold text-primary">
                  Где и когда?
                </h2>
                <div className="w-32 h-2 bg-accent rounded-full" />
              </div>

              <div className="space-y-8 bg-card p-8 rounded-3xl shadow-lg">
                {wishlist.location.time && (
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-xl font-medium text-foreground">
                      {new Date(wishlist.location.time).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                )}

                {wishlist.location.name && (
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <MapPinIcon className="w-6 h-6 text-primary" />
                    </div>
                    {wishlist.location.link ? (
                      <a
                        href={wishlist.location.link}
                        className="text-xl font-medium text-primary hover:text-accent transition-colors underline underline-offset-4"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {wishlist.location.name}
                      </a>
                    ) : (
                      <span className="text-xl font-medium">{wishlist.location.name}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Список подарков */}
          <div className="space-y-12">
            <div className="flex flex-col justify-between items-start gap-4 md:gap-6 max-w-max">
              <h2 className="text-3xl md:text-5xl font-bold text-primary">
                Желанные подарки
              </h2>
              <div className="w-24 md:w-40 h-2 bg-accent rounded-full ml-auto" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {presents?.map(present => (
                <PresentItem
                  key={present.id}
                  present={present}
                  theme={wishlist.settings.colorScheme}
                  isHidden={isPresentHidden}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <footer className="bg-secondary text-secondary-foreground py-4">
        <div className="mx-auto flex items-center justify-between container px-4 text-center w-full gap-4">
          <div className="flex-col border-t border-secondary/20 text-sm md:text-xl">
            <p>Создано с помощью сервиса <Link href='/' className='underline'>GetWishlist</Link></p>
          </div>
          <Link
            href='/'
            className="bg-background text-foreground p-2 md:px-12 md:py-4 rounded-xl font-bold text-sm md:text-lg hover:bg-background/90 transition-colors shadow-xl">
            Хочу такой же вишлист!
          </Link>
        </div>
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Verify lint passes**

```bash
pnpm lint
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/[userId]/[wishlistId]/page.tsx"
git commit -m "feat: render constructor blocks above presents in public wishlist view"
```

---

### Task 13: Short link page

**Files:**
- Create: `app/s/[shortId]/page.tsx`

- [ ] **Step 1: Create the short link page**

```typescript
// app/s/[shortId]/page.tsx
'use client'

import { useApiGetWishlistByShortId } from '@/api/wishlist'
import { useApiGetAllPresents } from '@/api/present'
import { useApiGetMe } from '@/api/user'
import { BlockRenderer } from '@/app/[userId]/[wishlistId]/components/blocks/block-renderer'
import { PresentItem } from '@/app/[userId]/[wishlistId]/components/present-item'
import { cn } from '@/lib/utils'
import { toDate } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { MapPinIcon, CalendarIcon } from 'lucide-react'
import { useEffect } from 'react'
import * as React from 'react'

export default function Page() {
  const { shortId } = useParams()
  const { data } = useApiGetWishlistByShortId(shortId as string)
  const wishlist = data?.data
  const { data: presentsData } = useApiGetAllPresents(wishlist?.id ?? '')
  const { data: userData } = useApiGetMe()

  const presents = presentsData?.data
  const isMyWishlist = userData?.user.id === wishlist?.userId
  const isPresentHidden = isMyWishlist && !wishlist?.settings.showGiftAvailability

  useEffect(() => {
    if (typeof window === 'undefined' || !wishlist?.settings?.colorScheme) return
    const scheme = wishlist.settings.colorScheme
    document.body.classList.add(scheme)
    return () => { document.body.classList.remove(scheme) }
  }, [wishlist])

  if (!wishlist) return null

  return (
    <div className={cn('min-h-screen bg-background relative overflow-hidden', wishlist.settings.colorScheme)}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-16">
        {/* Шапка с обложкой */}
        <div className="grid md:grid-cols-[1fr_400px] gap-8 items-start">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-black text-primary leading-[0.9]">
              Добро пожаловать в мой вишлист!
            </h1>
            <div className="text-2xl md:text-3xl font-medium text-muted-foreground max-w-2xl">
              Приглашаю вас на праздник <br />
              <span className="text-primary font-bold italic text-4xl md:text-5xl">&#34;{wishlist.title}&#34;</span>
            </div>
          </div>
          {wishlist.cover && (
            <Image className="rounded-2xl" src={wishlist.cover} alt="wishlist-cover" width={400} height={400} />
          )}
        </div>

        <div className="relative space-y-20 whitespace-pre-wrap">
          {wishlist.description && (
            <div className="relative pl-8 md:pl-12 border-l-4 border-accent">
              <div className="text-xl md:text-2xl leading-relaxed text-foreground space-y-4 max-w-3xl">
                {wishlist.description}
              </div>
            </div>
          )}

          {wishlist.blocks && wishlist.blocks.length > 0 && (
            <BlockRenderer blocks={wishlist.blocks} />
          )}

          {(wishlist.location.time || wishlist.location.name) && (
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="sticky top-24 space-y-4 md:space-y-6">
                <h2 className="text-3xl md:text-5xl font-bold text-primary">Где и когда?</h2>
                <div className="w-32 h-2 bg-accent rounded-full" />
              </div>
              <div className="space-y-8 bg-card p-8 rounded-3xl shadow-lg">
                {wishlist.location.time && (
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-xl font-medium text-foreground">
                      {toDate(wishlist.location.time).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                )}
                {wishlist.location.name && (
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <MapPinIcon className="w-6 h-6 text-primary" />
                    </div>
                    {wishlist.location.link ? (
                      <a href={wishlist.location.link} className="text-xl font-medium text-primary hover:text-accent transition-colors underline underline-offset-4" target="_blank" rel="noopener noreferrer">
                        {wishlist.location.name}
                      </a>
                    ) : (
                      <span className="text-xl font-medium">{wishlist.location.name}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-12">
            <div className="flex flex-col justify-between items-start gap-4 md:gap-6 max-w-max">
              <h2 className="text-3xl md:text-5xl font-bold text-primary">Желанные подарки</h2>
              <div className="w-24 md:w-40 h-2 bg-accent rounded-full ml-auto" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {presents?.map(present => (
                <PresentItem key={present.id} present={present} theme={wishlist.settings.colorScheme} isHidden={isPresentHidden} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-secondary text-secondary-foreground py-4">
        <div className="mx-auto flex items-center justify-between container px-4 text-center w-full gap-4">
          <div className="flex-col border-t border-secondary/20 text-sm md:text-xl">
            <p>Создано с помощью сервиса <Link href='/' className='underline'>GetWishlist</Link></p>
          </div>
          <Link href='/' className="bg-background text-foreground p-2 md:px-12 md:py-4 rounded-xl font-bold text-sm md:text-lg hover:bg-background/90 transition-colors shadow-xl">
            Хочу такой же вишлист!
          </Link>
        </div>
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Verify lint passes**

```bash
pnpm lint
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/s/"
git commit -m "feat: add short link page /s/[shortId]"
```

---

### Task 14: Update wishlist list page and card

**Files:**
- Modify: `app/wishlist/page.tsx`
- Modify: `app/wishlist/components/wishlist-card.tsx`

- [ ] **Step 1: Add two create buttons to wishlist list page**

Replace contents of `app/wishlist/page.tsx`:

```typescript
'use client'
import { useApiGetAllWishlists } from '@/api/wishlist'
import { WishlistCard } from '@/app/wishlist/components/wishlist-card'
import { Button } from '@/components/ui/button'
import { Gift, LayoutTemplate } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

export default function Page() {
  const { data } = useApiGetAllWishlists()
  return (
    <div>
      <h2 className="text-4xl mb-5">Мои вишлисты</h2>
      <div className="flex gap-3 mb-6">
        <Button asChild variant="default">
          <Link href="/wishlist/create">
            <Gift className="mr-2" size={18} />
            Обычный вишлист
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/wishlist/create-constructor">
            <LayoutTemplate className="mr-2" size={18} />
            Конструктор
          </Link>
        </Button>
      </div>
      <div className="flex flex-wrap gap-4 items-center">
        {data?.data?.map((wishlist) => (
          <WishlistCard key={wishlist.id} wishlist={wishlist} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Replace contents of `app/wishlist/components/wishlist-card.tsx`**

```typescript
import { WishlistMenu } from '@/app/wishlist/[id]/components/wishlist-menu'
import { CardCover } from '@/components/card-cover'
import { Button } from '@/components/ui/button'
import { Wishlist } from '@/shared/types'
import { toDate } from 'date-fns'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { Gift } from 'lucide-react'

interface WishlistCardProps {
  wishlist: Wishlist
}

export const WishlistCard = ({ wishlist }: WishlistCardProps) => {
  const navigate = useRouter()
  return (
    <div className="group w-[350px] relative border text-card-foreground rounded-xl shadow-lg hover:shadow-xl">
      <CardCover className="h-[200px]" cover={wishlist.cover} title={wishlist.title} />
      {/* Контент */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-lg font-semibold line-clamp-1">{wishlist.title}</h3>
            {Array.isArray(wishlist.blocks) && (
              <span className="shrink-0 text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Конструктор
              </span>
            )}
          </div>
          <WishlistMenu wishlist={wishlist} />
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{wishlist.description}</p>

        <Button className="w-full mb-4" onClick={() => navigate.push(`/wishlist/${wishlist.id}`)}>Добавить подарки <Gift /> </Button>
        {/* Дополнительная информация */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {
            wishlist.location.time && <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
              {toDate((wishlist.location.time)).toLocaleDateString()}
          </span>
          }
          <span>•</span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {wishlist.presentsCount} подарков
          </span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify lint passes**

```bash
pnpm lint
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/wishlist/page.tsx app/wishlist/components/wishlist-card.tsx
git commit -m "feat: add two create buttons and constructor badge to wishlist list"
```

---

### Task 15: Final build check

- [ ] **Step 1: Run production build**

```bash
pnpm build
```

Expected: build completes with no errors. Warnings about `img` element or missing alt text are acceptable.

- [ ] **Step 2: Commit if any fixes were needed**

Stage only the files you actually changed to fix build errors:

```bash
git add <specific-files-changed>
git commit -m "fix: resolve build issues"
```
