import { findFirstEmptyCell, mobileOrder, pushBlocksDown } from './grid'
import type { Block, BlockType, Wishlist } from './types'

/**
 * Идентификатор блока.
 *
 * crypto.randomUUID доступен только в защищённом контексте: по http с
 * LAN-адреса — а именно так редактор и открывают, когда проверяют его на
 * телефоне, — он бросает TypeError и роняет весь конструктор, а не одно
 * действие. Запасной вариант уникален в пределах страницы, и этого хватает:
 * дальше id всё равно уезжает на сервер вместе с остальными блоками.
 */
export function newBlockId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function isLegacyWishlist(wishlist: { blocksVersion?: number }): boolean {
  return (wishlist.blocksVersion ?? 1) < 2
}

/**
 * Блок ещё не раскрылся — вместо содержимого гость видит таймер.
 *
 * Решает только дата. Прежняя проверка добавляла «или data пустая» как
 * признак того, что бэк вырезал содержимое, — но divider, location, contact
 * и ещё полдюжины типов законно живут с пустой data, и такие блоки
 * оставались закрытыми навсегда: кнопка «Открыть сюрприз» перезагружала
 * страницу в то же состояние.
 */
export function isSecretHidden(
  block: { revealAt?: string | null },
  now: Date = new Date(),
): boolean {
  if (!block.revealAt) return false
  const reveal = new Date(block.revealAt).getTime()
  if (Number.isNaN(reveal)) return false
  return reveal > now.getTime()
}

/** Go adds zero-valued fields and may reorder data keys on JSON round trips. */
export function matchesSavedBlocks(sent: Block[], received: Block[]): boolean {
  const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical)
    : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, canonical(v)])) : value
  const normalized = (blocks: Block[]) => blocks.map(b => ({ ...b,
    colSpan: b.colSpan ?? 1, view: b.view ?? '', caption: b.caption ?? '', title: b.title ?? '', hidden: b.hidden ?? false,
    revealAt: b.revealAt ? new Date(b.revealAt).toISOString() : null }))
  return JSON.stringify(canonical(normalized(sent))) === JSON.stringify(canonical(normalized(received)))
}

export const BLOCK_CATALOG: { type: BlockType; label: string; group: string; views?: [string, string][] }[] = [
  { type: 'cover', label: 'Обложка', group: 'Основа', views: [['center', 'Центр'], ['left', 'Слева'], ['number', 'Цифра'], ['photo', 'Фото на фоне'], ['circle', 'Круг'], ['arch', 'Арка']] },
  { type: 'text', label: 'Текст', group: 'Основа' },
  { type: 'quote', label: 'Цитата', group: 'Основа' },
  { type: 'media', label: 'Фото и галерея', group: 'Основа', views: [['single', 'Одно фото'], ['row', 'Фото в ряд']] },
  { type: 'video', label: 'Видео', group: 'Основа' },
  { type: 'divider', label: 'Разделитель', group: 'Основа' },
  { type: 'list', label: 'Список', group: 'Список', views: [['tags', 'Теги'], ['pairs', 'Пары'], ['tiles', 'Плитки'], ['schedule', 'Время'], ['timeline', 'Таймлайн']] },
  { type: 'date', label: 'Дата', group: 'О празднике' },
  { type: 'location', label: 'Место', group: 'О празднике' },
  { type: 'color_scheme', label: 'Дресс-код', group: 'О празднике' },
  { type: 'timing', label: 'Обратный отсчёт', group: 'О празднике' },
  { type: 'contact', label: 'Контакты', group: 'О празднике' },
  { type: 'wishlist', label: 'Подарки', group: 'Подарки', views: [['cards', 'Карточки'], ['list', 'Список'], ['tiles', 'Плитки']] },
  { type: 'rsvp', label: 'Ответ гостя', group: 'Гости' },
  { type: 'poll', label: 'Голосование', group: 'Гости' },
  { type: 'playlist', label: 'Плейлист', group: 'Гости' },
  { type: 'guestbook', label: 'Гостевая книга', group: 'Гости' },
]

/** Новый блок в указанной ячейке. По умолчанию — во всю ширину строки. */
export function makeBlock(type: BlockType, row = 0, col: 0 | 1 = 0, colSpan: 1 | 2 = 2): Block {
  const data: Record<string, unknown> = type === 'poll' ? { question: 'Как думаете?', options: ['Первый вариант', 'Второй вариант'] }
    : type === 'list' ? { items: [{ v: 'Новый пункт' }] }
    : type === 'rsvp' ? { fields: ['plusOne'] }
    : type === 'playlist' ? { votes: true } : type === 'guestbook' ? { photos: false } : {}
  return { id: newBlockId(), type, row, col, colSpan, view: BLOCK_CATALOG.find(b => b.type === type)?.views?.[0][0], data }
}

