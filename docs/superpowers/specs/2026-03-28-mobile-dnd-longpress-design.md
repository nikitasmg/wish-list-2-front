# Mobile DnD Long-Press Design

**Date:** 2026-03-28
**Status:** Approved

## Problem

On mobile the drag-and-drop in the wishlist constructor is hard to use:
1. The drag handle icon (`GripVertical`) is small and only appears after tapping to focus the card
2. Page scrolls simultaneously when trying to drag (no scroll lock)
3. Text on cards gets selected accidentally during interaction

## Solution

Apply drag listeners to the entire card div with a 500ms long-press delay, add haptic feedback on drag start, lock page scroll during drag, and prevent text selection on cards.

## Architecture

Three files change; no new files needed.

### `block-canvas.tsx`

- **TouchSensor delay**: `250ms → 500ms` — longer delay makes long-press feel intentional and avoids accidental drag during normal scrolling
- **`onDragStart`**: call `navigator.vibrate?.(40)` (40ms pulse, Android only — silently ignored on iOS) + `document.body.style.overflow = 'hidden'` to lock page scroll
- **`onDragEnd`**: restore `document.body.style.overflow = ''`
- **`onDragCancel`**: same as `onDragEnd` — restore `document.body.style.overflow = ''` to avoid leaving page scroll locked if drag is interrupted
- No change to `PointerSensor` (desktop unaffected)

### `block-item.tsx`

- Move `{...listeners}` and `{...attributes}` from toolbar onto the root card `div`
- Add `select-none` Tailwind class to the card `div` — prevents text selection during long-press
- Stop passing `dragListeners` / `dragAttributes` props to `<BlockToolbar>`

### `block-toolbar.tsx`

- Remove `dragListeners` and `dragAttributes` from the `Props` type
- Remove the `<button>` with `GripVertical` icon and its surrounding separator `div` entirely — it has no function now that the whole card is the drag handle

## Behavior After Change

| Scenario | Before | After |
|---|---|---|
| Mobile drag | Tap card → focus → find tiny grip icon → long-press grip | Long-press anywhere on card (500ms) → drag activates |
| Haptic feedback | None | 40ms vibration on drag start (Android) |
| Page scroll during drag | Scrolls together with block | Locked (`overflow: hidden` on body) |
| Text selection | Possible on card content | Prevented (`select-none`) |
| Desktop drag | Mouse down + move 8px on grip only | Mouse down + move 8px anywhere on card |

## Constraints

- `navigator.vibrate` is not available on iOS Safari — guarded with optional chaining `?.`
- `overflow: hidden` on body during drag: if drag is cancelled without `onDragEnd` firing, scroll stays locked. dnd-kit fires `onDragCancel` for this case — handle it the same as `onDragEnd`
- The `onDragCancel` handler must also restore body overflow

## Out of Scope

- Visual long-press progress indicator (progress ring, scale animation)
- Detecting touch vs pointer device to conditionally show/hide grip icon
