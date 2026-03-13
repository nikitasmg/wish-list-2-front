# Constructor Improvements Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the wishlist constructor with rich UX for existing blocks and add 7 new block types.

**Architecture:** Each block type has an editor component (used in the modal) and a view component (used on the public landing page). All wiring goes through `block-editor-modal.tsx`, `block-palette.tsx`, and `block-renderer.tsx`. No test framework exists — use `pnpm lint` and `pnpm build` for verification.

**Tech Stack:** Next.js 16 App Router, TypeScript, shadcn/ui, Tiptap (rich text), isomorphic-dompurify (XSS sanitization), @tailwindcss/typography

**Spec:** `docs/superpowers/specs/2026-03-11-constructor-improvements-design.md`

---

## Chunk 1: Foundation — deps, types, tailwind

### Task 1: Install dependencies

**Files:**
- Modify: `package.json` (via pnpm)
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Install packages**

```bash
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-underline isomorphic-dompurify @tailwindcss/typography
pnpm add -D @types/dompurify
```

Expected: all packages install without errors.

- [ ] **Step 2: Add typography plugin to tailwind.config.ts**

In `tailwind.config.ts`, change:
```ts
plugins: [ require('tailwindcss-animate')],
```
to:
```ts
plugins: [ require('tailwindcss-animate'), require('@tailwindcss/typography')],
```

- [ ] **Step 3: Verify build still passes**

```bash
pnpm build
```

Expected: build succeeds (no new errors).

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml tailwind.config.ts
git commit -m "chore: add tiptap, dompurify, tailwind-typography deps"
```

---

### Task 2: Update shared/types.ts

**Files:**
- Modify: `shared/types.ts`

- [ ] **Step 1: Update BlockType union and data comments**

Replace the entire `shared/types.ts` with:

```ts
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
  | 'agenda'
  | 'gallery'
  | 'quote'
  | 'divider'
  | 'contact'
  | 'video'
  | 'checklist'

export type Block = {
  type: BlockType
  position: number
  mobilePosition?: number
  colSpan?: 1 | 2
  rowSpan?: 1 | 2 | 3
  data: Record<string, unknown>
}

// Block data shapes per type:
// text:         { html: string }  (fallback: content: string for legacy)
// text_image:   { content: string; imageUrl: string }
// image:        { url: string }
// date:         { datetime: string; label?: string }
// location:     { name: string; link?: string }
// color_scheme: { colors: string[]; label?: string }
// timing:       { start: string; end?: string }
// agenda:       { items: { time: string; text: string }[] }
// gallery:      { images: string[] }
// quote:        { text: string; author?: string }
// divider:      { style: 'line' | 'dots' | 'wave' }
// contact:      { name: string; role?: string; telegram?: string; phone?: string }
// video:        { url: string; title?: string }
// checklist:    { title?: string; items: string[] }

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
    presentsLayout?: 'list' | 'grid3' | 'grid2'
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

Expected: no TypeScript errors from the type change.

- [ ] **Step 3: Commit**

```bash
git add shared/types.ts
git commit -m "feat: extend BlockType with 7 new block types"
```

---

## Chunk 2: Existing block improvements

### Task 3: block-item.tsx — image thumbnail + ReactNode preview

**Files:**
- Modify: `app/wishlist/components/constructor/block-item.tsx`

- [ ] **Step 1: Refactor getPreview to return ReactNode and show image thumbnail**

Replace `block-item.tsx` with:

