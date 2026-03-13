# Constructor Improvements Round 2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 8 bugs and add 2 features to the wishlist constructor editor.

**Architecture:** Each task is independent and modifies isolated files. Tasks 1–4 are pure UI fixes. Tasks 5–6 fix component-level bugs. Task 7 adds image upload infrastructure that task 8 builds on. Task 9 adds the gifts tab.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Tiptap, Axios.

No test suite exists in this project — skip TDD steps, verify by running `pnpm lint` and manual inspection.

---

## Chunk 1: Quick UI Fixes (Tasks 1–4)

### Task 1: Breadcrumbs on constructor edit page

**Files:**
- Modify: `components/breadcrumbs.tsx` (fix multi-item separator support)
- Modify: `app/wishlist/edit/[id]/page.tsx`

**Note:** The existing `Breadcrumbs` component only places one `<BreadcrumbSeparator />` after the entire `items` array — it does not add separators between individual items. We need to fix this first, otherwise `Мои вишлисты` and `[wishlist.title]` will render without a separator between them.

- [ ] **Step 1: Fix `Breadcrumbs` to add separators between items**

Replace the full content of `components/breadcrumbs.tsx`:

```tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import * as React from 'react'

type Props = {
  page: string
  items: { name: string, url: string }[],
};

export const Breadcrumbs = ({ page, items }: Props) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Главная</BreadcrumbLink>
        </BreadcrumbItem>
        {items.map(({ name, url }) => (
          <React.Fragment key={name}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={url}>{name}</BreadcrumbLink>
            </BreadcrumbItem>
          </React.Fragment>
        ))}
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{page}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
```

This is backward-compatible: existing usages with 1 item still render correctly.

- [ ] **Step 2: Add `Breadcrumbs` to the edit page**

Replace the full content of `app/wishlist/edit/[id]/page.tsx`:

```tsx
'use client'

import { useApiGetWishlistById } from '@/api/wishlist'
import { CreateForm } from '@/app/wishlist/components/create-form'
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

  const isConstructor = Array.isArray(wishlist.blocks)

  return (
    <>
      <Breadcrumbs
        items={[
          { name: 'Мои вишлисты', url: '/wishlist' },
          { name: wishlist.title, url: `/wishlist/${id}` },
        ]}
        page="Конструктор"
      />
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

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/breadcrumbs.tsx app/wishlist/edit/[id]/page.tsx
git commit -m "feat: add breadcrumbs to constructor edit page"
```

---

### Task 2: Gallery modal scroll

**Files:**
- Modify: `app/wishlist/components/constructor/block-editor-modal.tsx`

- [ ] **Step 1: Add scroll to modal content**

In `block-editor-modal.tsx`, find the `DialogContent` and the inner `<div className="py-4">`:

```tsx
<DialogContent className="max-w-lg">
  <DialogHeader>
    <DialogTitle>Редактировать: {BLOCK_LABELS[block.type] ?? block.type}</DialogTitle>
  </DialogHeader>

  <div className="py-4">
```

Change to:

```tsx
<DialogContent className="max-w-lg overflow-hidden">
  <DialogHeader>
    <DialogTitle>Редактировать: {BLOCK_LABELS[block.type] ?? block.type}</DialogTitle>
  </DialogHeader>

  <div className="py-4 max-h-[60vh] overflow-y-auto">
```

- [ ] **Step 2: Verify lint**

```bash
pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/components/constructor/block-editor-modal.tsx
git commit -m "fix: add scroll to gallery block editor modal"
```

---

### Task 3: Timing block — only end date

**Files:**
- Modify: `app/wishlist/components/constructor/blocks/timing-block-editor.tsx`
- Modify: `app/s/[shortId]/components/blocks/timing-block-view.tsx`
- Modify: `shared/types.ts`

**Note:** Existing timing blocks that have `start` but no `end` will silently render nothing after this change. Users will need to re-open and re-save them. This is acceptable per spec given the early stage of the feature. The "ongoing" state (event currently in progress) is intentionally removed — only "upcoming" (countdown) and "past" states remain.

- [ ] **Step 1: Simplify the editor to end-only**

