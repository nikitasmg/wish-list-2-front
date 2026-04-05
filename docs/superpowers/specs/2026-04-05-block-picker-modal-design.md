# Block Picker Modal — Design Spec

**Date:** 2026-04-05

## Overview

Add a new flow for inserting blocks into the constructor: each empty cell gets a persistent `+` button. Clicking it opens a modal with all available block types; selecting a block places it at that exact cell position.

The existing BlockPalette sidebar flow is preserved — it still adds a block to the first available empty cell.

## Requirements

- Every empty cell always shows a `+` button (not hover-only)
- The canvas always has at least one fully empty row at the bottom (both cols free); if the last row is fully occupied, a new empty row is appended
- Clicking `+` opens `BlockPickerModal` bound to that cell's `(row, col)`
- The modal shows all block types as large cards (2-column grid) with existing preview and label; clicking a card places the block at the target cell and closes the modal
- During an active DnD drag (`isDragActive=true`) the `+` button is hidden and the empty cell acts as a drop target only (existing behaviour)

## Architecture

### New files

| File | Purpose |
|---|---|
| `app/wishlist/components/constructor/block-picker-modal.tsx` | Dialog with block type cards |

### Modified files

| File | Change |
|---|---|
| `empty-cell.tsx` | Add `onAdd?: () => void` prop; render `+` button; hide during drag |
| `block-canvas.tsx` | Pass `onAdd` to `EmptyCell`; add `handleAddAt(block, row, col)`; update `emptyCells` memo to guarantee ≥1 empty row at bottom |
| `block-palette.tsx` | Export `PALETTE_ITEMS` so both palette and modal share the same source of truth |

## Data Flow

```
EmptyCell (row, col)
  └─ "+" onClick → opens BlockPickerModal(targetRow, targetCol)
       └─ user selects block type → onAdd(block, row, col)
            └─ handleAddAt(block, row, col) in BlockCanvas
                 └─ syncBlocks([...blocks, { ...block, row, col }])
```

`handleAddAt` is a new method alongside the existing `handleAdd`. It accepts explicit `row` and `col` coordinates instead of calling `findFirstEmptyCell`.

## Empty Row Guarantee

In the `emptyCells` memo in `BlockCanvas`, after computing the normal empty cells, check whether any empty cell exists in the last row. If the last row is fully occupied, increment `rowCount` by 1 so two new empty cells (`row: rowCount, col: 0` and `row: rowCount, col: 1`) are appended.

## BlockPickerModal UI

- Uses `Dialog` from shadcn/ui
- Title: "Выберите блок"
- Body: 2-column grid of block cards
- Each card: block `label` + existing `preview` node (same as palette), larger padding
- On card click: call `onSelect(blockType)`, close dialog

## EmptyCell UI States

| State | Border | `+` button |
|---|---|---|
| Default | `border-dashed border-border/40` | `text-muted-foreground/40` |
| Hover | `border-primary/50` | `text-primary` |
| DnD over | `border-green-500/60 bg-green-500/10` | hidden |
| DnD active (not over) | `border-primary/40 bg-primary/5` | hidden |

## Out of Scope

- Search/filter inside the modal
- Block descriptions beyond existing label+preview
- Any changes to how the palette adds blocks