/**
 * Новый блок в первой свободной ячейке — так добавляет библиотека блоков.
 * Пустая ячейка в середине страницы не остаётся дырой.
 */
export function appendBlock(blocks: Block[], type: BlockType): Block[] {
  const { row, col } = findFirstEmptyCell(blocks)
  return [...blocks, makeBlock(type, row, col, 1)]
}

/** Convert known v1 shapes without losing text, images or existing identities. */
export function prepareBlocks(wishlist: Pick<Wishlist, 'blocks' | 'cover' | 'title'>): Block[] {
  const blocks = mobileOrder(structuredClone(wishlist.blocks ?? []))
  for (const block of blocks) {
    block.id ||= newBlockId()
    block.data ||= {}
    if (block.type === 'image' || block.type === 'gallery') {
      const single = block.type === 'image'
      block.type = 'media'; block.view = single ? 'single' : 'row'
      block.data = { ...block.data, images: single ? (block.data.url ? [block.data.url] : []) : block.data.images ?? [] }
    } else if (block.type === 'text_image') {
      // Фото стало опцией текстового блока, а не отдельным типом: раньше,
      // чтобы убрать картинку, приходилось пересоздавать блок и терять текст.
      const { content, imageUrl, ...rest } = block.data as { content?: string; imageUrl?: string }
      block.type = 'text'
      block.data = {
        ...rest,
        html: block.data.html ?? content ?? '',
        ...(imageUrl ? { imageUrl, imagePosition: 'side' } : {}),
      }
    } else if (block.type === 'agenda' || block.type === 'checklist') {
      const agenda = block.type === 'agenda'
      const items = Array.isArray(block.data.items) ? block.data.items : []
      block.type = 'list'; block.view = agenda ? 'schedule' : 'tags'
      block.data = { ...block.data, items: items.map(item => agenda ? { t: item.time, v: item.text } : { v: String(item) }) }
    }
  }
  if (wishlist.cover && !blocks.some(b => b.type === 'cover')) {
    blocks.unshift({ ...makeBlock('cover'), title: wishlist.title, data: { imageUrl: wishlist.cover } })
  }
  return relayout(blocks)
}

/**
 * Новый блок сразу за указанным.
 *
 * Нужен для Ctrl+Enter в тексте: продолжать мысль следующим блоком человек
 * хочет там же, где пишет, а не возвращаясь к библиотеке слева.
 */
export function addBlockAfter(blocks: Block[], id: string, type: BlockType): Block[] {
  const anchor = blocks.find(b => b.id === id)
  if (!anchor) return blocks
  const row = anchor.row + 1
  return [...pushBlocksDown(blocks, row), makeBlock(type, row)]
}

export function duplicateBlock(blocks: Block[], id: string): Block[] {
  const index = blocks.findIndex(b => b.id === id)
  if (index < 0) return blocks
  const row = blocks[index].row + 1
  const copy = { ...structuredClone(blocks[index]), id: newBlockId(), row, col: 0 as const }
  return [...pushBlocksDown(blocks, row), copy]
}

/**
 * Разложить блоки по сетке заново, сохранив порядок чтения. Нужно там, где
 * координат ещё нет — например, у вишлистов первой версии.
 */
export function relayout(blocks: Block[]): Block[] {
  let row = 0
  let col: 0 | 1 = 0
  return blocks.map(block => {
    const colSpan: 1 | 2 = block.colSpan === 1 ? 1 : 2
    if (colSpan === 2 && col === 1) { row += 1; col = 0 }
    const placed = { ...block, row, col, colSpan }
    if (colSpan === 2 || col === 1) { row += 1; col = 0 } else { col = 1 }
    return placed
  })
}

/** PUT metadata replaces all these fields on the backend. Never send a partial form. */
export function wishlistForm(w: Wishlist): FormData {
  const form = new FormData()
  const values = { title: w.title, description: w.description, cover_url: w.cover, eventDate: w.eventDate ?? '', occasion: w.occasion ?? '',
    'location[name]': w.location?.name ?? '', 'location[link]': w.location?.link ?? '', 'location[time]': w.location?.time ?? '',
    'settings[colorScheme]': w.settings.colorScheme, 'settings[showGiftAvailability]': String(w.settings.showGiftAvailability),
    'settings[presentsLayout]': w.settings.presentsLayout ?? 'list' }
  for (const [key, value] of Object.entries(values)) form.set(key, value ?? '')
  if (w.settings.colorScheme === 'custom' && w.settings.customScheme) {
    form.set('settings[customScheme][base]', w.settings.customScheme.base)
    form.set('settings[customScheme][accent]', w.settings.customScheme.accent)
  }
  return form
}

export function localDateTime(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export function safeLink(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined } catch { return undefined }
}
