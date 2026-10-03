import { newBlockId } from './ids'
import type { Block, RowRatio, RowSettings } from './types'

/**
 * Раскладка страницы: ряды, в ряду от одной до трёх колонок.
 *
 * Координаты по-прежнему живут в блоках (row, col), а настройки ряда — рядом,
 * в массиве по номеру ряда. Так их и хранит бэк: блоки и ряды уходят одним
 * запросом под одной версией, поэтому номер ряда не разъедется с настройками.
 *
 * Все операции возвращают новую раскладку и не трогают исходную: из снимков
 * собрана история «Отменить / Повторить».
 */
export type Layout = { blocks: Block[]; rows: RowSettings[] }

/** Ряд для отрисовки: настройки и ячейки по колонкам, пустая ячейка — null. */
export type RowView = { index: number; settings: RowSettings; cells: (Block | null)[] }

type Row = { settings: RowSettings; cells: (Block | null)[] }

export const MAX_COLUMNS = 3

const RATIOS: Record<number, RowRatio[]> = {
  1: [''],
  2: ['', '1:1', '2:1', '1:2'],
  3: ['', '1:1:1'],
}

/** Пропорции, к которым прилипает разделитель, для этого числа колонок. */
export function ratiosFor(columns: number): RowRatio[] {
  return RATIOS[columns] ?? ['']
}

function cleanSettings(settings: RowSettings, columns: number): RowSettings {
  const ratio = ratiosFor(columns).includes(settings.ratio ?? '') ? settings.ratio ?? '' : ''
  return {
    columns,
    ratio,
    height: settings.height ?? '',
    gap: settings.gap ?? '',
    mobileReverse: settings.mobileReverse ?? false,
  }
}

/**
 * Привести блоки и ряды к виду v3: ряды подряд с нуля, у каждого ряда записаны
 * настройки, у каждого блока colSpan 1.
 *
 * Формат v2 настроек рядов не знал: широкий блок там — ряд из одной колонки,
 * два блока — ряд из двух, одинокий узкий блок — узкий блок во всю строку.
 */
export function normalizeLayout(blocks: Block[], rows: RowSettings[] | null = []): Layout {
  const byRow = new Map<number, Block[]>()
  for (const block of blocks) {
    const list = byRow.get(block.row) ?? []
    list.push(block)
    byRow.set(block.row, list)
  }

  const result: Row[] = []
  for (const rowIndex of Array.from(byRow.keys()).sort((a, b) => a - b)) {
    const group = byRow.get(rowIndex)!.slice().sort((a, b) => a.col - b.col)
    const explicit = rows?.[rowIndex]
    if (explicit?.columns) {
      const columns = Math.min(MAX_COLUMNS, Math.max(1, explicit.columns))
      const cells: (Block | null)[] = Array(columns).fill(null)
      const overflow: Block[] = []
      for (const block of group) {
        const wanted = block.col >= 0 && block.col < columns && !cells[block.col] ? block.col : cells.indexOf(null)
        if (wanted < 0) overflow.push(block)
        else cells[wanted] = block
      }
      result.push({ settings: explicit, cells })
      for (const block of overflow) result.push({ settings: { columns: 1 }, cells: [block] })
      continue
    }

    if (group.length === 1) {
      const [block] = group
      const narrow = (block.colSpan ?? 1) < 2 && !block.width
      result.push({ settings: { columns: 1 }, cells: [narrow ? { ...block, width: 'narrow' } : block] })
      continue
    }
    for (let i = 0; i < group.length; i += MAX_COLUMNS) {
      const chunk = group.slice(i, i + MAX_COLUMNS)
      result.push({ settings: { columns: chunk.length }, cells: chunk })
    }
  }
  return fromRows(result)
}

function toRows(layout: Layout): Row[] {
  return layoutRows(layout).map(({ settings, cells }) => ({ settings, cells: [...cells] }))
}

/** Ряды → раскладка: пустые ряды выпадают, номера и колонки проставляются заново. */
function fromRows(list: Row[]): Layout {
  const blocks: Block[] = []
  const rows: RowSettings[] = []
  for (const row of list) {
    if (!row.cells.some(Boolean)) continue
    const index = rows.length
    rows.push(cleanSettings(row.settings, row.cells.length))
    row.cells.forEach((cell, col) => {
      if (cell) blocks.push({ ...cell, row: index, col, colSpan: 1 })
    })
  }
  return { blocks, rows }
}

/** Ряды для отрисовки. Раскладка считается нормализованной. */
export function layoutRows(layout: Layout): RowView[] {
  return layout.rows.map((settings, index) => {
    const cells: (Block | null)[] = Array(settings.columns ?? 1).fill(null)
    for (const block of layout.blocks) {
      if (block.row === index && block.col < cells.length) cells[block.col] = block
    }
    return { index, settings, cells }
  })
}

