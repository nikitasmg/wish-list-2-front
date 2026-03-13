# Spec: Constructor Improvements (Round 2)

**Date:** 2026-03-12
**Branch:** feature/constructor-wishlist

---

## Overview

8 targeted improvements to the wishlist constructor editor. Each item is independent and can be implemented separately.

---

## 1. Text Editor — Empty `src` Bug

**Problem:** Two separate issues:
1. Tiptap `useEditor` causes SSR/hydration mismatch in Next.js App Router, making the editor fail to mount.
2. Some image block editor passes an empty string `src` to an `<img>` element, triggering a Next.js warning. The exact source should be confirmed by searching for `src={` in `image-block-editor.tsx` and `text-image-block-editor.tsx` — the guard should be applied wherever `previewUrl` or a URL string is passed directly to `<img src>` without a non-empty check.

**Solution:**
- In `text-block-editor.tsx`: add `immediatelyRender: false` to the `useEditor` config to prevent the SSR hydration mismatch.
- In `image-block-editor.tsx` and `text-image-block-editor.tsx`: ensure `<img>` (or any `<Image>`) is only rendered when the URL string is non-empty. Apply the guard `{url && <img src={url} ... />}` wherever needed.

Note: The root cause of blob URLs in these editors is fully addressed in item 8. Item 1 is a complementary guard for the SSR/empty-src symptoms.

**Files:** `text-block-editor.tsx`, `image-block-editor.tsx`, `text-image-block-editor.tsx`

---

## 2. Timing Block — Only End Date

**Problem:** `TimingBlockEditor` has two fields "Начало" and "Конец". For a countdown timer, only the target date/time is needed. `TimingBlockView` is built around `start` as the primary field and returns `null` if `start` is absent.

**Solution:**

**Editor (`timing-block-editor.tsx`):**
- Remove the "Начало" field entirely.
- Keep only the `end` field, rename label to "Дата/время события".
- Block data shape changes from `{ start: string, end?: string }` to `{ end: string }`.

**View (`app/s/[shortId]/components/blocks/timing-block-view.tsx`):**
- Replace `start`-based logic with `end`-based logic:
  - If `!end` → return `null`.
  - Compute countdown to `end` date.
  - If `end` is in the future → show countdown timer (days/hours/minutes/seconds).
  - If `end` is in the past → show "Уже прошло".
  - Remove "ongoing" status (it required both start and end).
- Display the formatted `end` date/time.

**Legacy blocks:** Existing blocks that have `start` but no `end` will render `null` silently. Users will need to re-edit them. This is acceptable given the early stage of the feature.

**Types (`shared/types.ts`):** Update timing block data type from `{ start: string; end?: string }` to `{ end: string }`.

**Files:** `app/wishlist/components/constructor/blocks/timing-block-editor.tsx`, `app/s/[shortId]/components/blocks/timing-block-view.tsx`, `shared/types.ts`

---

## 3. Gallery Modal — No Scroll

**Problem:** When many photos are added to a gallery block, the editor modal content overflows with no scroll.

