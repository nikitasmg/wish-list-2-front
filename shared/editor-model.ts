import { newBlockId } from './ids'
import { blockRow, insertRow, normalizeLayout, type Layout } from './layout'
import type { Block, BlockType, RowSettings, Wishlist } from './types'

export { newBlockId }

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

/**
 * Секрет закрыт для гостя. «Только замок» бэк отдаёт без даты — такой блок
 * закрыт, пока сервер не начнёт отдавать его содержимое.
 */
export function isSecretLocked(block: Pick<Block, 'revealAt' | 'secretMode' | 'data'>, now: Date = new Date()): boolean {
  if (block.secretMode === 'lock' && !block.revealAt) return Object.keys(block.data ?? {}).length === 0
  return isSecretHidden(block, now)
}

const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, canonical(v)])) : value

/** Go adds zero-valued fields and may reorder data keys on JSON round trips. */
export function matchesSavedBlocks(sent: Block[], received: Block[]): boolean {
  const normalized = (blocks: Block[]) => blocks.map(b => ({ ...b,
    colSpan: b.colSpan ?? 1, view: b.view ?? '', caption: b.caption ?? '', title: b.title ?? '', hidden: b.hidden ?? false,
    width: b.width ?? '', secretMode: b.secretMode ?? '', secretText: b.secretText ?? '',
    revealAt: b.revealAt ? new Date(b.revealAt).toISOString() : null }))
  return JSON.stringify(canonical(normalized(sent))) === JSON.stringify(canonical(normalized(received)))
}

/** То же для рядов: бэк дописывает нулевые значения настроек. */
export function matchesSavedRows(sent: RowSettings[], received: RowSettings[] | null | undefined): boolean {
  const normalized = (rows: RowSettings[]) => rows.map(r => ({
    columns: r.columns ?? 0, ratio: r.ratio ?? '', height: r.height ?? '', gap: r.gap ?? '', mobileReverse: r.mobileReverse ?? false,
  }))
  return JSON.stringify(normalized(sent)) === JSON.stringify(normalized(received ?? []))
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
  { type: 'color_scheme', label: 'Дресс-код', group: 'О празднике', views: [['circles', 'Круги'], ['stripes', 'Полосы'], ['arches', 'Арки']] },
  { type: 'timing', label: 'Обратный отсчёт', group: 'О празднике' },
  { type: 'contact', label: 'Контакты', group: 'О празднике' },
  { type: 'wishlist', label: 'Вишлист', group: 'Подарки', views: [['cards', 'Карточки'], ['list', 'Список'], ['tiles', 'Плитки']] },
  { type: 'rsvp', label: 'Ответ гостя', group: 'Гости' },
  { type: 'poll', label: 'Голосование', group: 'Гости' },
  { type: 'playlist', label: 'Плейлист', group: 'Гости' },
  { type: 'guestbook', label: 'Поздравления', group: 'Гости' },
]

/** Вариант голосования. id стабилен: к нему привязаны голоса гостей. */
export type PollOption = { id: string; text: string }

/**
 * Варианты голосования в формате v3. Старые хранились строками, и голоса
 * ссылались на индекс — индекс и становится id, бэк перенёс голоса так же.
 */
export function pollOptions(data: Record<string, unknown>): PollOption[] {
  const raw = Array.isArray(data.options) ? data.options : []
  return raw.map((option, index) => typeof option === 'string'
    ? { id: String(index), text: option }
    : { id: String((option as PollOption).id ?? index), text: String((option as PollOption).text ?? '') })
}

/** Новый блок с заготовкой содержимого. Место ему назначает раскладка. */
export function makeBlock(type: BlockType): Block {
  const data: Record<string, unknown> = type === 'poll'
    ? { question: 'Как думаете?', options: [{ id: newBlockId(), text: 'Первый вариант' }, { id: newBlockId(), text: 'Второй вариант' }], results: 'all' }
    : type === 'list' ? { items: [{ v: 'Новый пункт' }] }
    : type === 'rsvp' ? { fields: ['plusOne'] }
    : type === 'playlist' ? { votes: true } : {}
  return { id: newBlockId(), type, row: 0, col: 0, colSpan: 1, view: BLOCK_CATALOG.find(b => b.type === type)?.views?.[0][0], data }
}

