/**
 * «Добавить в календарь» для страницы гостя.
 *
 * Два пути: файл .ics (Apple, Outlook, всё остальное) и ссылка на Google —
 * у Google свой формат, и открыть ссылку на телефоне проще, чем скачивать
 * файл.
 */

export type CalendarEvent = {
  title: string
  description?: string
  location?: string
  /** ISO-строка начала. */
  start: string
  /** Длительность в часах; по умолчанию три. */
  hours?: number
}

const DEFAULT_HOURS = 3

/**
 * Время в формате, который понимают календари: UTC, без разделителей.
 * Локальное время без зоны они прочитали бы как своё — и событие уехало бы
 * на несколько часов.
 */
function stamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function range(event: CalendarEvent): { start: Date; end: Date } | null {
  const start = new Date(event.start)
  if (Number.isNaN(start.getTime())) return null

  const end = new Date(start.getTime() + (event.hours ?? DEFAULT_HOURS) * 60 * 60 * 1000)
  return { start, end }
}

/**
 * Экранирование по RFC 5545: запятая и точка с запятой — разделители полей,
 * а перенос строки завершает свойство. Без этого адрес с запятой разваливает
 * событие.
 */
function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

export function buildIcs(event: CalendarEvent): string {
  const dates = range(event)
  if (!dates) return ''

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//prosto-namekni//wishlist//RU',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${stamp(dates.start)}-${Math.random().toString(36).slice(2, 10)}@prosto-namekni`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(dates.start)}`,
    `DTEND:${stamp(dates.end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
  ]

  if (event.description) lines.push(`DESCRIPTION:${escapeIcs(event.description)}`)
  if (event.location) lines.push(`LOCATION:${escapeIcs(event.location)}`)

  lines.push('END:VEVENT', 'END:VCALENDAR')

  // Именно CRLF: часть календарей не принимает файл с обычными переносами.
  return lines.join('\r\n') + '\r\n'
}

export function googleCalendarUrl(event: CalendarEvent): string {
  const dates = range(event)
  if (!dates) return ''

  const url = new URL('https://calendar.google.com/calendar/render')
  url.searchParams.set('action', 'TEMPLATE')
  url.searchParams.set('text', event.title)
  url.searchParams.set('dates', `${stamp(dates.start)}/${stamp(dates.end)}`)
  if (event.description) url.searchParams.set('details', event.description)
  if (event.location) url.searchParams.set('location', event.location)
  return url.toString()
}

type WishlistLike = {
  title: string
  description?: string
  eventDate?: string | null
  location?: { name?: string; time?: string | null }
}

/**
 * Событие из вишлиста, или null — если даты нет и добавлять нечего.
 *
 * Дату берём из eventDate, но с запасным location.time: у вишлистов,
 * созданных до разделения этих полей, дата лежит только там.
 */
export function calendarEvent(wishlist: WishlistLike): CalendarEvent | null {
  const raw = wishlist.eventDate || wishlist.location?.time
  if (!raw) return null

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return null

  return {
    title: wishlist.title,
    description: wishlist.description || undefined,
    location: wishlist.location?.name || undefined,
    start: date.toISOString(),
  }
}
