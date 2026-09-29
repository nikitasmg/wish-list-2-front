/**
 * Дата праздника глазами кабинета: «14 ноября · через 49 дней».
 *
 * Считается отдельно от вёрстки, потому что тут два места, где легко
 * ошибиться: русское склонение и разница в календарных днях.
 */

/**
 * Склонение по числу: [день, дня, дней].
 *
 * Наивная проверка «n === 1 ? день : дня» ломается на 11–14 («одиннадцать
 * день») и на 21 («двадцать один дня»), поэтому смотрим две последние цифры.
 */
export function pluralRu(count: number, forms: [string, string, string]): string {
  const abs = Math.abs(count)
  const tens = abs % 100
  if (tens >= 11 && tens <= 14) return forms[2]

  const ones = abs % 10
  if (ones === 1) return forms[0]
  if (ones >= 2 && ones <= 4) return forms[1]
  return forms[2]
}

export type EventTiming = { label: string; past: boolean }

const MS_IN_DAY = 24 * 60 * 60 * 1000

/** Полночь по местному времени: сравниваем календарные дни, а не моменты. */
function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/**
 * Сколько осталось до праздника.
 *
 * Считаем в календарных днях, а не в сутках: праздник завтра в 9 утра
 * наступает меньше чем через сутки, но человек ждёт увидеть «завтра»,
 * а не «сегодня».
 */
export function eventTiming(
  eventDate: string | null | undefined,
  now: Date = new Date(),
): EventTiming | null {
  if (!eventDate) return null

  const date = new Date(eventDate)
  if (Number.isNaN(date.getTime())) return null

  const days = Math.round((startOfDay(date) - startOfDay(now)) / MS_IN_DAY)

  if (days < 0) return { label: 'прошёл', past: true }
  if (days === 0) return { label: 'сегодня', past: false }
  if (days === 1) return { label: 'завтра', past: false }
  return { label: `через ${days} ${pluralRu(days, ['день', 'дня', 'дней'])}`, past: false }
}

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

/**
 * «14 ноября» или «6 июня 2027».
 *
 * Год добавляем только когда он не текущий: в списке из пяти вишлистов
 * четыре из которых в этом году, повторяющийся «2026» — просто шум.
 */
export function formatEventDate(
  eventDate: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!eventDate) return ''

  const date = new Date(eventDate)
  if (Number.isNaN(date.getTime())) return ''

  const base = `${date.getDate()} ${MONTHS[date.getMonth()]}`
  return date.getFullYear() === now.getFullYear() ? base : `${base} ${date.getFullYear()}`
}

type Searchable = { title: string; occasion?: string }

/**
 * Поиск по названию и поводу.
 *
 * Повод тоже ищется: человек помнит «свадьба», а вишлист называется
 * «Аня и Лев». Фильтрация клиентская — списки короткие, серверный поиск
 * тут был бы лишним запросом на каждую букву.
 */
export function searchWishlists<T extends Searchable>(wishlists: T[], query: string): T[] {
  const needle = query.trim().toLocaleLowerCase('ru')
  if (!needle) return wishlists

  return wishlists.filter(w =>
    `${w.title} ${w.occasion ?? ''}`.toLocaleLowerCase('ru').includes(needle))
}
