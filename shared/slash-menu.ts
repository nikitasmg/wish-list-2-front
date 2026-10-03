import { BLOCK_CATALOG, makeBlock } from './editor-model'
import type { Block, BlockType } from './types'

/**
 * Меню выбора типа блока по «/».
 *
 * Разбор вынесен из компонента: это чистые правила, которые легко переврать
 * (слэш в адресе — не команда) и которые должны одинаково работать при вводе
 * и при выборе пункта.
 */

type CatalogItem = (typeof BLOCK_CATALOG)[number]

/** Текст без тегов, которыми contenteditable обрастает при вводе. */
function plainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/ /g, ' ')
    .trim()
}

/**
 * Запрос после «/», либо null — если это не команда.
 *
 * Команда — только когда «/» открывает весь блок: иначе «ул. Мира 7/2» или
 * «пишите /мне» открывали бы меню посреди набора текста.
 */
export function slashQuery(html: string): string | null {
  const text = plainText(html)
  if (!text.startsWith('/')) return null
  return text.slice(1).trim()
}

/**
 * Подходящие типы блоков.
 *
 * Ищем и по названию, и по группе: «гости» — привычное слово, а помнить, что
 * голосование лежит именно там, человек не обязан.
 */
export function slashMatches(catalog: CatalogItem[], query: string): CatalogItem[] {
  // Обложка на странице одна и стоит первой — предлагать её посреди текста
  // значит предлагать сломать страницу.
  const available = catalog.filter(item => item.type !== 'cover')

  const needle = query.trim().toLocaleLowerCase('ru')
  if (!needle) return available

  return available.filter(item =>
    `${item.label} ${item.group}`.toLocaleLowerCase('ru').includes(needle))
}

/**
 * Превратить блок в блок другого типа.
 *
 * Идентичность и место в списке сохраняются: к id привязаны ответы гостей,
 * а перескакивание блока после выбора типа выглядело бы как сбой. Данные
 * берутся новые — текст команды («/мес») в новый блок не утекает.
 */
export function convertBlock(blocks: Block[], id: string, type: BlockType): Block[] {
  const index = blocks.findIndex(b => b.id === id)
  if (index < 0) return blocks

  const current = blocks[index]
  const fresh = makeBlock(type)

  return blocks.map((block, i) => i === index
    ? { ...fresh, id: current.id, row: current.row, col: current.col, colSpan: current.colSpan }
    : block)
}