```tsx
// app/wishlist/components/constructor/block-item.tsx
'use client'

import { BlockEditorModal } from '@/app/wishlist/components/constructor/block-editor-modal'
import { BlockToolbar } from '@/app/wishlist/components/constructor/block-toolbar'
import { Block } from '@/shared/types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import React, { useState } from 'react'

const BLOCK_LABELS: Record<string, string> = {
  text: 'Текст',
  text_image: 'Текст + картинка',
  image: 'Картинка',
  date: 'Дата',
  location: 'Место',
  color_scheme: 'Дресс-код / Цвета',
  timing: 'Таймер',
  agenda: 'Программа вечера',
  gallery: 'Галерея',
  quote: 'Цитата',
  divider: 'Разделитель',
  contact: 'Контакт',
  video: 'Видео',
  checklist: 'Чеклист',
}

type Props = {
  block: Block
  id: string
  onUpdate: (data: Record<string, unknown>) => void
  onResize: (colSpan: 1 | 2, rowSpan: 1 | 2 | 3) => void
  onDelete: () => void
}

export function BlockItem({ block, id, onUpdate, onResize, onDelete }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [focused, setFocused] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    gridColumn: `span ${block.colSpan ?? 1}`,
    gridRow: `span ${block.rowSpan ?? 1}`,
  }

  const preview = getPreview(block)

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`relative rounded-lg border bg-card p-4 min-h-[80px] cursor-pointer transition-shadow ${
          focused ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'
        }`}
        onClick={() => setFocused((v) => !v)}
        onBlur={(e) => {
          const related = e.relatedTarget
          if (!e.currentTarget.contains(related)) {
            setTimeout(() => setFocused(false), 0)
          }
        }}
        tabIndex={0}
      >
        {focused && (
          <BlockToolbar
            block={block}
            dragListeners={listeners}
            dragAttributes={attributes}
            onResize={onResize}
            onEdit={() => { setEditOpen(true); setFocused(false) }}
            onDelete={onDelete}
          />
        )}

        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          {BLOCK_LABELS[block.type] ?? block.type}
        </p>
        <div className="text-sm text-foreground line-clamp-3">{preview}</div>
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

function getPreview(block: Block): React.ReactNode {
  const d = block.data
  switch (block.type) {
    case 'text':
      return (d.html as string)
        ? <span className="text-muted-foreground italic text-xs">Текст (HTML)</span>
        : ((d.content as string) || 'Нет текста')
    case 'text_image':
      return (d.content as string) || 'Текст + картинка'
    case 'image':
      return (d.url as string)
        ? <img src={d.url as string} alt="preview" className="w-full h-20 object-cover rounded mt-1" />
        : <span className="text-muted-foreground">Нет картинки</span>
    case 'date':
      return (d.datetime as string) || 'Дата не указана'
    case 'location':
      return (d.name as string) || 'Место не указано'
    case 'color_scheme': {
      const colors = d.colors as string[] | undefined
      if (!colors?.length) return <span className="text-muted-foreground">Нет цветов</span>
      return (
        <div className="flex gap-1 flex-wrap mt-1">
          {colors.map((c, i) => (
            <div key={i} className="w-5 h-5 rounded-full border border-border" style={{ background: c }} />
          ))}
        </div>
      )
    }
    case 'timing':
      return (d.start as string) ? `До: ${new Date(d.start as string).toLocaleString('ru-RU')}` : 'Время не указано'
    case 'agenda': {
      const items = d.items as { time: string; text: string }[] | undefined
      return items?.length ? `${items.length} пунктов программы` : 'Нет пунктов'
    }
    case 'gallery': {
      const imgs = d.images as string[] | undefined
      if (!imgs?.length) return <span className="text-muted-foreground">Нет фото</span>
      return (
        <div className="flex gap-1 mt-1">
          {imgs.slice(0, 4).map((url, i) => (
            <img key={i} src={url} alt="" className="w-10 h-10 object-cover rounded" />
          ))}
          {imgs.length > 4 && <span className="text-xs text-muted-foreground self-center">+{imgs.length - 4}</span>}
        </div>
      )
    }
    case 'quote':
      return (d.text as string) || 'Нет текста'
    case 'divider':
      return `Разделитель: ${(d.style as string) || 'line'}`
    case 'contact':
      return (d.name as string) || 'Нет имени'
    case 'video':
      return (d.url as string) ? `Видео: ${d.url as string}` : 'Нет ссылки'
    case 'checklist': {
      const items = d.items as string[] | undefined
      return items?.length ? `${items.length} пунктов` : 'Нет пунктов'
    }
    default:
      return ''
  }
}
```