Replace the full content of `timing-block-editor.tsx`:

```tsx
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
    <div className="space-y-2">
      <Label>Дата/время события</Label>
      <Input
        type="datetime-local"
        value={(data.end as string) ?? ''}
        onChange={(e) => onChange({ ...data, end: e.target.value })}
      />
    </div>
  )
}
```

- [ ] **Step 2: Rewrite the view to use `end` only**

Replace the full content of `app/s/[shortId]/components/blocks/timing-block-view.tsx`:

```tsx
'use client'

import { Block } from '@/shared/types'
import { TimerIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'

function getTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return null
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return { days, hours, minutes, seconds }
}

export function TimingBlockView({ block }: { block: Block }) {
  const end = block.data.end as string | undefined
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(null)
  const [past, setPast] = useState(false)

  useEffect(() => {
    if (!end) return
    const endDate = new Date(end)

    const tick = () => {
      const tl = getTimeLeft(endDate)
      setTimeLeft(tl)
      setPast(tl === null)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [end])

  if (!end) return null

  const endDate = new Date(end)
  const formattedDate = endDate.toLocaleString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="flex flex-col gap-4 bg-card p-6 rounded-2xl shadow-md max-w-md">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
          <TimerIcon className="w-5 h-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">{formattedDate}</p>
      </div>

      {!past && timeLeft && (
        <div className="flex gap-3 flex-wrap">
          {[
            { value: timeLeft.days, label: 'дней' },
            { value: timeLeft.hours, label: 'часов' },
            { value: timeLeft.minutes, label: 'минут' },
            { value: timeLeft.seconds, label: 'секунд' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-primary/10 rounded-xl px-4 py-2 text-center min-w-[60px]">
              <p className="text-2xl font-bold text-primary tabular-nums">{String(value).padStart(2, '0')}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      )}

      {past && (
        <p className="text-lg font-semibold text-muted-foreground">Уже прошло</p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Update the type comment in `shared/types.ts`**

Find the line:
```ts
// timing:       { start: string; end?: string }
```

Change to:
```ts
// timing:       { end: string }
```

- [ ] **Step 4: Lint**

```bash
pnpm lint
```

- [ ] **Step 5: Commit**

```bash
git add app/wishlist/components/constructor/blocks/timing-block-editor.tsx
git add "app/s/[shortId]/components/blocks/timing-block-view.tsx"
git add shared/types.ts
git commit -m "feat: simplify timing block to end-date only countdown"
```

---

### Task 4: Phone validation in contact block

**Files:**
- Modify: `app/wishlist/components/constructor/blocks/contact-block-editor.tsx`

- [ ] **Step 1: Add validation**

Replace the full content of `contact-block-editor.tsx`:

```tsx
'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React, { useState } from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

// Accepts: +7XXXXXXXXXX, 8XXXXXXXXXX, +7 (XXX) XXX-XX-XX, +7 XXX XXX XX XX, etc.
const PHONE_RE = /^(\+7|8)[\s\-()]?(\d[\s\-()]?){9,10}\d$/

function validatePhone(value: string): string | null {
  if (!value) return null
  return PHONE_RE.test(value.replace(/\s/g, '')) ? null : 'Введите корректный номер телефона'
}

