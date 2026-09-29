import type { Block, BlockType, Wishlist } from './types'

export function isLegacyWishlist(wishlist: { blocksVersion?: number }): boolean {
  return (wishlist.blocksVersion ?? 1) < 2
}

/** Go adds zero-valued fields and may reorder data keys on JSON round trips. */
export function matchesSavedBlocks(sent: Block[], received: Block[]): boolean {
  const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical)
    : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, canonical(v)])) : value
  const normalized = (blocks: Block[]) => blocks.map(b => ({ ...b, mobilePosition: b.mobilePosition ?? null,
    colSpan: b.colSpan ?? 0, rowSpan: b.rowSpan ?? 0, view: b.view ?? '', caption: b.caption ?? '', title: b.title ?? '', hidden: b.hidden ?? false,
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

export function makeBlock(type: BlockType, position: number): Block {
  const data: Record<string, unknown> = type === 'poll' ? { question: 'Как думаете?', options: ['Первый вариант', 'Второй вариант'] }
    : type === 'list' ? { items: [{ v: 'Новый пункт' }] }
    : type === 'rsvp' ? { fields: ['plusOne'] }
    : type === 'playlist' ? { votes: true } : type === 'guestbook' ? { photos: false } : {}
  return { id: crypto.randomUUID(), type, position, colSpan: 2, rowSpan: 1, view: BLOCK_CATALOG.find(b => b.type === type)?.views?.[0][0], data }
}

/** Convert known v1 shapes without losing text, images or existing identities. */
export function prepareBlocks(wishlist: Pick<Wishlist, 'blocks' | 'cover' | 'title'>): Block[] {
  const blocks = structuredClone(wishlist.blocks ?? []).sort((a, b) => a.position - b.position)
  for (const block of blocks) {
    block.id ||= crypto.randomUUID()
    block.data ||= {}
    if (block.type === 'image' || block.type === 'gallery') {
      const single = block.type === 'image'
      block.type = 'media'; block.view = single ? 'single' : 'row'
      block.data = { ...block.data, images: single ? (block.data.url ? [block.data.url] : []) : block.data.images ?? [] }
    } else if (block.type === 'agenda' || block.type === 'checklist') {
      const agenda = block.type === 'agenda'
      const items = Array.isArray(block.data.items) ? block.data.items : []
      block.type = 'list'; block.view = agenda ? 'schedule' : 'tags'
      block.data = { ...block.data, items: items.map(item => agenda ? { t: item.time, v: item.text } : { v: String(item) }) }
    }
  }
  if (wishlist.cover && !blocks.some(b => b.type === 'cover')) {
    blocks.unshift({ ...makeBlock('cover', 0), title: wishlist.title, data: { imageUrl: wishlist.cover } })
  }
  return blocks.map((b, position) => ({ ...b, position }))
}

export function duplicateBlock(blocks: Block[], id: string): Block[] {
  const index = blocks.findIndex(b => b.id === id)
  if (index < 0) return blocks
  const copy = { ...structuredClone(blocks[index]), id: crypto.randomUUID(), mobilePosition: undefined }
  return [...blocks.slice(0, index + 1), copy, ...blocks.slice(index + 1)].map((b, position) => ({ ...b, position }))
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