function locate(list: Row[], id: string): [number, number] {
  for (let r = 0; r < list.length; r++) {
    const c = list[r].cells.findIndex(cell => cell?.id === id)
    if (c >= 0) return [r, c]
  }
  return [-1, -1]
}

/** Вынуть ячейку из ряда. Колонка уходит вместе с блоком: сосед растягивается. */
function extract(list: Row[], r: number, c: number): Block {
  const row = list[r]
  const block = row.cells[c]!
  const cells = row.cells.filter((_, i) => i !== c)
  list[r] = { settings: { ...row.settings, ratio: '' }, cells }
  return block
}

/** Номер ряда блока или -1. */
export function blockRow(layout: Layout, id: string): number {
  return layout.blocks.find(b => b.id === id)?.row ?? -1
}

/** Новый ряд из одного блока перед рядом at (at = число рядов — в самый низ). */
export function insertRow(layout: Layout, at: number, block: Block): Layout {
  const list = toRows(layout)
  list.splice(Math.max(0, Math.min(at, list.length)), 0, { settings: { columns: 1 }, cells: [block] })
  return fromRows(list)
}

/** Блок в пустую ячейку; если она занята — отдельным рядом ниже. */
export function addToCell(layout: Layout, rowIndex: number, col: number, block: Block): Layout {
  const list = toRows(layout)
  const row = list[rowIndex]
  if (!row) return insertRow(layout, list.length, block)
  if (row.cells[col] === null) {
    row.cells[col] = block
    return fromRows(list)
  }
  list.splice(rowIndex + 1, 0, { settings: { columns: 1 }, cells: [block] })
  return fromRows(list)
}

/**
 * Перенос блока отдельным рядом в промежуток at (0 — над первым рядом,
 * число рядов — под последним). Номер промежутка — в текущей раскладке.
 */
export function moveToRow(layout: Layout, id: string, at: number): Layout {
  const list = toRows(layout)
  const [r, c] = locate(list, id)
  if (r < 0) return layout
  const alone = list[r].cells.filter(Boolean).length === 1
  // Одиночный блок в соседний промежуток — это то же место.
  if (alone && (at === r || at === r + 1)) return layout
  const block = extract(list, r, c)
  list.splice(at, 0, { settings: { columns: 1 }, cells: [block] })
  return fromRows(list)
}

/**
 * Перенос в конкретную ячейку. Пустая — блок встаёт в неё; занятая — отдельным
 * рядом сразу под рядом этой ячейки.
 */
export function moveToCell(layout: Layout, id: string, rowIndex: number, col: number): Layout {
  const list = toRows(layout)
  const [r, c] = locate(list, id)
  if (r < 0 || !list[rowIndex]) return layout
  if (r === rowIndex) {
    // В своём ряду колонки не схлопываются: блок просто пересаживается.
    if (c === col || list[r].cells[col] !== null) return layout
    const cells = [...list[r].cells]
    cells[col] = cells[c]
    cells[c] = null
    list[r] = { ...list[r], cells }
    return fromRows(list)
  }
  const block = extract(list, r, c)
  const target = list[rowIndex]
  if (target.cells[col] === null) {
    const cells = [...target.cells]
    cells[col] = block
    list[rowIndex] = { ...target, cells }
  } else {
    list.splice(rowIndex + 1, 0, { settings: { columns: 1 }, cells: [block] })
  }
  return fromRows(list)
}

/**
 * «Поставить рядом»: блок встаёт в ряд цели слева или справа от неё.
 * В ряду не больше трёх колонок — сверх этого операция ничего не делает.
 */
export function placeBeside(layout: Layout, id: string, targetId: string, side: 'left' | 'right'): Layout {
  if (id === targetId) return layout
  const list = toRows(layout)
  const [r, c] = locate(list, id)
  const [tr] = locate(list, targetId)
  if (r < 0 || tr < 0) return layout

  const sameRow = r === tr
  const target = list[tr]
  const occupied = target.cells.filter(Boolean).length
  if (!sameRow && occupied >= MAX_COLUMNS) return layout

  const block = sameRow ? target.cells[c]! : extract(list, r, c)
  const row = list[tr]
  const cells = sameRow ? row.cells.filter((_, i) => i !== c) : [...row.cells]
  const at = cells.findIndex(cell => cell?.id === targetId) + (side === 'right' ? 1 : 0)
  cells.splice(at, 0, block)
  // Пустая ячейка уступает место, а не раздувает ряд сверх трёх колонок.
  while (cells.length > MAX_COLUMNS) {
    const empty = cells.indexOf(null)
    if (empty < 0) return layout
    cells.splice(empty, 1)
  }
  const ratio = cells.length === row.cells.length ? row.settings.ratio : ''
  list[tr] = { settings: { ...row.settings, ratio }, cells }
  return fromRows(list)
}

/**
 * «Выше / Ниже» и Alt+стрелки. Одиночный блок меняется рядами с соседом —
 * настройки едут вместе с рядом. Блок из ряда с соседями выходит отдельным
 * рядом над или под своим.
 */
