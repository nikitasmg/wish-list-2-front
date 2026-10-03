import { pollOptions, type PollOption } from './editor-model'

/**
 * Разбор data нестандартных блоков. Данные пришли из базы и могли быть
 * сохранены старой версией, поэтому каждый разбор терпит прежний формат и
 * мусор: страница гостя не должна падать из-за одного кривого поля.
 */

const HEX = /^#[0-9a-f]{6}$/i

export type DressColor = { hex: string; name: string }

/** Цвета дресс-кода. Раньше хранились строками без названий. */
export function dressColors(data: Record<string, unknown>): DressColor[] {
  const raw = Array.isArray(data.colors) ? data.colors : []
  return raw
    .map(item => typeof item === 'string' ? { hex: item, name: '' } : { hex: String((item as DressColor)?.hex ?? ''), name: String((item as DressColor)?.name ?? '') })
    .filter(color => HEX.test(color.hex))
}

export type Place = { name: string; address?: string; link?: string }

/** Точки места: первая — в старых полях блока, остальные — в points. */
export function locationPoints(data: Record<string, unknown>): Place[] {
  const first: Place = { name: String(data.name ?? ''), address: String(data.address ?? ''), link: String(data.link ?? '') }
  const rest = (Array.isArray(data.points) ? data.points : []) as Place[]
  return [first, ...rest]
    .map(p => ({ name: String(p?.name ?? ''), address: String(p?.address ?? ''), link: String(p?.link ?? '') }))
    .filter(p => p.name || p.address)
}

function safeHttp(value?: string): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined
  } catch {
    return undefined
  }
}

/**
 * «Построить маршрут». Своя ссылка организатора важнее: он знает, какой вход.
 * Иначе — Яндекс Карты по адресу, для двух точек — маршрут через обе.
 */
export function routeUrl(points: Place[]): string | undefined {
  if (!points.length) return undefined
  if (points.length === 1) {
    const own = safeHttp(points[0].link)
    if (own) return own
    const query = points[0].address || points[0].name
    return query ? `https://yandex.ru/maps/?text=${encodeURIComponent(query)}` : undefined
  }
  const stops = points.map(p => encodeURIComponent(p.address || p.name))
  return `https://yandex.ru/maps/?rtext=${stops.join('~')}`
}

export type Person = { name: string; role?: string; phone?: string; telegram?: string }

/** Контакты: первый человек — в старых полях, остальные — в people. */
export function contactPeople(data: Record<string, unknown>): Person[] {
  const first: Person = { name: String(data.name ?? ''), role: String(data.role ?? ''), phone: String(data.phone ?? ''), telegram: String(data.telegram ?? '') }
  const rest = (Array.isArray(data.people) ? data.people : []) as Person[]
  return [first, ...rest]
    .map(p => ({ name: String(p?.name ?? ''), role: String(p?.role ?? ''), phone: String(p?.phone ?? ''), telegram: String(p?.telegram ?? '') }))
    .filter(p => p.name || p.phone || p.telegram)
}

/** «Написать»: телеграм удобнее звонка, телефон — запасной вариант. */
export function contactLink(person: Person): string | undefined {
  const handle = person.telegram?.trim().replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '')
  if (handle && /^[a-z0-9_]{3,}$/i.test(handle)) return `https://t.me/${handle}`
  const phone = person.phone?.replace(/[^\d+]/g, '')
  return phone ? `tel:${phone}` : undefined
}

export type PollSettings = {
  question: string
  options: PollOption[]
  multiple: boolean
  results: 'all' | 'after_vote' | 'owner'
  closesAt: string
  guestOptions: boolean
}

export function pollSettings(data: Record<string, unknown>): PollSettings {
  const results = data.results === 'after_vote' || data.results === 'owner' ? data.results : 'all'
  return {
    question: String(data.question ?? ''),
    options: pollOptions(data),
    multiple: data.multiple === true,
    results,
    closesAt: typeof data.closesAt === 'string' ? data.closesAt : '',
    guestOptions: data.guestOptions === true,
  }
}

export type RSVPQuestion = { id: string; label: string; kind: 'text' | 'number' | 'bool' }

export type RSVPSettings = {
  fields: string[]
  questions: RSVPQuestion[]
  deadline: string
  showGuests: boolean
}

export function rsvpSettings(data: Record<string, unknown>): RSVPSettings {
  const questions = (Array.isArray(data.questions) ? data.questions : []) as RSVPQuestion[]
  return {
    fields: (Array.isArray(data.fields) ? data.fields : []).map(String),
    questions: questions
      .filter(q => q && typeof q.id === 'string')
      .map(q => ({ id: q.id, label: String(q.label ?? ''), kind: q.kind === 'number' || q.kind === 'bool' ? q.kind : 'text' })),
    deadline: typeof data.deadline === 'string' ? data.deadline : '',
    showGuests: data.showGuests === true,
  }
}

/** Дата без времени — «до конца этого дня», как и на бэке. */
export function deadlineMoment(value: string): Date | null {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(new Date(`${value}T00:00:00Z`).getTime() + 24 * 3600 * 1000)
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function rsvpClosed(settings: Pick<RSVPSettings, 'deadline'>, now: Date = new Date()): boolean {
  const moment = deadlineMoment(settings.deadline)
  return Boolean(moment && now >= moment)
}

/**
 * Блок, которому нечего показать: гостю он не виден вовсе, а на холсте
 * превратился бы в пустое место, на которое не попасть мышью.
 */
export function isEmptyBlock(block: { type: string; data: Record<string, unknown> }): boolean {
  const d = block.data ?? {}
  switch (block.type) {
    case 'quote': return !String(d.text ?? '').trim()
    case 'video': return !String(d.url ?? '').trim()
    case 'location': return locationPoints(d).length === 0
    case 'contact': return contactPeople(d).length === 0
    case 'color_scheme': return d.fromScheme !== true && dressColors(d).length === 0
    case 'list': return !(Array.isArray(d.items) && d.items.length)
    default: return false
  }
}