- [ ] **Step 2: Verify lint**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/components/constructor/block-item.tsx
git commit -m "feat: image thumbnail preview in block-item, ReactNode getPreview"
```

---

### Task 4: TimingBlockView — live countdown

**Files:**
- Modify: `app/s/[shortId]/components/blocks/timing-block-view.tsx`

- [ ] **Step 1: Replace with countdown implementation**

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
  const start = block.data.start as string
  const end = block.data.end as string | undefined
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(null)
  const [status, setStatus] = useState<'upcoming' | 'ongoing' | 'past'>('upcoming')

  useEffect(() => {
    if (!start) return
    const startDate = new Date(start)
    const endDate = end ? new Date(end) : null

    const tick = () => {
      const now = Date.now()
      if (now < startDate.getTime()) {
        setStatus('upcoming')
        setTimeLeft(getTimeLeft(startDate))
      } else if (endDate && now < endDate.getTime()) {
        setStatus('ongoing')
        setTimeLeft(null)
      } else {
        setStatus('past')
        setTimeLeft(null)
      }
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [start, end])

  if (!start) return null

  const startDate = new Date(start)
  const formattedDate = startDate.toLocaleString('ru-RU', {
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

      {status === 'upcoming' && timeLeft && (
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

      {status === 'ongoing' && (
        <p className="text-lg font-semibold text-primary">Уже идёт! 🎉</p>
      )}

      {status === 'past' && (
        <p className="text-lg font-semibold text-muted-foreground">Уже прошло</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify lint**

```bash
pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add "app/s/[shortId]/components/blocks/timing-block-view.tsx"
git commit -m "feat: live countdown timer in TimingBlockView"
```

---

### Task 5: ColorSchemeBlockEditor + ColorSchemeBlockView — dress code color picker

**Files:**
- Modify: `app/wishlist/components/constructor/blocks/color-scheme-block-editor.tsx`
- Modify: `app/s/[shortId]/components/blocks/color-scheme-block-view.tsx`

- [ ] **Step 1: Rewrite ColorSchemeBlockEditor**

```tsx
'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Plus } from 'lucide-react'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function ColorSchemeBlockEditor({ data, onChange }: Props) {
  const colors = (data.colors as string[]) ?? []
  const label = (data.label as string) ?? ''

  const addColor = () => {
    onChange({ ...data, colors: [...colors, '#a78bfa'] })
  }

  const updateColor = (index: number, value: string) => {
    const next = colors.map((c, i) => (i === index ? value : c))
    onChange({ ...data, colors: next })
  }

  const removeColor = (index: number) => {
    onChange({ ...data, colors: colors.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Подпись (необязательно)</Label>
        <Input
          placeholder="Например: Приходите в этих цветах"
          value={label}
          onChange={(e) => onChange({ ...data, label: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Цвета</Label>
        <div className="flex flex-wrap gap-3">
          {colors.map((color, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="relative">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => updateColor(i, e.target.value)}
                  className="w-12 h-12 rounded-full border-2 border-border cursor-pointer p-0.5 bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => removeColor(i)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                >
                  <X size={10} />
                </button>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{color}</span>
            </div>
          ))}
          <button
            type="button"
            onClick={addColor}
            className="w-12 h-12 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Rewrite ColorSchemeBlockView**

```tsx
import { Block } from '@/shared/types'
import React from 'react'

export function ColorSchemeBlockView({ block }: { block: Block }) {
  const colors = block.data.colors as string[] | undefined
  const label = block.data.label as string | undefined

  if (!colors?.length) return null

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      )}
      <div className="flex gap-3 flex-wrap">
        {colors.map((color, i) => (
          <div
            key={i}
            className="w-12 h-12 rounded-full shadow-md border-2 border-background"
            style={{ background: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify lint**

```bash
pnpm lint
```

- [ ] **Step 4: Update BLOCK_LABELS in block-editor-modal.tsx**

In `app/wishlist/components/constructor/block-editor-modal.tsx`, change:
```ts
color_scheme: 'Цветовая схема',
```
to:
```ts
color_scheme: 'Дресс-код / Цвета',
```

- [ ] **Step 5: Commit**

```bash
git add app/wishlist/components/constructor/blocks/color-scheme-block-editor.tsx
git add "app/s/[shortId]/components/blocks/color-scheme-block-view.tsx"
git add app/wishlist/components/constructor/block-editor-modal.tsx
git commit -m "feat: redesign color_scheme block as dress-code color picker"
```

---

### Task 6: TextBlockEditor — Tiptap rich text with DOMPurify

**Files:**
- Modify: `app/wishlist/components/constructor/blocks/text-block-editor.tsx`
- Modify: `app/s/[shortId]/components/blocks/text-block-view.tsx`

- [ ] **Step 1: Rewrite TextBlockEditor with Tiptap**

```tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import DOMPurify from 'isomorphic-dompurify'
import { Bold, Italic, Underline as UnderlineIcon, Heading2, Heading3 } from 'lucide-react'
import React, { useEffect } from 'react'

const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 'h2', 'h3', 'p', 'br']

function sanitize(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: [] })
}

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function TextBlockEditor({ data, onChange }: Props) {
  const initialContent = (data.html as string) ?? (data.content as string) ?? ''

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = sanitize(editor.getHTML())
      onChange({ ...data, html })
    },
  })

  // Sync if block data changes externally (modal reopen)
  useEffect(() => {
    if (!editor) return
    const incoming = (data.html as string) ?? (data.content as string) ?? ''
    if (editor.getHTML() !== incoming) {
      editor.commands.setContent(incoming, false)
    }
  }, [data.html, data.content]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null

  const ToolbarButton = ({
    onClick,
    active,
    children,
  }: {
    onClick: () => void
    active: boolean
    children: React.ReactNode
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-1.5 rounded text-sm transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-accent'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="space-y-2">
      <div className="flex gap-1 p-1 border rounded-lg bg-muted/50 flex-wrap">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
        >
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
        >
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
        >
          <UnderlineIcon size={14} />
        </ToolbarButton>
        <div className="w-px bg-border mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
        >
          <Heading2 size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
        >
          <Heading3 size={14} />
        </ToolbarButton>
      </div>

      <EditorContent
        editor={editor}
        className="min-h-[120px] border rounded-lg p-3 prose prose-sm max-w-none focus-within:outline-none focus-within:ring-1 focus-within:ring-ring"
      />
    </div>
  )
}
```

- [ ] **Step 2: Rewrite TextBlockView**

```tsx
import { Block } from '@/shared/types'
import DOMPurify from 'isomorphic-dompurify'
import React from 'react'

const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 'h2', 'h3', 'p', 'br']

export function TextBlockView({ block }: { block: Block }) {
  const html = block.data.html as string | undefined
  const content = block.data.content as string | undefined

  if (html) {
    const safe = DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: [] })
    return (
      <div className="pl-8 md:pl-12 border-l-4 border-accent">
        <div
          className="prose prose-sm max-w-3xl"
          dangerouslySetInnerHTML={{ __html: safe }}
        />
      </div>
    )
  }

  if (content) {
    return (
      <div className="pl-8 md:pl-12 border-l-4 border-accent">
        <div className="text-xl md:text-2xl leading-relaxed text-foreground max-w-3xl whitespace-pre-wrap">
          {content}
        </div>
      </div>
    )
  }

  return null
}
```

- [ ] **Step 3: Verify lint**

```bash
pnpm lint
```

- [ ] **Step 4: Commit**

```bash
git add app/wishlist/components/constructor/blocks/text-block-editor.tsx
git add "app/s/[shortId]/components/blocks/text-block-view.tsx"
git commit -m "feat: Tiptap rich text editor with DOMPurify XSS protection"
```

---

## Chunk 3: New block editors

### Task 7: AgendaBlockEditor

**Files:**
- Create: `app/wishlist/components/constructor/blocks/agenda-block-editor.tsx`

- [ ] **Step 1: Create editor**

```tsx
'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'
import React from 'react'