export function nudge(layout: Layout, id: string, direction: -1 | 1): Layout {
  const list = toRows(layout)
  const [r, c] = locate(list, id)
  if (r < 0) return layout
  if (list[r].cells.filter(Boolean).length > 1) {
    const block = extract(list, r, c)
    list.splice(direction < 0 ? r : r + 1, 0, { settings: { columns: 1 }, cells: [block] })
    return fromRows(list)
  }
  const other = r + direction
  if (other < 0 || other >= list.length) return layout
  ;[list[r], list[other]] = [list[other], list[r]]
  return fromRows(list)
}

/** Поменять ряды местами целиком. */
export function moveRow(layout: Layout, index: number, direction: -1 | 1): Layout {
  const list = toRows(layout)
  const other = index + direction
  if (!list[index] || other < 0 || other >= list.length) return layout
  ;[list[index], list[other]] = [list[other], list[index]]
  return fromRows(list)
}

/**
 * Настройки ряда. Если колонок стало меньше, чем блоков, сначала уходят пустые
 * ячейки, затем лишние блоки — отдельными рядами сразу ниже, ничего не теряется.
 */
export function updateRow(layout: Layout, index: number, patch: RowSettings): Layout {
  const list = toRows(layout)
  const row = list[index]
  if (!row) return layout
  const cells = [...row.cells]
  const overflow: Block[] = []
  if (patch.columns !== undefined) {
    const columns = Math.min(MAX_COLUMNS, Math.max(1, patch.columns))
    while (cells.length < columns) cells.push(null)
    while (cells.length > columns) {
      const empty = cells.lastIndexOf(null)
      if (empty >= 0) cells.splice(empty, 1)
      else overflow.unshift(cells.pop()!)
    }
  }
  const settings = { ...row.settings, ...patch }
  if (cells.length !== row.cells.length && patch.ratio === undefined) settings.ratio = ''
  list[index] = { settings, cells }
  list.splice(index + 1, 0, ...overflow.map(block => ({ settings: { columns: 1 }, cells: [block] })))
  return fromRows(list)
}

/** «Разделить ряд на блоки»: каждый блок — своим рядом, в том же порядке. */
export function splitRow(layout: Layout, index: number): Layout {
  const list = toRows(layout)
  const row = list[index]
  if (!row) return layout
  const singles = row.cells.filter((cell): cell is Block => Boolean(cell))
    .map(block => ({ settings: { columns: 1 }, cells: [block] as (Block | null)[] }))
  list.splice(index, 1, ...singles)
  return fromRows(list)
}

export function removeBlock(layout: Layout, id: string): Layout {
  const list = toRows(layout)
  const [r, c] = locate(list, id)
  if (r < 0) return layout
  extract(list, r, c)
  return fromRows(list)
}

/** Копия — новый id, свои данные, отдельным рядом сразу под рядом оригинала. */
export function duplicateBlock(layout: Layout, id: string, newId: string = newBlockId()): Layout {
  const list = toRows(layout)
  const [r, c] = locate(list, id)
  if (r < 0) return layout
  const copy = { ...structuredClone(list[r].cells[c]!), id: newId }
  list.splice(r + 1, 0, { settings: { columns: 1 }, cells: [copy] })
  return fromRows(list)
}

/** Заменить блок по id, место не меняется. */
export function replaceBlock(layout: Layout, block: Block): Layout {
  return { ...layout, blocks: layout.blocks.map(b => (b.id === block.id ? { ...block, row: b.row, col: b.col, colSpan: 1 } : b)) }
}

/** Порядок чтения — он же порядок на телефоне. */
export function readingOrder(layout: Layout): Block[] {
  return layoutRows(layout).flatMap(({ settings, cells }) => {
    const present = cells.filter((cell): cell is Block => Boolean(cell))
    return settings.mobileReverse ? present.reverse() : present
  })
}

/** CSS grid-template-columns для ряда. */
export function columnTemplate(settings: RowSettings): string {
  const columns = settings.columns ?? 1
  if (columns === 1) return 'minmax(0,1fr)'
  if (!settings.ratio || settings.ratio === '1:1:1' || settings.ratio === '1:1') return `repeat(${columns},minmax(0,1fr))`
  return settings.ratio.split(':').map(part => `minmax(0,${part}fr)`).join(' ')
}

/** Пропорция для разделителя: left — доля левой колонки от 0 до 1. */
export function snapRatio(left: number): RowRatio {
  const options: [RowRatio, number][] = [['1:2', 1 / 3], ['1:1', 1 / 2], ['2:1', 2 / 3]]
  return options.reduce((best, option) => (Math.abs(option[1] - left) < Math.abs(best[1] - left) ? option : best))[0]
}

/** Доля левой колонки для пропорции. */
export function ratioShare(ratio: RowRatio | undefined): number {
  if (ratio === '2:1') return 2 / 3
  if (ratio === '1:2') return 1 / 3
  return 1 / 2
}
