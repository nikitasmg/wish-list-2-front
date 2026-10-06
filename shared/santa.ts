import { z } from 'zod'
import { pluralRu } from './event-date'
import type { SantaRoom, SantaRoomInput } from './types'

export const MIN_PARTICIPANTS = 3

// Адрес комнаты бэк генерирует как 8 символов [a-zA-Z0-9] (usecase/santa/secret.go).
const SLUG_RE = /^[A-Za-z0-9]{8}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Параметры маршрута приходят из адресной строки: в запрос идут только правильные по форме. */
export const isValidSantaSlug = (value: string): boolean => SLUG_RE.test(value)
export const isValidRoomId = (value: string): boolean => UUID_RE.test(value)

/** «до 3 000 ₽» или «без лимита». */
export function formatBudget(budget: number | null): string {
  if (budget === null) return 'без лимита'
  return `до ${budget.toLocaleString('ru-RU')} ₽`
}

/**
 * «27 декабря». Берём только ГГГГ-ММ-ДД: полночь UTC в поясе минус часы
 * превратилась бы в 26-е.
 */
export function formatDay(value: string | null): string | null {
  if (!value) return null
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export function participantsLabel(n: number): string {
  return `${n} ${pluralRu(n, ['участник', 'участника', 'участников'])}`
}

export const roomSchema = z.object({
  title: z.string().trim().min(1, 'Назовите комнату').max(80, 'До 80 символов'),
  // Пусто — без лимита.
  budget: z.string().trim().regex(/^\d{0,7}$/, 'Только цифры, без пробелов'),
  exchangeDate: z.string(),
  message: z.string().max(500, 'До 500 символов'),
  organizerJoins: z.boolean(),
  organizerName: z.string().trim().max(40, 'До 40 символов'),
  organizerWishes: z.string().max(1000, 'До 1000 символов'),
}).refine(v => !v.organizerJoins || v.organizerName.length > 0, {
  path: ['organizerName'],
  message: 'Как вас назвать в комнате?',
}).refine(v => v.budget.trim() === '' || Number(v.budget) <= 1_000_000, {
  path: ['budget'],
  message: 'Не больше 1 000 000 ₽',
})

export type RoomFormValues = z.infer<typeof roomSchema>

export const EMPTY_ROOM_FORM: RoomFormValues = {
  title: '',
  budget: '3000',
  exchangeDate: '',
  message: '',
  organizerJoins: true,
  organizerName: '',
  organizerWishes: '',
}

export function toRoomInput(v: RoomFormValues): SantaRoomInput {
  return {
    title: v.title.trim(),
    budget: v.budget.trim() === '' ? null : Number(v.budget),
    exchangeDate: v.exchangeDate || null,
    message: v.message.trim(),
    organizerJoins: v.organizerJoins,
    organizerName: v.organizerName.trim(),
    organizerWishes: v.organizerWishes.trim(),
  }
}

/** Значения формы правки. Организатор в комнату тут не добавляется. */
export function roomToFormValues(room: SantaRoom): RoomFormValues {
  return {
    title: room.title,
    budget: room.budget === null ? '' : String(room.budget),
    exchangeDate: room.exchangeDate ? room.exchangeDate.slice(0, 10) : '',
    message: room.message,
    organizerJoins: false,
    organizerName: '',
    organizerWishes: '',
  }
}

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'Как вас зовут?').max(40, 'До 40 символов'),
  wishes: z.string().max(1000, 'До 1000 символов'),
  wishlistUrl: z.string().trim().max(500, 'Слишком длинная ссылка').refine(
    v => v === '' || /^https?:\/\/[^\s/]+/i.test(v),
    'Ссылка должна начинаться с http:// или https://',
  ),
})

export type ProfileValues = z.infer<typeof profileSchema>

/** Текст ошибки для тоста: бэк кладёт его в { error }. */
export function apiErrorMessage(err: unknown): string {
  const message = (err as { response?: { data?: { error?: unknown } } })?.response?.data?.error
  return typeof message === 'string' && message ? message : 'Что-то пошло не так. Попробуйте ещё раз.'
}
