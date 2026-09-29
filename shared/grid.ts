import { Block } from '@/shared/types'

/**
 * Сетка страницы: две колонки, блок занимает одну или обе.
 *
 * Координаты хранятся в самих блоках, а не выводятся из порядка массива:
 * так блок остаётся на своём месте, даже если соседняя ячейка пуста — «два
 * блока в ряд, а дальше пусто» задумано, а не случайно вышло.
 */

export function getMaxRow(blocks: Block[]): number {
  if (blocks.length === 0) return -1
  return Math.max(...blocks.map(b => b.row))
}

/** Строк в сетке редактора: все занятые плюс одна пустая снизу. */
export function getGridRowCount(blocks: Block[]): number {
  return getMaxRow(blocks) + 2
}

export function isCellOccupied(blocks: Block[], row: number, col: number): boolean {
  return blocks.some(b => {
    if (b.row !== row) return false
    if (b.colSpan === 2) return true
    return b.col === col
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

/** Освободить строку: всё, что на ней и ниже, уезжает на строку вниз. */
export function pushBlocksDown(blocks: Block[], targetRow: number): Block[] {
  return blocks.map(b => (b.row >= targetRow ? { ...b, row: b.row + 1 } : b))
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
    const rowHasBlocks = others.some(b => b.row === targetRow)
    const shifted = rowHasBlocks ? pushBlocksDown(others, targetRow) : others
    return [...shifted, { ...moving, row: targetRow, col: 0 as const }]
  }

  const cellTaken = others.some(b => {
    if (b.row !== targetRow) return false
    if (b.colSpan === 2) return true
    return b.col === targetCol
  })

  const shifted = cellTaken ? pushBlocksDown(others, targetRow) : others
  return [...shifted, { ...moving, row: targetRow, col: targetCol }]
}

/**
 * Смена ширины блока. Растянуть на две колонки можно только освободив строку —
 * иначе блок наехал бы на соседа.
 */
export function resizeBlock(blocks: Block[], id: string, colSpan: 1 | 2): Block[] {
  const index = blocks.findIndex(b => b.id === id)
  if (index < 0) return blocks
  const block = blocks[index]
  if (colSpan === 1) {
    return blocks.map((b, i) => (i === index ? { ...b, colSpan: 1 as const } : b))
  }
  const others = blocks.filter((_, i) => i !== index)
  const rowHasOtherBlock = others.some(b => b.row === block.row)
  const shifted = rowHasOtherBlock ? pushBlocksDown(others, block.row) : others
  return [...shifted, { ...block, colSpan: 2 as const, col: 0 as const }]
}

/** Порядок чтения — он же порядок на телефоне: сверху вниз, слева направо. */
export function mobileOrder(blocks: Block[]): Block[] {
  return [...blocks].sort((a, b) => a.row - b.row || a.col - b.col)
}

/** Карта «строка,колонка» → индекс блока; блок в две колонки занимает обе. */
export function buildCellMap(blocks: Block[]): Map<string, number> {
  const map = new Map<string, number>()
  blocks.forEach((b, i) => {
    map.set(`${b.row},${b.col}`, i)
    if (b.colSpan === 2) map.set(`${b.row},1`, i)
  })
  return map
}
