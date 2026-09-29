# Constructor UI Improvements — Design Spec

Date: 2026-04-03

## Overview

Four targeted UI improvements to the wishlist constructor editor. All changes are minimal and contained to existing files.

## Files Changed

| File | Change |
|---|---|
| `app/wishlist/components/constructor-editor.tsx` | Sticky tabs |
| `app/wishlist/components/constructor/block-toolbar.tsx` | Bigger icons, delete fires `onDeleteRequest` |
| `app/wishlist/components/constructor/block-item.tsx` | Delete confirmation state + AlertDialog, HTML strip in preview, text_image thumbnail |

---

## 1. Sticky Tabs (`constructor-editor.tsx`)

The mode toggle row (Редактор / Превью / Подарки) becomes sticky below the app header.

- Wrap the tab row in a `div` with `sticky top-[52px] z-40 bg-background/95 backdrop-blur-sm py-2 -mx-5 px-5 border-b border-border/40`
- `top-[52px]` accounts for the header height (`py-2` + `h-8` button ≈ 52px)
- `-mx-5 px-5` compensates for the layout's `p-5` padding so the background fills edge-to-edge
- `border-b` appears permanently (no scroll detection needed at this level)

---

## 2. Bigger Edit / Delete Icons (`block-toolbar.tsx`)

The edit and delete buttons in the floating toolbar become easier to tap/click.

- Icon size: `14` → `16`
- Button padding: `p-0.5` → `p-1.5`
- The `onDelete` prop is renamed to `onDeleteRequest` in the toolbar's type; the toolbar calls `onDeleteRequest` and does NOT call the real delete directly

---

## 3. Delete Confirmation (`block-item.tsx`)

A confirmation dialog prevents accidental block deletion.

**State**: `const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)`

**Flow**:
1. User clicks Trash icon in `BlockToolbar` → `onDeleteRequest` → `setDeleteConfirmOpen(true)`
2. `AlertDialog` renders with:
   - Title: "Удалить блок?"
   - Description: "Это действие нельзя отменить."
   - Cancel: "Отмена" (closes dialog)
   - Confirm: "Удалить" (destructive variant, calls real `onDelete`, closes dialog)

**Props change**: `BlockToolbar` receives `onDeleteRequest: () => void` instead of `onDelete: () => void`. The real `onDelete` stays in `block-item.tsx` and is only invoked after confirmation.

---

## 4. Block Content Preview (`block-item.tsx`, `getPreview`)

**Text block (`text`)**:
- If `d.html` is present: strip tags via `(d.html as string).replace(/<[^>]*>/g, '').trim()`, show result (or "Нет текста" if empty after stripping)
- If `d.content` is present: show as plain text (unchanged)

**Text+Image block (`text_image`)**:
- Show image thumbnail if `d.imageUrl` exists: `<img src={d.imageUrl} className="w-10 h-10 object-cover rounded float-right ml-2" />`
- Show plain text content below/alongside it

All other block types: no change to existing preview logic.

---

## Out of Scope

- No changes to block editor modals
- No changes to drag-and-drop logic
- No refactoring of unrelated code