/**
 * Библиотека блоков — то, что человек видит в панели «Добавить блок».
 *
 * Это не список типов: тип «Список» встречается шесть раз под разными именами
 * («Программа», «Стоп-лист», «Размеры»), потому что выбирают не техническую
 * сущность, а то, что хотят получить на странице. Вид и заготовка содержимого
 * подставляются сразу — пустой блок объяснять некому.
 *
 * «Дата», «Обратный отсчёт» и «Разделитель» в библиотеку не входят: дата и
 * таймер живут в обложке, а у старых вишлистов такие блоки по-прежнему
 * читаются и правятся.
 */
export type LibraryItem = {
  id: string
  type: BlockType
  label: string
  group: string
  /** Приписка справа от названия: чем этот пресет отличается от соседнего. */
  hint?: string
  view?: string
  caption?: string
  title?: string
  data?: Record<string, unknown>
}

export const BLOCK_LIBRARY: LibraryItem[] = [
  { id: 'cover', type: 'cover', label: 'Обложка', group: 'Основа', hint: '6 видов' },
  { id: 'text', type: 'text', label: 'Текст', group: 'Основа', hint: '± фото' },
  { id: 'quote', type: 'quote', label: 'Цитата', group: 'Основа' },
  { id: 'media', type: 'media', label: 'Фото и галерея', group: 'Основа' },
  { id: 'video', type: 'video', label: 'Видео', group: 'Основа' },

  { id: 'schedule', type: 'list', label: 'Программа', group: 'Список', hint: 'расписание', view: 'schedule', caption: 'Программа', title: 'Как пройдёт праздник',
    data: { items: [{ t: '18:00', v: 'Сбор гостей' }, { t: '19:00', v: 'Ужин' }] } },
  { id: 'timeline', type: 'list', label: 'История', group: 'Список', hint: 'таймлайн', view: 'timeline', caption: 'Наша история', title: 'Как всё началось',
    data: { items: [{ t: '2019', v: 'Познакомились' }, { t: '2026', v: 'Решились' }] } },
  { id: 'pairs', type: 'list', label: 'Любимое', group: 'Список', hint: 'пары', view: 'pairs', caption: 'Любимое',
    data: { items: [{ k: 'Цветы', v: 'пионы' }, { k: 'Сладкое', v: 'тёмный шоколад' }] } },
  { id: 'tags', type: 'list', label: 'Интересы', group: 'Список', hint: 'теги', view: 'tags', caption: 'Интересы',
    data: { items: [{ v: 'Книги' }, { v: 'Горы' }, { v: 'Кофе' }] } },
  { id: 'stoplist', type: 'list', label: 'Стоп-лист', group: 'Список', hint: 'теги', view: 'tags', caption: 'Стоп-лист', title: 'Уже есть — не дарите',
    data: { items: [{ v: 'носки' }, { v: 'парфюм' }], strike: true } },
  { id: 'sizes', type: 'list', label: 'Размеры', group: 'Список', hint: 'плитки', view: 'tiles', caption: 'Размеры', title: 'Если дарите одежду',
    data: { items: [{ k: 'одежда', v: 'M' }, { k: 'обувь', v: '39' }] } },

  { id: 'location', type: 'location', label: 'Место', group: 'О празднике', hint: 'адрес', caption: 'Место' },
  { id: 'color_scheme', type: 'color_scheme', label: 'Дресс-код', group: 'О празднике', caption: 'Дресс-код', title: 'Цвета праздника',
    data: { colors: [{ hex: '#FFD166', name: 'Жёлтый' }, { hex: '#3B6FD8', name: 'Синий' }, { hex: '#FFFFFF', name: 'Белый' }], showNames: true } },
  { id: 'contact', type: 'contact', label: 'Контакты', group: 'О празднике', caption: 'Контакты', title: 'Остались вопросы?' },

  { id: 'wishlist', type: 'wishlist', label: 'Вишлист', group: 'Подарки', hint: 'на странице', caption: 'Вишлист', title: 'Подарки' },

  { id: 'rsvp', type: 'rsvp', label: 'Ответ гостя', group: 'Гости', caption: 'Ответ гостя', title: 'Придёте?' },
  { id: 'poll', type: 'poll', label: 'Голосование', group: 'Гости', caption: 'Голосование' },
  { id: 'playlist', type: 'playlist', label: 'Плейлист', group: 'Гости', caption: 'Плейлист', title: 'Что включим?' },
  { id: 'guestbook', type: 'guestbook', label: 'Поздравления', group: 'Гости', caption: 'Поздравления', title: 'Пара тёплых слов' },
]