export function ContactBlockEditor({ data, onChange }: Props) {
  const name = (data.name as string) ?? ''
  const role = (data.role as string) ?? ''
  const phone = (data.phone as string) ?? ''
  const telegram = (data.telegram as string) ?? ''

  const [phoneError, setPhoneError] = useState<string | null>(null)

  const set = (field: string, value: string) => onChange({ ...data, [field]: value })

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Имя</Label>
        <Input placeholder="Иван Иванов" value={name} onChange={(e) => set('name', e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Роль / описание</Label>
        <Input placeholder="Организатор" value={role} onChange={(e) => set('role', e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Телефон</Label>
        <Input
          placeholder="+7 999 123 45 67"
          value={phone}
          onChange={(e) => {
            set('phone', e.target.value)
            if (phoneError) setPhoneError(validatePhone(e.target.value))
          }}
          onBlur={(e) => setPhoneError(validatePhone(e.target.value))}
          className={phoneError ? 'border-destructive focus-visible:ring-destructive' : ''}
        />
        {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Telegram</Label>
        <Input placeholder="@username" value={telegram} onChange={(e) => set('telegram', e.target.value)} />
      </div>
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
git add app/wishlist/components/constructor/blocks/contact-block-editor.tsx
git commit -m "feat: add phone validation to contact block editor"
```

---

## Chunk 2: Editor and Color Scheme Fixes (Tasks 5–6)

### Task 5: Fix Tiptap SSR + empty `src` guards

**Files:**
- Modify: `app/wishlist/components/constructor/blocks/text-block-editor.tsx`
- Modify: `app/wishlist/components/constructor/blocks/image-block-editor.tsx`
- Modify: `app/wishlist/components/constructor/blocks/text-image-block-editor.tsx`

- [ ] **Step 1: Fix Tiptap SSR in `text-block-editor.tsx`**

Find the `useEditor` call:

```tsx
const editor = useEditor({
  extensions: [StarterKit, Underline],
  content: initialContent,
  onUpdate: ({ editor }) => {
```

Add `immediatelyRender: false`:

```tsx
const editor = useEditor({
  immediatelyRender: false,
  extensions: [StarterKit, Underline],
  content: initialContent,
  onUpdate: ({ editor }) => {
```

- [ ] **Step 2: Guard empty `previewUrl` in `image-block-editor.tsx`**

The component passes `data.url as string | undefined` to `previewUrl`. An empty string `""` would be falsy but TypeScript allows it. Change the prop to explicitly exclude empty strings:

```tsx
<ImageUpload
  label="Картинка"
  onChange={handleChange}
  previewUrl={(data.url as string) || undefined}
/>
```

(The `|| undefined` converts `""` to `undefined`, preventing empty `src`.)

- [ ] **Step 3: Same guard in `text-image-block-editor.tsx`**

Find:
```tsx
previewUrl={data.imageUrl as string | undefined}
```

Change to:
```tsx
previewUrl={(data.imageUrl as string) || undefined}
```

- [ ] **Step 4: Lint**

```bash
pnpm lint
```

- [ ] **Step 5: Commit**

```bash
git add app/wishlist/components/constructor/blocks/text-block-editor.tsx
git add app/wishlist/components/constructor/blocks/image-block-editor.tsx
git add app/wishlist/components/constructor/blocks/text-image-block-editor.tsx
git commit -m "fix: tiptap SSR hydration and empty src guard in block editors"
```

---

### Task 6: Color scheme — don't pollute body in preview

**Files:**
- Modify: `app/s/[shortId]/components/wishlist-landing.tsx`
- Modify: `app/wishlist/components/constructor-editor.tsx`

- [ ] **Step 1: Add `disableBodyTheme` prop to `WishlistLanding`**

Open `app/s/[shortId]/components/wishlist-landing.tsx`. Find the component props type and the `useEffect` that touches `document.body`. The component currently has a `useEffect` like:

```tsx
useEffect(() => {
  const scheme = wishlist.settings.colorScheme
  document.body.classList.add(scheme)
  return () => { document.body.classList.remove(scheme) }
}, [wishlist.settings.colorScheme])
```

Add `disableBodyTheme` to the props and wrap the body mutation:

```tsx
// Find the Props type (or add one if inline) and add the prop:
type Props = {
  wishlist: Wishlist
  presents: Present[]
  isMyWishlist: boolean
  disableBodyTheme?: boolean   // <-- add this
}

// Then wrap the body mutation in the useEffect:
useEffect(() => {
  if (disableBodyTheme) return
  const scheme = wishlist.settings.colorScheme
  document.body.classList.add(scheme)
  return () => { document.body.classList.remove(scheme) }
}, [wishlist.settings.colorScheme, disableBodyTheme])
```

- [ ] **Step 2: Pass `disableBodyTheme` in preview mode**

Open `app/wishlist/components/constructor-editor.tsx`. Find where `WishlistLanding` is rendered:

```tsx
<WishlistLanding wishlist={wishlist} presents={presents} isMyWishlist={false} />
```

Add the prop:

```tsx
<WishlistLanding wishlist={wishlist} presents={presents} isMyWishlist={false} disableBodyTheme />
```

- [ ] **Step 3: Lint**

```bash
pnpm lint
```

- [ ] **Step 4: Commit**

```bash
git add "app/s/[shortId]/components/wishlist-landing.tsx"
git add app/wishlist/components/constructor-editor.tsx
git commit -m "fix: color scheme no longer leaks to editor chrome in preview mode"
```

---

## Chunk 3: Image Upload Infrastructure (Task 7)

### Task 7: Upload images to server instead of using blob URLs

**Files:**
- Create: `api/upload.ts`
- Modify: `components/image-upload.tsx`
- Modify: `app/wishlist/components/constructor/blocks/image-block-editor.tsx`
- Modify: `app/wishlist/components/constructor/blocks/text-image-block-editor.tsx`
- Modify: `app/wishlist/components/constructor/blocks/gallery-block-editor.tsx`

- [ ] **Step 1: Create `api/upload.ts`**

Create new file `api/upload.ts`:

```ts
import api from '@/lib/api'

export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const result = await api.post<{ url: string }, FormData>('upload', fd)
  return result.url
}
```

- [ ] **Step 2: Update `ImageUpload` to upload on file select**

Replace the full content of `components/image-upload.tsx`:

```tsx
'use client'

import { uploadImage } from '@/api/upload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, UploadIcon } from 'lucide-react'
import React, { useRef, useState } from 'react'

export type ImageUploadValue =
  | { type: 'file'; value: File }   // kept for type compatibility, no longer emitted
  | { type: 'url'; value: string }

type Props = {
  label?: string
  onChange: (value: ImageUploadValue | null) => void
  previewUrl?: string
}

export function ImageUpload({ label = 'Обложка', onChange, previewUrl }: Props) {
  const [preview, setPreview] = useState<string | undefined>(previewUrl)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    // Show blob preview immediately for snappy UX
    const blobUrl = URL.createObjectURL(file)
    setPreview(blobUrl)
    setIsUploading(true)
    setUploadError(null)

    try {
      const realUrl = await uploadImage(file)
      URL.revokeObjectURL(blobUrl)
      setPreview(realUrl)
      onChange({ type: 'url', value: realUrl })
    } catch {
      URL.revokeObjectURL(blobUrl)
      setPreview(undefined)
      setUploadError('Ошибка загрузки. Попробуйте ещё раз.')
      onChange(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (isUploading) return
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleFile(file)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploading) return
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
          {isUploading && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={28} />
            </div>
          )}
        </div>
      )}

      {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isUploading
            ? 'border-border opacity-50 cursor-not-allowed'
            : 'border-border cursor-pointer hover:border-primary'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => { if (!isUploading) inputRef.current?.click() }}
      >
        {isUploading ? (
          <Loader2 className="mx-auto mb-2 text-muted-foreground animate-spin" size={24} />
        ) : (
          <UploadIcon className="mx-auto mb-2 text-muted-foreground" size={24} />
        )}
        <p className="text-sm text-muted-foreground">
          {isUploading ? 'Загружается...' : 'Перетащи или нажми для выбора файла'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG до 2MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            if (file.size > 2 * 1024 * 1024) {
              alert('Файл должен быть менее 2MB')
              return
            }
            handleFile(file)
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
        disabled={isUploading}
        defaultValue={previewUrl && !previewUrl.startsWith('blob:') ? previewUrl : ''}
      />
    </div>
  )
}
```

- [ ] **Step 3: Remove dead `type: 'file'` branch from `image-block-editor.tsx`**

Replace the `handleChange` function. The `type: 'file'` branch is now dead code since `ImageUpload` never emits it:

```tsx
const handleChange = (val: ImageUploadValue | null) => {
  if (val?.type === 'url') {
    onChange({ ...data, url: val.value })
  }
}
```

Also update the `previewUrl` prop to guard empty strings:

```tsx
<ImageUpload
  label="Картинка"
  onChange={handleChange}
  previewUrl={(data.url as string) || undefined}
/>
```

- [ ] **Step 4: Remove dead `type: 'file'` branch from `text-image-block-editor.tsx`**

Replace the `handleImage` function:

```tsx
const handleImage = (val: ImageUploadValue | null) => {
  if (val?.type === 'url') {
    onChange({ ...data, imageUrl: val.value })
  }
}
```

Update `previewUrl`:

```tsx
previewUrl={(data.imageUrl as string) || undefined}
```

- [ ] **Step 5: Remove dead `type: 'file'` branch from `gallery-block-editor.tsx`**

Find `updateImage`:

```tsx
const updateImage = (index: number, val: ImageUploadValue | null) => {
  let url = ''
  if (val?.type === 'url') url = val.value
  else if (val?.type === 'file') url = URL.createObjectURL(val.value)
  const next = images.map((img, i) => (i === index ? url : img))
  onChange({ ...data, images: next })
}
```

Simplify to:

```tsx
const updateImage = (index: number, val: ImageUploadValue | null) => {
  const url = val?.type === 'url' ? val.value : ''
  const next = images.map((img, i) => (i === index ? url : img))
  onChange({ ...data, images: next })
}
```

Also update `previewUrl` in the gallery map:

```tsx
previewUrl={(url || undefined)}
```

- [ ] **Step 6: Lint**

```bash
pnpm lint
```

- [ ] **Step 7: Commit**

```bash
git add api/upload.ts
git add components/image-upload.tsx
git add app/wishlist/components/constructor/blocks/image-block-editor.tsx
git add app/wishlist/components/constructor/blocks/text-image-block-editor.tsx
git add app/wishlist/components/constructor/blocks/gallery-block-editor.tsx
git commit -m "fix: upload images to server on select, eliminate blob URL persistence"
```

---

## Chunk 4: Gifts Tab (Task 8)

### Task 8: Add "Подарки" tab to constructor editor

**Prerequisite:** Task 6 must be completed first — `disableBodyTheme` prop is added to `WishlistLanding` in Task 6 and used here.

**Files:**
- Modify: `app/wishlist/components/constructor-editor.tsx`

- [ ] **Step 1: Add the gifts tab**

Replace the full content of `app/wishlist/components/constructor-editor.tsx`:

```tsx
// app/wishlist/components/constructor-editor.tsx
'use client'

import { useApiUpdateWishlistBlocks } from '@/api/wishlist'
import { useApiGetAllPresents } from '@/api/present'
import { BlockCanvas } from '@/app/wishlist/components/constructor/block-canvas'
import { ConstructorHeader } from '@/app/wishlist/components/constructor/constructor-header'
import { WishlistLanding } from '@/app/s/[shortId]/components/wishlist-landing'
import { PresentCard } from '@/app/wishlist/[id]/present/components/present-card'
import { PlusCard } from '@/components/plus-card'
import { Block, Wishlist } from '@/shared/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import React from 'react'
import { useToast } from '@/hooks/use-toast'
import { Eye, Pencil, Gift } from 'lucide-react'

type Props = {
  wishlist: Wishlist
}

type Mode = 'editor' | 'preview' | 'presents'

export function ConstructorEditor({ wishlist }: Props) {
  const { mutate } = useApiUpdateWishlistBlocks(wishlist.id)
  const { toast } = useToast()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mode, setMode] = useState<Mode>('editor')

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
        </button>
      </div>

      {mode === 'editor' && (
        <div className="space-y-6">
          <ConstructorHeader wishlist={wishlist} />
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
          <PlusCard link={`/wishlist/${wishlist.id}/present/create`} />
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
git add app/wishlist/components/constructor-editor.tsx
git commit -m "feat: add gifts tab to constructor editor"
```

---

## Final verification

- [ ] Run dev server: `pnpm dev`
- [ ] Open `/wishlist/edit/[any-constructor-id]` and verify:
  - Breadcrumbs appear at the top
  - Timing block editor shows only one date field
  - Contact block shows phone error on invalid blur
  - Gallery modal scrolls when many photos added
  - Selecting a photo shows upload spinner, then loads real URL
  - After page reload, previously uploaded photos still appear
  - Preview tab no longer changes editor color scheme
  - Gifts tab shows presents + add button
  - Text editor (rich text block) mounts without errors
