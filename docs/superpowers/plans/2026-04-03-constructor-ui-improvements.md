# Constructor UI Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Four targeted UI improvements to the wishlist constructor: sticky tabs, bigger toolbar icons, delete confirmation dialog, and richer block content previews.

**Architecture:** All changes are contained to 3 existing files. No new files, no new abstractions. `block-toolbar.tsx` fires `onDeleteRequest` instead of directly deleting — the actual delete happens only after AlertDialog confirmation in `block-item.tsx`.

**Tech Stack:** Next.js 16 App Router, React, Tailwind CSS, shadcn/ui AlertDialog (already installed at `components/ui/alert-dialog.tsx`), Lucide icons.

---

## File Map

| File | What changes |
|---|---|
| `app/wishlist/components/constructor-editor.tsx` | Tabs div gets sticky classes |
| `app/wishlist/components/constructor/block-toolbar.tsx` | Prop `onDelete` → `onDeleteRequest`, icons size 14→16, button padding p-0.5→p-1.5 |
| `app/wishlist/components/constructor/block-item.tsx` | AlertDialog state + dialog markup, wire `onDeleteRequest` to toolbar, fix text/text_image previews |

---

## Task 1: Sticky tabs

**Files:**
- Modify: `app/wishlist/components/constructor-editor.tsx`

- [ ] **Step 1: Replace the tabs wrapper div**

In `constructor-editor.tsx`, replace lines 60–75 (the outer `<div className="flex items-center gap-2">` that wraps all three tab buttons) with:

```tsx
<div className="sticky top-[52px] z-40 bg-background/95 backdrop-blur-sm py-2 -mx-5 px-5 border-b border-border/40 flex items-center gap-2">
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
```

The outer wrapper of `ConstructorEditor` is `<div className="space-y-4">`. The sticky bar uses `-mx-5 px-5` to bleed to the edges of the layout's `p-5` padding, keeping the background seamless.

- [ ] **Step 2: Verify manually**

Run `pnpm dev`, open any wishlist edit page, scroll down past the tabs. The tabs row should stay pinned below the site header and the background should be semi-transparent with blur.

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/components/constructor-editor.tsx
git commit -m "feat: sticky constructor tabs"
```

---

## Task 2: Bigger edit/delete icons in toolbar

**Files:**
- Modify: `app/wishlist/components/constructor/block-toolbar.tsx`

- [ ] **Step 1: Update the Props type and function signature**

Replace the entire file content with:

```tsx
'use client'

import { Block } from '@/shared/types'
import { Pencil, Trash2 } from 'lucide-react'
import React from 'react'

type Props = {
  block: Block
  onResize: (colSpan: 1 | 2) => void
  onEdit: () => void
  onDeleteRequest: () => void
}