/** Блок по пресету библиотеки: вид, подпись и заготовка содержимого — свои копии. */
export function libraryBlock(item: LibraryItem): Block {
  const fresh = makeBlock(item.type)
  return {
    ...fresh,
    view: item.view ?? fresh.view,
    caption: item.caption ?? fresh.caption,
    title: item.title ?? fresh.title,
    data: item.data ? structuredClone(item.data) : fresh.data,
  }
}

/** Блоки формата v1 → v2: содержимое и id сохраняются. */
function migrateLegacyBlock(block: Block): Block {
  if (block.type === 'image' || block.type === 'gallery') {
    const single = block.type === 'image'
    return { ...block, type: 'media', view: single ? 'single' : 'row',
      data: { ...block.data, images: single ? (block.data.url ? [block.data.url] : []) : block.data.images ?? [] } }
  }
  if (block.type === 'text_image') {
    // Фото стало опцией текстового блока, а не отдельным типом: раньше,
    // чтобы убрать картинку, приходилось пересоздавать блок и терять текст.
    const { content, imageUrl, ...rest } = block.data as { content?: string; imageUrl?: string }
    return { ...block, type: 'text', data: {
      ...rest,
      html: block.data.html ?? content ?? '',
      ...(imageUrl ? { imageUrl, imagePosition: 'side' } : {}),
    } }
  }
  if (block.type === 'agenda' || block.type === 'checklist') {
    const agenda = block.type === 'agenda'
    const items = Array.isArray(block.data.items) ? block.data.items : []
    return { ...block, type: 'list', view: agenda ? 'schedule' : 'tags',
      data: { ...block.data, items: items.map(item => agenda ? { t: item.time, v: item.text } : { v: String(item) }) } }
  }
  return block
}

/**
 * Раскладка для редактора: legacy-блоки переведены в текущие типы, ряды
 * нормализованы. Исходный вишлист не меняется.
 */
export function prepareLayout(wishlist: Pick<Wishlist, 'blocks' | 'cover' | 'title'> & { rows?: RowSettings[] | null }): Layout {
  const source = structuredClone(wishlist.blocks ?? [])
  // У вишлистов первой версии координат нет — каждый блок своим рядом.
  const positioned = source.some(b => typeof b.row !== 'number')
  const blocks = source.map((block, index) => migrateLegacyBlock({
    ...block,
    id: block.id || newBlockId(),
    data: block.data || {},
    ...(positioned ? { row: index, col: 0, colSpan: 2 } : {}),
  }))
  let layout = normalizeLayout(blocks, positioned ? [] : wishlist.rows ?? [])
  if (wishlist.cover && !blocks.some(b => b.type === 'cover')) {
    layout = insertRow(layout, 0, { ...makeBlock('cover'), title: wishlist.title, data: { imageUrl: wishlist.cover } })
  }
  return layout
}

/**
 * Новый блок отдельным рядом сразу под рядом указанного.
 *
 * Нужен для Ctrl+Enter в тексте: продолжать мысль следующим блоком человек
 * хочет там же, где пишет, а не возвращаясь к библиотеке.
 */
export function addBlockAfter(layout: Layout, id: string, type: BlockType): { layout: Layout; id?: string } {
  const row = blockRow(layout, id)
  if (row < 0) return { layout }
  const block = makeBlock(type)
  return { layout: insertRow(layout, row + 1, block), id: block.id }
}

/** PUT metadata replaces all these fields on the backend. Never send a partial form. */
export function wishlistForm(w: Wishlist): FormData {
  const form = new FormData()
  const s = w.settings
  const values = { title: w.title, description: w.description, cover_url: w.cover, eventDate: w.eventDate ?? '', occasion: w.occasion ?? '',
    'location[name]': w.location?.name ?? '', 'location[link]': w.location?.link ?? '', 'location[time]': w.location?.time ?? '',
    'settings[colorScheme]': s.colorScheme, 'settings[showGiftAvailability]': String(s.showGiftAvailability),
    'settings[presentsLayout]': s.presentsLayout ?? 'list',
    'settings[headingFont]': s.headingFont ?? '', 'settings[pattern]': s.pattern ?? '',
    'settings[mainDreamLarge]': String(Boolean(s.mainDreamLarge)), 'settings[confettiOnReserve]': String(Boolean(s.confettiOnReserve)),
    'settings[liveTimer]': String(Boolean(s.liveTimer)) }
  for (const [key, value] of Object.entries(values)) form.set(key, value ?? '')
  if (s.colorScheme === 'custom' && s.customScheme) {
    form.set('settings[customScheme][base]', s.customScheme.base)
    form.set('settings[customScheme][accent]', s.customScheme.accent)
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