**Solution:**
- In `BlockEditorModal`, add `max-h-[60vh] overflow-y-auto` to the inner content `<div className="py-4">`.
- Also ensure the `DialogContent` wrapper has `overflow-hidden` so the scroll is correctly contained within the dialog boundary (shadcn's `DialogContent` may need this to clip overflow properly).

**Files:** `app/wishlist/components/constructor/block-editor-modal.tsx`

---

## 4. Color Scheme — Affects Whole Site

**Problem:** `WishlistLanding` applies the wishlist color scheme to `document.body` via `useEffect` (`document.body.classList.add(scheme)`). When `WishlistLanding` is rendered inside `ConstructorEditor`'s preview tab, this `useEffect` runs on the editor page, changing the editor's own theme.

**Solution:**
- Add a `disableBodyTheme?: boolean` prop to `WishlistLanding`.
- When `disableBodyTheme` is `true`, skip the entire `document.body.classList` mutation — both the `add` in the effect body and the `remove` in the cleanup. Since nothing is added, the cleanup remove is also a no-op and should be omitted to avoid confusion.
- The component's wrapper `<div>` already carries the scheme class directly, so preview content will still appear correctly themed without the body mutation.
- In `ConstructorEditor`, pass `disableBodyTheme` when rendering `WishlistLanding` in preview mode.

**Files:** `app/s/[shortId]/components/wishlist-landing.tsx`, `app/wishlist/components/constructor-editor.tsx`

---

## 5. Phone Validation in Contact Block

**Problem:** The phone field in `ContactBlockEditor` accepts any string with no validation.

**Solution:**
- Add local `phoneError` state.
- On blur of the phone field: validate against Russian phone formats (`+7XXXXXXXXXX`, `8XXXXXXXXXX`, `+7 (XXX) XXX-XX-XX`, etc.) using a regex.
- If the value is non-empty and invalid: set `phoneError` to show a red ring on the input and an error message below.
- If empty or valid: clear the error.
- Saving is not blocked — validation is advisory only.

**Files:** `app/wishlist/components/constructor/blocks/contact-block-editor.tsx`

---

## 6. Breadcrumbs on Constructor Page

**Problem:** The edit page `/wishlist/edit/[id]` has no breadcrumbs, making navigation harder.

**Solution:**
- In `edit/[id]/page.tsx`, add `<Breadcrumbs>` above the `<h2>` title, inside the `if (!wishlist) return null` guard (so it only renders after data loads — no skeleton needed).
- Props:
  - `items`: `[{ name: 'Мои вишлисты', url: '/wishlist' }, { name: wishlist.title, url: `/wishlist/${id}` }]`
  - `page`: `'Конструктор'`
- Result path: `Главная → Мои вишлисты → [wishlist.title] → Конструктор`
- `/wishlist/${id}` links to the wishlist detail page (`app/wishlist/[id]/page.tsx`), which is a real and useful intermediate destination.

**Files:** `app/wishlist/edit/[id]/page.tsx`

---

## 7. Gifts Tab in Constructor

**Problem:** Presents management is on a separate page `/wishlist/[id]`, with no direct access from the constructor.

**Solution:**
- In `ConstructorEditor` (where `presents` data is already available via `useApiGetAllPresents`), add a third tab "Подарки" (Gift icon) alongside "Редактор" and "Превью".
- The tab `mode` state gains a third value: `'editor' | 'preview' | 'presents'`.
- The gifts tab renders inside `ConstructorEditor` (not inside `BlockCanvas` or a sub-component), since `presents` is in scope there.
- Tab content:
  - "Добавить подарок" button that navigates to `/wishlist/${wishlist.id}/present/create` via `router.push`.
  - List of existing presents using `PresentCard` with edit/delete actions (reusing the existing component as-is).
- Navigation pattern: clicking "Добавить подарок" or "Редактировать" navigates away from the constructor. On return, the constructor page remounts and React Query re-fetches presents. This navigation-away-and-return pattern is intentional and acceptable.

**Files:** `app/wishlist/components/constructor-editor.tsx`

---

## 8. Photos Lost After Page Reload

**Problem:** `ImageUpload` and `GalleryBlockEditor` create `blob:` URLs via `URL.createObjectURL()` and store them in block data. These URLs expire when the browser session ends, causing broken images after page reload.

**Root cause:** The `blob:` URL is stored in block data and saved to the API. After reload, the API returns the expired `blob:` URL which the browser cannot resolve.

**Solution:**

### New API function: `uploadImage` in `api/upload.ts`
- Call `api.post<{ url: string }, FormData>('upload', fd)` — note: use `'upload'` (no leading slash), consistent with all other API calls in this codebase.
- `FormData` field name: `file` (matches backend `c.FormFile("file")`).
- Returns `{ url: string }` — a permanent MinIO URL.
- Implement as a plain `async` function (not a React Query hook), since it is called imperatively on file select.

### `ImageUpload` component changes (`components/image-upload.tsx`)
- Add `isUploading` local state (boolean).
- When a file is selected:
  1. Create a `blob:` URL for immediate local preview only (never stored or emitted).
  2. Set `isUploading = true`, show a spinner overlay on the preview area.
  3. Call `uploadImage(file)`.
  4. On success: call `onChange({ type: 'url', value: realUrl })`, set `isUploading = false`.
  5. On error: clear preview, set `isUploading = false`, show an error message.
- While uploading, disable the drop zone and URL input to prevent conflicting edits.
- After this change, `onChange` will never be called with `type: 'file'` — only with `type: 'url'`. The `type: 'file'` variant of `ImageUploadValue` can be kept in the type union for now but is effectively unused.
- URL input path (pasting a URL) remains a direct synchronous passthrough — no upload is triggered. This asymmetry is intentional and out of scope for this round.

### Consumer editors cleanup
- In `image-block-editor.tsx` and `text-image-block-editor.tsx`: remove the `else if (val?.type === 'file')` branches that previously called `URL.createObjectURL`. These branches are dead code after the `ImageUpload` change.

### `GalleryBlockEditor` changes (`gallery-block-editor.tsx`)
- Add per-slot `uploading` state (e.g. `Set<number>` or `Record<number, boolean>`).
- `GalleryBlockEditor` uses `<ImageUpload>` per slot. After the `ImageUpload` change, file uploads are handled automatically inside `ImageUpload`. The editor just needs to handle the updated `onChange` which always returns `type: 'url'`.
- Remove the `else if (val?.type === 'file') url = URL.createObjectURL(val.value)` branch in `updateImage`. After the fix, this branch is dead code.

**Files:** `api/upload.ts` (new), `components/image-upload.tsx`, `app/wishlist/components/constructor/blocks/gallery-block-editor.tsx`, `app/wishlist/components/constructor/blocks/image-block-editor.tsx`, `app/wishlist/components/constructor/blocks/text-image-block-editor.tsx`

---

## Implementation Order

Recommended order (easiest/most isolated first):

1. Breadcrumbs (trivial, 3 lines)
2. Gallery scroll (1 CSS change)
3. Timing block — remove start field + update view
4. Phone validation
5. Text editor SSR fix + empty src guard
6. Color scheme scope fix (`disableBodyTheme` prop)
7. Image upload on select (new API function + ImageUpload + consumer cleanup)
8. Gifts tab

---

## Non-Goals

- No bulk upload API usage in this round.
- No changes to present create/edit forms.
- No changes to public wishlist landing page visual styles.
- No new block types.
- No URL-input validation in `ImageUpload` (URL path remains a direct passthrough).