export function BlockToolbar({ block, onResize, onEdit, onDeleteRequest }: Props) {
  const currentCol = block.colSpan ?? 1

  return (
    <div className="absolute -top-9 right-0 z-20 flex items-center gap-1 bg-popover border border-border rounded-lg px-2 py-1 shadow-md">
      {/* Width toggle */}
      {([1, 2] as const).map((cs) => {
        const active = cs === currentCol
        return (
          <button
            key={cs}
            type="button"
            onClick={() => onResize(cs)}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {cs === 1 ? '1 кол.' : 'Вся шир.'}
          </button>
        )
      })}

      <div className="w-px h-4 bg-border mx-1" />

      {/* Edit */}
      <button type="button" onClick={onEdit} className="p-1.5 text-muted-foreground hover:text-foreground">
        <Pencil size={16} />
      </button>

      {/* Delete */}
      <button type="button" onClick={onDeleteRequest} className="p-1.5 text-muted-foreground hover:text-destructive">
        <Trash2 size={16} />
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify manually**

Reload the editor, click a block to focus it. The floating toolbar should appear. The edit (pencil) and delete (trash) icons should be visibly larger and have more padding around them.

- [ ] **Step 3: Commit**

```bash
git add app/wishlist/components/constructor/block-toolbar.tsx
git commit -m "feat: bigger edit/delete icons in block toolbar"
```

---

## Task 3: Delete confirmation dialog

**Files:**
- Modify: `app/wishlist/components/constructor/block-item.tsx`

- [ ] **Step 1: Add AlertDialog imports**

At the top of `block-item.tsx`, after the existing imports, add:

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
```

- [ ] **Step 2: Add deleteConfirmOpen state**

Inside `BlockItem`, after the existing `const [editOpen, setEditOpen] = useState(false)` line, add:

```tsx
const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
```

- [ ] **Step 3: Update BlockToolbar usage to use onDeleteRequest**

In the JSX inside `BlockItem`, find the `<BlockToolbar` usage and change `onDelete={onDelete}` to `onDeleteRequest={() => setDeleteConfirmOpen(true)}`:

```tsx
{focused && (
  <BlockToolbar
    block={block}
    onResize={onResize}
    onEdit={() => { setEditOpen(true); onFocusChange(false) }}
    onDeleteRequest={() => setDeleteConfirmOpen(true)}
  />
)}
```

- [ ] **Step 4: Add the AlertDialog after BlockEditorModal**

After the closing `</BlockEditorModal>` tag (but still inside the fragment `<>`), add:

```tsx
<AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Удалить блок?</AlertDialogTitle>
      <AlertDialogDescription>Это действие нельзя отменить.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Отмена</AlertDialogCancel>
      <AlertDialogAction
        onClick={() => { onDelete(); setDeleteConfirmOpen(false) }}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Удалить
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

- [ ] **Step 5: Verify manually**

In the editor, focus a block, click the trash icon. A modal should appear with "Удалить блок?" and two buttons. Clicking "Отмена" closes the modal without deleting. Clicking "Удалить" removes the block.

- [ ] **Step 6: Commit**

```bash
git add app/wishlist/components/constructor/block-item.tsx
git commit -m "feat: delete confirmation dialog for blocks"
```

---

## Task 4: Richer block content preview

**Files:**
- Modify: `app/wishlist/components/constructor/block-item.tsx`

- [ ] **Step 1: Fix the `text` block preview**

In the `getPreview` function at the bottom of `block-item.tsx`, replace the `case 'text':` branch:

```tsx
case 'text': {
  if (d.html as string) {
    const plain = (d.html as string).replace(/<[^>]*>/g, '').trim()
    return plain || 'Нет текста'
  }
  return (d.content as string) || 'Нет текста'
}
```

- [ ] **Step 2: Fix the `text_image` block preview**

Replace the `case 'text_image':` branch:

```tsx
case 'text_image': {
  const plain = d.html
    ? (d.html as string).replace(/<[^>]*>/g, '').trim()
    : (d.content as string) ?? ''
  return (
    <div className="flex items-start gap-2">
      {d.imageUrl && (
        <img
          src={d.imageUrl as string}
          alt=""
          className="w-10 h-10 object-cover rounded flex-shrink-0"
        />
      )}
      <span>{plain || 'Текст + картинка'}</span>
    </div>
  )
}
```

- [ ] **Step 3: Verify manually**

1. Open a block with rich text (text or text_image) in the editor. The card should now show the actual plain text instead of "Текст (HTML)".
2. Open a text_image block that has an image. The card should show a small thumbnail alongside the text.
3. Open a block with no content — should show the fallback string ("Нет текста" or "Текст + картинка").

- [ ] **Step 4: Commit**

```bash
git add app/wishlist/components/constructor/block-item.tsx
git commit -m "feat: richer block preview - strip HTML, show text_image thumbnail"
```

---

## Done

All 4 improvements complete. Run `pnpm lint` to confirm no lint errors:

```bash
pnpm lint
```
