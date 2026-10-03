import type { Present } from './types'

/** Состояние подарка глазами гостя. «Подарено» важнее любой брони. */
export type GiftStatus = 'free' | 'mine' | 'taken' | 'gifted'
export type GiftFilter = 'all' | 'free' | 'taken' | 'gifted'

export function giftStatus(present: Pick<Present, 'reserved' | 'reservedByMe' | 'gifted'>): GiftStatus {
  if (present.gifted) return 'gifted'
  if (present.reservedByMe) return 'mine'
  return present.reserved ? 'taken' : 'free'
}

/** Главная мечта первой, дальше порядок, выставленный владельцем. */
export function sortGifts<T extends Pick<Present, 'isMain' | 'sortOrder' | 'createdAt'>>(presents: T[]): T[] {
  return [...presents].sort((a, b) =>
    Number(Boolean(b.isMain)) - Number(Boolean(a.isMain))
    || (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    || String(a.createdAt).localeCompare(String(b.createdAt)))
}

function matches(status: GiftStatus, filter: GiftFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'taken') return status === 'taken' || status === 'mine'
  return status === filter
}

export function filterGifts<T extends Pick<Present, 'reserved' | 'reservedByMe' | 'gifted'>>(presents: T[], filter: GiftFilter): T[] {
  return presents.filter(p => matches(giftStatus(p), filter))
}

export function giftCounts(presents: Pick<Present, 'reserved' | 'reservedByMe' | 'gifted'>[]): Record<GiftFilter, number> {
  const counts: Record<GiftFilter, number> = { all: 0, free: 0, taken: 0, gifted: 0 }
  for (const present of presents) {
    const status = giftStatus(present)
    counts.all++
    if (status === 'free') counts.free++
    else if (status === 'gifted') counts.gifted++
    else counts.taken++
  }
  return counts
}

/** «Дарит Аня» — если гость подписался, иначе обезличенно. */
export function takenLabel(present: Pick<Present, 'reservedByName'>): string {
  const name = present.reservedByName?.trim()
  return name ? `Дарит ${name}` : 'Уже дарят'
}

/** Подпись магазина — хост ссылки: отдельного поля для названия нет. */
export function shopName(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, '')
  } catch {
    return '—'
  }
}

export function giftLinks(present: Pick<Present, 'links' | 'link'>): string[] {
  return present.links?.length ? present.links : present.link ? [present.link] : []
}

export function formatPrice(price?: number | null): string {
  return price != null ? `${price.toLocaleString('ru-RU')} ₽` : ''
}
