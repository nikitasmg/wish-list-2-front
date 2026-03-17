import { Block } from '@/shared/types'

/**
 * Ensure blocks have valid coordinates. Returns as-is since legacy is not in prod.
 */
export function ensureCoords(blocks: Block[]): Block[] {
  return blocks
}

export function getMaxRow(blocks: Block[]): number {
  if (blocks.length === 0) return -1
  return Math.max(...blocks.map((b) => b.row))
}

export function getGridRowCount(blocks: Block[]): number {
  return getMaxRow(blocks) + 2
}

export function isCellOccupied(blocks: Block[], row: number, col: number): boolean {
  return blocks.some((b) => {
    if (b.row === row) {
      if (b.colSpan === 2) return true
      return b.col === col
    }
    return false
  })
}

export function findFirstEmptyCell(blocks: Block[]): { row: number; col: 0 | 1 } {
  const maxRow = getMaxRow(blocks)
  for (let r = 0; r <= maxRow + 1; r++) {
    if (!isCellOccupied(blocks, r, 0)) return { row: r, col: 0 }
    if (!isCellOccupied(blocks, r, 1)) return { row: r, col: 1 }
  }
  return { row: maxRow + 1, col: 0 }
}

export function pushBlocksDown(blocks: Block[], targetRow: number): Block[] {
  return blocks.map((b) => (b.row >= targetRow ? { ...b, row: b.row + 1 } : b))
}

export function moveBlock(
  blocks: Block[],
  blockIndex: number,
  targetRow: number,
  targetCol: 0 | 1,
): Block[] {
  const moving = blocks[blockIndex]
  const others = blocks.filter((_, i) => i !== blockIndex)

  if (moving.colSpan === 2) {
    const rowHasBlocks = others.some((b) => b.row === targetRow)
    const shifted = rowHasBlocks ? pushBlocksDown(others, targetRow) : others
    return [...shifted, { ...moving, row: targetRow, col: 0 as const }]
  }

  const cellTaken = others.some((b) => {
    if (b.row === targetRow) {
      if (b.colSpan === 2) return true
      return b.col === targetCol
    }
    return false
  })

  const shifted = cellTaken ? pushBlocksDown(others, targetRow) : others
  return [...shifted, { ...moving, row: targetRow, col: targetCol }]
}

export function mobileOrder(blocks: Block[]): Block[] {
  return [...blocks].sort((a, b) => a.row - b.row || a.col - b.col)
}

export function buildCellMap(blocks: Block[]): Map<string, number> {
  const map = new Map<string, number>()
  blocks.forEach((b, i) => {
    map.set(`${b.row},${b.col}`, i)
    if (b.colSpan === 2) {
      map.set(`${b.row},1`, i)
    }
  })
  return map
}