type AgendaItem = { time: string; text: string }

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function AgendaBlockEditor({ data, onChange }: Props) {
  const items = (data.items as AgendaItem[]) ?? []

  const update = (index: number, field: keyof AgendaItem, value: string) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    onChange({ ...data, items: next })
  }

  const add = () => {
    onChange({ ...data, items: [...items, { time: '', text: '' }] })
  }

  const remove = (index: number) => {
    onChange({ ...data, items: items.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-3">
      <Label>Пункты программы</Label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-start">
          <Input
            placeholder="18:00"
            value={item.time}
            onChange={(e) => update(i, 'time', e.target.value)}
            className="w-24 shrink-0"
          />
          <Input
            placeholder="Описание пункта"
            value={item.text}
            onChange={(e) => update(i, 'text', e.target.value)}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus size={14} className="mr-1" /> Добавить пункт
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Verify lint**

```bash
pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/components/constructor/blocks/agenda-block-editor.tsx
git commit -m "feat: AgendaBlockEditor"
```

---

### Task 8: GalleryBlockEditor

**Files:**
- Create: `app/wishlist/components/constructor/blocks/gallery-block-editor.tsx`

> **Note:** Галерея в V1 работает только с URL-ами. Если пользователь загружает файл, создаётся `blob:` URL — он работает только в текущей сессии браузера и не сохранится после перезагрузки. Загрузка файлов галереи на сервер — отдельная задача следующей итерации. Пока рекомендуется использовать внешние URL.

- [ ] **Step 1: Create editor**

```tsx
'use client'

import { ImageUpload, ImageUploadValue } from '@/components/image-upload'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function GalleryBlockEditor({ data, onChange }: Props) {
  const images = (data.images as string[]) ?? []

  const updateImage = (index: number, val: ImageUploadValue | null) => {
    let url = ''
    if (val?.type === 'url') url = val.value
    else if (val?.type === 'file') url = URL.createObjectURL(val.value)
    const next = images.map((img, i) => (i === index ? url : img))
    onChange({ ...data, images: next })
  }

  const addSlot = () => {
    onChange({ ...data, images: [...images, ''] })
  }

  const removeSlot = (index: number) => {
    onChange({ ...data, images: images.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      {images.map((url, i) => (
        <div key={i} className="relative">
          <ImageUpload
            label={`Фото ${i + 1}`}
            onChange={(val) => updateImage(i, val)}
            previewUrl={url || undefined}
          />
          <button
            type="button"
            onClick={() => removeSlot(i)}
            className="absolute top-0 right-0 p-1 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addSlot}>
        <Plus size={14} className="mr-1" /> Добавить фото
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Verify lint + commit**

```bash
pnpm lint
git add app/wishlist/components/constructor/blocks/gallery-block-editor.tsx
git commit -m "feat: GalleryBlockEditor"
```

---

### Task 9: QuoteBlockEditor

**Files:**
- Create: `app/wishlist/components/constructor/blocks/quote-block-editor.tsx`

- [ ] **Step 1: Create editor**

```tsx
'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function QuoteBlockEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Цитата</Label>
        <Textarea
          className="resize-none h-28"
          placeholder="«Лучший праздник — тот, куда зовут лучших людей»"
          value={(data.text as string) ?? ''}
          onChange={(e) => onChange({ ...data, text: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Автор (необязательно)</Label>
        <Input
          placeholder="— именинница"
          value={(data.author as string) ?? ''}
          onChange={(e) => onChange({ ...data, author: e.target.value })}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify lint + commit**

```bash
pnpm lint
git add app/wishlist/components/constructor/blocks/quote-block-editor.tsx
git commit -m "feat: QuoteBlockEditor"
```

---

### Task 10: DividerBlockEditor

**Files:**
- Create: `app/wishlist/components/constructor/blocks/divider-block-editor.tsx`

- [ ] **Step 1: Create editor**

```tsx
'use client'

import { Label } from '@/components/ui/label'
import React from 'react'

type DividerStyle = 'line' | 'dots' | 'wave'

const OPTIONS: { value: DividerStyle; label: string; preview: React.ReactNode }[] = [
  {
    value: 'line',
    label: 'Линия',
    preview: <div className="h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent" />,
  },
  {
    value: 'dots',
    label: 'Точки',
    preview: <p className="text-center tracking-[0.5em] text-primary text-xs">• • •</p>,
  },
  {
    value: 'wave',
    label: 'Волна',
    preview: (
      <svg viewBox="0 0 200 20" className="w-full h-4 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M0 10 Q25 2 50 10 Q75 18 100 10 Q125 2 150 10 Q175 18 200 10" />
      </svg>
    ),
  },
]

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function DividerBlockEditor({ data, onChange }: Props) {
  const current = (data.style as DividerStyle) ?? 'line'

  return (
    <div className="space-y-2">
      <Label>Стиль разделителя</Label>
      <div className="grid grid-cols-3 gap-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange({ ...data, style: opt.value })}
            className={`border rounded-lg p-3 space-y-2 transition-colors ${
              current === opt.value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center justify-center h-6">{opt.preview}</div>
            <p className="text-xs text-center text-muted-foreground">{opt.label}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify lint + commit**

```bash
pnpm lint
git add app/wishlist/components/constructor/blocks/divider-block-editor.tsx
git commit -m "feat: DividerBlockEditor"
```

---

### Task 11: ContactBlockEditor

**Files:**
- Create: `app/wishlist/components/constructor/blocks/contact-block-editor.tsx`

- [ ] **Step 1: Create editor**

```tsx
'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function ContactBlockEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Имя</Label>
        <Input
          placeholder="Алина Смирнова"
          value={(data.name as string) ?? ''}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Роль (необязательно)</Label>
        <Input
          placeholder="Организатор, по всем вопросам"
          value={(data.role as string) ?? ''}
          onChange={(e) => onChange({ ...data, role: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Telegram (без @)</Label>
        <Input
          placeholder="username"
          value={(data.telegram as string) ?? ''}
          onChange={(e) => onChange({ ...data, telegram: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Телефон (необязательно)</Label>
        <Input
          placeholder="+7 999 000 00 00"
          value={(data.phone as string) ?? ''}
          onChange={(e) => onChange({ ...data, phone: e.target.value })}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify lint + commit**

```bash
pnpm lint
git add app/wishlist/components/constructor/blocks/contact-block-editor.tsx
git commit -m "feat: ContactBlockEditor"
```

---

### Task 12: VideoBlockEditor

**Files:**
- Create: `app/wishlist/components/constructor/blocks/video-block-editor.tsx`

- [ ] **Step 1: Create editor**

```tsx
'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React from 'react'

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1)
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop()
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
  } catch {
    // invalid URL
  }
  return null
}

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function VideoBlockEditor({ data, onChange }: Props) {
  const url = (data.url as string) ?? ''
  const embedUrl = url ? getEmbedUrl(url) : null

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Ссылка на видео (YouTube или Vimeo)</Label>
        <Input
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(e) => onChange({ ...data, url: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Заголовок (необязательно)</Label>
        <Input
          placeholder="Смотри наш ролик"
          value={(data.title as string) ?? ''}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
        />
      </div>
      {embedUrl && (
        <div className="aspect-video rounded-lg overflow-hidden border">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            allow="autoplay; fullscreen"
            loading="lazy"
          />
        </div>
      )}
      {url && !embedUrl && (
        <p className="text-xs text-muted-foreground">
          Поддерживаются только YouTube и Vimeo. Ссылка будет показана как кнопка.
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify lint + commit**

```bash
pnpm lint
git add app/wishlist/components/constructor/blocks/video-block-editor.tsx
git commit -m "feat: VideoBlockEditor"
```

---

### Task 13: ChecklistBlockEditor

**Files:**
- Create: `app/wishlist/components/constructor/blocks/checklist-block-editor.tsx`

- [ ] **Step 1: Create editor**

```tsx
'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function ChecklistBlockEditor({ data, onChange }: Props) {
  const items = (data.items as string[]) ?? []

  const update = (index: number, value: string) => {
    onChange({ ...data, items: items.map((item, i) => (i === index ? value : item)) })
  }

  const add = () => {
    onChange({ ...data, items: [...items, ''] })
  }

  const remove = (index: number) => {
    onChange({ ...data, items: items.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Заголовок (необязательно)</Label>
        <Input
          placeholder="Не забудь:"
          value={(data.title as string) ?? ''}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
        />
      </div>
      <Label>Пункты</Label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input
            placeholder="Купить подарок"
            value={item}
            onChange={(e) => update(i, e.target.value)}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus size={14} className="mr-1" /> Добавить пункт
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Verify lint + commit**

```bash
pnpm lint
git add app/wishlist/components/constructor/blocks/checklist-block-editor.tsx
git commit -m "feat: ChecklistBlockEditor"
```

---

## Chunk 4: New block views

### Task 14: AgendaBlockView

**Files:**
- Create: `app/s/[shortId]/components/blocks/agenda-block-view.tsx`

- [ ] **Step 1: Create view**

```tsx
import { Block } from '@/shared/types'
import React from 'react'

type AgendaItem = { time: string; text: string }

export function AgendaBlockView({ block }: { block: Block }) {
  const items = block.data.items as AgendaItem[] | undefined
  if (!items?.length) return null

  return (
    <div className="relative pl-4">
      {/* vertical line */}
      <div className="absolute left-0 top-2 bottom-2 w-px bg-primary/20" />

      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="relative flex gap-4 items-start">
            {/* dot */}
            <div className="absolute -left-4 mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0 translate-x-[-3px]" />
            <span className="text-sm font-bold text-primary min-w-[52px] shrink-0">{item.time}</span>
            <span className="text-sm text-foreground leading-relaxed">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify lint + commit**

```bash
pnpm lint
git add "app/s/[shortId]/components/blocks/agenda-block-view.tsx"
git commit -m "feat: AgendaBlockView"
```

---

### Task 15: GalleryBlockView

**Files:**
- Create: `app/s/[shortId]/components/blocks/gallery-block-view.tsx`

- [ ] **Step 1: Create view**

```tsx
import { Block } from '@/shared/types'
import React from 'react'

export function GalleryBlockView({ block }: { block: Block }) {
  const images = block.data.images as string[] | undefined
  if (!images?.length) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 rounded-2xl overflow-hidden">
      {images.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={url}
          alt={`gallery ${i + 1}`}
          className={`w-full object-cover rounded-lg ${i === 0 ? 'col-span-2 h-64' : 'h-40'}`}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify lint + commit**

```bash
pnpm lint
git add "app/s/[shortId]/components/blocks/gallery-block-view.tsx"
git commit -m "feat: GalleryBlockView"
```

---

### Task 16: QuoteBlockView

**Files:**
- Create: `app/s/[shortId]/components/blocks/quote-block-view.tsx`

- [ ] **Step 1: Create view**

```tsx
import { Block } from '@/shared/types'
import React from 'react'

export function QuoteBlockView({ block }: { block: Block }) {
  const text = block.data.text as string | undefined
  const author = block.data.author as string | undefined
  if (!text) return null

  return (
    <blockquote className="border-l-4 border-primary pl-6 py-2">
      <p className="text-xl md:text-2xl italic text-foreground leading-relaxed">«{text}»</p>
      {author && (
        <footer className="mt-2 text-sm text-muted-foreground">— {author}</footer>
      )}
    </blockquote>
  )
}
```

- [ ] **Step 2: Verify lint + commit**

```bash
pnpm lint
git add "app/s/[shortId]/components/blocks/quote-block-view.tsx"
git commit -m "feat: QuoteBlockView"
```

---

### Task 17: DividerBlockView

**Files:**
- Create: `app/s/[shortId]/components/blocks/divider-block-view.tsx`

- [ ] **Step 1: Create view**

```tsx
import { Block } from '@/shared/types'
import React from 'react'

export function DividerBlockView({ block }: { block: Block }) {
  const style = (block.data.style as string) ?? 'line'

  if (style === 'dots') {
    return <p className="text-center tracking-[0.6em] text-primary/60 py-2 select-none">• • •</p>
  }

  if (style === 'wave') {
    return (
      <div className="py-2">
        <svg viewBox="0 0 400 20" className="w-full h-5 text-primary/40" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M0 10 Q50 2 100 10 Q150 18 200 10 Q250 2 300 10 Q350 18 400 10" />
        </svg>
      </div>
    )
  }

  // default: line
  return <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
}
```

- [ ] **Step 2: Verify lint + commit**

```bash
pnpm lint
git add "app/s/[shortId]/components/blocks/divider-block-view.tsx"
git commit -m "feat: DividerBlockView"
```

---

### Task 18: ContactBlockView

**Files:**
- Create: `app/s/[shortId]/components/blocks/contact-block-view.tsx`

- [ ] **Step 1: Create view**

```tsx
import { Block } from '@/shared/types'
import React from 'react'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return name.slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function ContactBlockView({ block }: { block: Block }) {
  const name = block.data.name as string | undefined
  const role = block.data.role as string | undefined
  const telegram = block.data.telegram as string | undefined
  const phone = block.data.phone as string | undefined

  if (!name) return null

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-card p-5 rounded-2xl shadow-sm max-w-sm">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <span className="text-lg font-bold text-primary">{getInitials(name)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground">{name}</p>
        {role && <p className="text-sm text-muted-foreground">{role}</p>}
        {(telegram || phone) && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {telegram && (
              <a
                href={`https://t.me/${telegram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-accent transition-colors"
              >
                Telegram
              </a>
            )}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-accent transition-colors"
              >
                {phone}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify lint + commit**

```bash
pnpm lint
git add "app/s/[shortId]/components/blocks/contact-block-view.tsx"
git commit -m "feat: ContactBlockView"
```

---

### Task 19: VideoBlockView

**Files:**
- Create: `app/s/[shortId]/components/blocks/video-block-view.tsx`

- [ ] **Step 1: Create view**

```tsx
import { Block } from '@/shared/types'
import { ExternalLink } from 'lucide-react'
import React from 'react'

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1)
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop()
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
  } catch {
    // invalid URL
  }
  return null
}

export function VideoBlockView({ block }: { block: Block }) {
  const url = block.data.url as string | undefined
  const title = block.data.title as string | undefined

  if (!url) return null

  const embedUrl = getEmbedUrl(url)

  return (
    <div className="space-y-3 max-w-2xl">
      {title && <p className="text-lg font-medium text-foreground">{title}</p>}
      {embedUrl ? (
        <div className="aspect-video rounded-2xl overflow-hidden shadow-md">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            allow="autoplay; fullscreen"
            loading="lazy"
            title={title ?? 'video'}
          />
        </div>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-accent transition-colors text-sm"
        >
          <ExternalLink size={16} /> Смотреть видео
        </a>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify lint + commit**

```bash
pnpm lint
git add "app/s/[shortId]/components/blocks/video-block-view.tsx"
git commit -m "feat: VideoBlockView"
```

---

### Task 20: ChecklistBlockView

**Files:**
- Create: `app/s/[shortId]/components/blocks/checklist-block-view.tsx`

- [ ] **Step 1: Create view**

```tsx
import { Block } from '@/shared/types'
import { CheckCircle2 } from 'lucide-react'
import React from 'react'

export function ChecklistBlockView({ block }: { block: Block }) {
  const title = block.data.title as string | undefined
  const items = block.data.items as string[] | undefined

  if (!items?.length) return null

  return (
    <div className="space-y-3 max-w-sm">
      {title && <p className="font-semibold text-foreground">{title}</p>}
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-foreground">
            <CheckCircle2 className="shrink-0 text-primary" size={18} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Verify lint + commit**

```bash
pnpm lint
git add "app/s/[shortId]/components/blocks/checklist-block-view.tsx"
git commit -m "feat: ChecklistBlockView"
```

---

## Chunk 5: Wiring — palette, modal, renderer + palette improvements

### Task 21: Update block-editor-modal.tsx

**Files:**
- Modify: `app/wishlist/components/constructor/block-editor-modal.tsx`

- [ ] **Step 1: Add imports and new block branches**

Replace `block-editor-modal.tsx` with:

```tsx
'use client'

import { AgendaBlockEditor } from '@/app/wishlist/components/constructor/blocks/agenda-block-editor'
import { ChecklistBlockEditor } from '@/app/wishlist/components/constructor/blocks/checklist-block-editor'
import { ColorSchemeBlockEditor } from '@/app/wishlist/components/constructor/blocks/color-scheme-block-editor'
import { ContactBlockEditor } from '@/app/wishlist/components/constructor/blocks/contact-block-editor'
import { DateBlockEditor } from '@/app/wishlist/components/constructor/blocks/date-block-editor'
import { DividerBlockEditor } from '@/app/wishlist/components/constructor/blocks/divider-block-editor'
import { GalleryBlockEditor } from '@/app/wishlist/components/constructor/blocks/gallery-block-editor'
import { ImageBlockEditor } from '@/app/wishlist/components/constructor/blocks/image-block-editor'
import { LocationBlockEditor } from '@/app/wishlist/components/constructor/blocks/location-block-editor'
import { QuoteBlockEditor } from '@/app/wishlist/components/constructor/blocks/quote-block-editor'
import { TextBlockEditor } from '@/app/wishlist/components/constructor/blocks/text-block-editor'
import { TextImageBlockEditor } from '@/app/wishlist/components/constructor/blocks/text-image-block-editor'
import { TimingBlockEditor } from '@/app/wishlist/components/constructor/blocks/timing-block-editor'
import { VideoBlockEditor } from '@/app/wishlist/components/constructor/blocks/video-block-editor'
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
  color_scheme: 'Дресс-код / Цвета',
  timing: 'Таймер',
  agenda: 'Программа вечера',
  gallery: 'Галерея',
  quote: 'Цитата',
  divider: 'Разделитель',
  contact: 'Контакт',
  video: 'Видео',
  checklist: 'Чеклист',
}

type Props = {
  block: Block
  open: boolean
  onClose: () => void
  onSave: (data: Record<string, unknown>) => void
}

export function BlockEditorModal({ block, open, onClose, onSave }: Props) {
  const [data, setData] = useState<Record<string, unknown>>(block.data)

  React.useEffect(() => {
    setData(block.data)
  }, [block])

  const handleSave = () => {
    onSave(data)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
          {block.type === 'agenda' && <AgendaBlockEditor data={data} onChange={setData} />}
          {block.type === 'gallery' && <GalleryBlockEditor data={data} onChange={setData} />}
          {block.type === 'quote' && <QuoteBlockEditor data={data} onChange={setData} />}
          {block.type === 'divider' && <DividerBlockEditor data={data} onChange={setData} />}
          {block.type === 'contact' && <ContactBlockEditor data={data} onChange={setData} />}
          {block.type === 'video' && <VideoBlockEditor data={data} onChange={setData} />}
          {block.type === 'checklist' && <ChecklistBlockEditor data={data} onChange={setData} />}
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

- [ ] **Step 2: Verify lint**

```bash
pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/components/constructor/block-editor-modal.tsx
git commit -m "feat: register all new block editors in modal"
```

---

### Task 22: Update block-renderer.tsx

**Files:**
- Modify: `app/s/[shortId]/components/blocks/block-renderer.tsx`

- [ ] **Step 1: Add all new view imports and branches**

```tsx
import { AgendaBlockView } from '@/app/s/[shortId]/components/blocks/agenda-block-view'
import { ChecklistBlockView } from '@/app/s/[shortId]/components/blocks/checklist-block-view'
import { ColorSchemeBlockView } from '@/app/s/[shortId]/components/blocks/color-scheme-block-view'
import { ContactBlockView } from '@/app/s/[shortId]/components/blocks/contact-block-view'
import { DateBlockView } from '@/app/s/[shortId]/components/blocks/date-block-view'
import { DividerBlockView } from '@/app/s/[shortId]/components/blocks/divider-block-view'
import { GalleryBlockView } from '@/app/s/[shortId]/components/blocks/gallery-block-view'
import { ImageBlockView } from '@/app/s/[shortId]/components/blocks/image-block-view'
import { LocationBlockView } from '@/app/s/[shortId]/components/blocks/location-block-view'
import { QuoteBlockView } from '@/app/s/[shortId]/components/blocks/quote-block-view'
import { TextBlockView } from '@/app/s/[shortId]/components/blocks/text-block-view'
import { TextImageBlockView } from '@/app/s/[shortId]/components/blocks/text-image-block-view'
import { TimingBlockView } from '@/app/s/[shortId]/components/blocks/timing-block-view'
import { VideoBlockView } from '@/app/s/[shortId]/components/blocks/video-block-view'
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
          {block.type === 'agenda' && <AgendaBlockView block={block} />}
          {block.type === 'gallery' && <GalleryBlockView block={block} />}
          {block.type === 'quote' && <QuoteBlockView block={block} />}
          {block.type === 'divider' && <DividerBlockView block={block} />}
          {block.type === 'contact' && <ContactBlockView block={block} />}
          {block.type === 'video' && <VideoBlockView block={block} />}
          {block.type === 'checklist' && <ChecklistBlockView block={block} />}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify lint**

```bash
pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add app/s/\[shortId\]/components/blocks/block-renderer.tsx
git commit -m "feat: register all new block views in BlockRenderer"
```

---

### Task 23: Update block-palette.tsx with improved previews

**Files:**
- Modify: `app/wishlist/components/constructor/block-palette.tsx`

- [ ] **Step 1: Replace PALETTE_ITEMS with improved previews + new types**

```tsx
// app/wishlist/components/constructor/block-palette.tsx
'use client'

import { Block, BlockType } from '@/shared/types'
import React from 'react'

type PaletteItem = {
  type: BlockType
  label: string
  icon: string
  preview: React.ReactNode
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'text',
    label: 'Текст',
    icon: '📝',
    preview: (
      <p className="text-xs text-muted-foreground border-l-2 border-primary pl-2 leading-snug italic">
        Добавь описание праздника, пожелания гостям...
      </p>
    ),
  },
  {
    type: 'image',
    label: 'Картинка',
    icon: '🖼',
    preview: (
      <div className="w-full h-10 rounded bg-gradient-to-r from-pink-100 to-purple-100 flex items-center justify-center text-lg">
        🌅
      </div>
    ),
  },
  {
    type: 'text_image',
    label: 'Текст + фото',
    icon: '📝',
    preview: (
      <div className="flex gap-2 items-center">
        <p className="text-xs text-muted-foreground flex-1 leading-snug border-l-2 border-primary pl-2 italic">Текст рядом с фото...</p>
        <div className="w-8 h-8 rounded bg-gradient-to-br from-pink-100 to-purple-100 shrink-0" />
      </div>
    ),
  },
  {
    type: 'date',
    label: 'Дата',
    icon: '📅',
    preview: <p className="text-xs text-primary font-semibold">📅 15 марта 2025, 18:00</p>,
  },
  {
    type: 'location',
    label: 'Место',
    icon: '📍',
    preview: <p className="text-xs text-primary font-semibold">📍 Кафе «Уют», Москва</p>,
  },
  {
    type: 'color_scheme',
    label: 'Дресс-код',
    icon: '🎨',
    preview: (
      <div className="flex gap-1.5 items-center">
        {['#FF6B9D', '#C4A8FF', '#FFE566', '#A8E6CF'].map((c) => (
          <div key={c} className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ background: c }} />
        ))}
        <span className="text-xs text-muted-foreground ml-1">+ свои цвета</span>
      </div>
    ),
  },
  {
    type: 'timing',
    label: 'Таймер',
    icon: '⏱',
    preview: (
      <div className="flex gap-1">
        {['22 дн', '4 ч', '33 мин'].map((t) => (
          <div key={t} className="bg-primary/10 rounded px-1.5 py-0.5 text-xs font-bold text-primary">{t}</div>
        ))}
      </div>
    ),
  },
  {
    type: 'agenda',
    label: 'Программа',
    icon: '📋',
    preview: (
      <div className="space-y-1">
        {[['18:00', 'Встреча гостей'], ['19:00', 'Ужин'], ['21:00', '🎂 Торт!']].map(([t, text]) => (
          <div key={t} className="flex gap-2 text-xs">
            <span className="text-primary font-semibold min-w-[34px]">{t}</span>
            <span className="text-muted-foreground">{text}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    type: 'gallery',
    label: 'Галерея',
    icon: '🖼',
    preview: (
      <div className="grid grid-cols-3 gap-0.5 rounded overflow-hidden">
        {['from-pink-100 to-rose-200', 'from-purple-100 to-violet-200', 'from-yellow-100 to-amber-200',
          'from-green-100 to-emerald-200', 'from-blue-100 to-cyan-200'].map((g, i) => (
          <div key={i} className={`h-5 bg-gradient-to-br ${g} ${i === 0 ? 'col-span-2' : ''}`} />
        ))}
      </div>
    ),
  },
  {
    type: 'quote',
    label: 'Цитата',
    icon: '💬',
    preview: (
      <p className="text-xs italic text-muted-foreground border-l-2 border-primary pl-2">
        «Лучший праздник — тот, куда зовут лучших...»
      </p>
    ),
  },
  {
    type: 'divider',
    label: 'Разделитель',
    icon: '➖',
    preview: (
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    ),
  },
  {
    type: 'contact',
    label: 'Контакт',
    icon: '👤',
    preview: (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">АС</div>
        <div>
          <p className="text-xs font-semibold leading-none">Алина Смирнова</p>
          <p className="text-[10px] text-muted-foreground">Организатор</p>
        </div>
      </div>
    ),
  },
  {
    type: 'video',
    label: 'Видео',
    icon: '▶️',
    preview: (
      <div className="w-full h-9 rounded bg-gray-900 flex items-center justify-center">
        <div className="w-5 h-5 bg-white/90 rounded-full flex items-center justify-center">
          <span className="text-[8px] text-gray-900 ml-0.5">▶</span>
        </div>
      </div>
    ),
  },
  {
    type: 'checklist',
    label: 'Чеклист',
    icon: '✅',
    preview: (
      <div className="space-y-0.5">
        {['Оделись красиво', 'Купили подарок', 'Не опоздали'].map((item, i) => (
          <div key={item} className="flex gap-1.5 items-center text-xs">
            <span className={i < 2 ? 'text-green-500' : 'text-muted-foreground'}>
              {i < 2 ? '✓' : '○'}
            </span>
            <span className="text-muted-foreground">{item}</span>
          </div>
        ))}
      </div>
    ),
  },
]

type Props = {
  onAdd: (block: Block) => void
  existingCount: number
}

export function BlockPalette({ onAdd, existingCount }: Props) {
  const handleAdd = (type: BlockType) => {
    onAdd({ type, position: existingCount, colSpan: 1, rowSpan: 1, data: {} })
  }

  return (
    <div className="w-56 shrink-0 space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Блоки
      </h3>
      {PALETTE_ITEMS.map((item) => (
        <button
          key={item.type}
          type="button"
          onClick={() => handleAdd(item.type)}
          className="w-full text-left rounded-lg border bg-card p-3 hover:border-primary/50 hover:bg-accent/30 transition-colors space-y-1.5"
        >
          <span className="text-xs font-semibold text-foreground">{item.icon} {item.label}</span>
          <div>{item.preview}</div>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify lint**

```bash
pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/components/constructor/block-palette.tsx
git commit -m "feat: improved block palette with visual previews for all 14 block types"
```

---

### Task 24: Final build verification

- [ ] **Step 1: Full lint + build**

```bash
pnpm lint && pnpm build
```

Expected: both pass with no errors.

- [ ] **Step 2: Manual smoke test**

```bash
pnpm dev
```

1. Open `http://localhost:3000/wishlist`
2. Open a wishlist in edit/create mode
3. Verify all 14 block types appear in the palette with previews
4. Add a Text block → open editor → verify Tiptap toolbar (B/I/U/H2/H3) appears
5. Add a Timing block → open editor → set a future date → save → switch to Preview → verify countdown ticks
6. Add a Color scheme block → open editor → add 3 colors via color picker → save → verify circles in canvas
7. Add an Agenda block → add 3 items → save → verify in canvas
8. Add a Gallery block → add 2 images → save → verify thumbnails in canvas
9. Add remaining new blocks (Quote, Divider, Contact, Video, Checklist) → verify editors open and save

- [ ] **Step 3: Commit docs**

```bash
git add docs/superpowers/
git commit -m "docs: constructor improvements spec and plan"
```
