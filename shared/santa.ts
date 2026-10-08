import { z } from 'zod'
import { pluralRu } from './event-date'
import type { SantaChatUnread, SantaChatWith, SantaMe, SantaNotifyView, SantaRoom, SantaRoomInput } from './types'

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
  drawAt: z.string(),
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
  drawAt: '',
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
    drawAt: fromLocalInput(v.drawAt),
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
    drawAt: toLocalInput(room.drawAt),
    message: room.message,
    organizerJoins: false,
    organizerName: '',
    organizerWishes: '',
  }
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/** ISO из бэка → значение input type="datetime-local" в поясе браузера: «2026-12-20T18:30». */
export function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** Значение datetime-local (время браузера) → ISO UTC для бэка; пусто или мусор — null. */
export function fromLocalInput(value: string): string | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** «20 декабря в 18:30» в поясе браузера; null — времени нет. */
export function formatDrawAt(value: string | null): string | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : formatTime(d)
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

export const emailSchema = z.object({
  email: z.string().trim().min(1, 'Укажите почту').max(254, 'Слишком длинный адрес').email('Проверьте адрес'),
})
export type EmailValues = z.infer<typeof emailSchema>

export const codeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'Код — 6 цифр из письма'),
})
export type CodeValues = z.infer<typeof codeSchema>

/** «Напомнить» — не чаще раза в 12 ч (как на бэке). */
export const REMIND_COOLDOWN_MS = 12 * 60 * 60 * 1000

export function remindAvailableAt(lastRemindedAt: string | null): Date | null {
  if (!lastRemindedAt) return null
  const t = Date.parse(lastRemindedAt)
  return Number.isNaN(t) ? null : new Date(t + REMIND_COOLDOWN_MS)
}

export function canRemind(lastRemindedAt: string | null, now: number = Date.now()): boolean {
  const at = remindAvailableAt(lastRemindedAt)
  return !at || at.getTime() <= now
}

export function readyCount(ps: { ready: boolean }[]): number {
  return ps.filter(p => p.ready).length
}

/** «в Telegram» / «на почту a@b.ru» / '' — для фразы «Результат придёт …». */
export function channelLabel(n: SantaNotifyView): string {
  if (!n.ready) return ''
  return n.channel === 'telegram' ? 'в Telegram' : `на почту ${n.email}`
}

/**
 * Telegram — текущий канал. Чат остаётся привязанным и после перехода на
 * почту: тогда предлагаем подключить Telegram заново, а не «уже подключён».
 */
export function telegramActive(n: SantaNotifyView): boolean {
  return n.channel === 'telegram' && n.telegram
}

/** Тост после «Напомнить»: sent — кому ушло, unreachable — без канала. */
export function remindResultToast(sent: number, unreachable: number): { title: string; description?: string } {
  if (sent > 0) {
    return {
      title: `Напомнили: ${participantsLabel(sent)}`,
      description: unreachable > 0 ? `Ещё ${participantsLabel(unreachable)} без почты и Telegram.` : undefined,
    }
  }
  if (unreachable > 0) {
    const who = `${unreachable} ${pluralRu(unreachable, ['участника', 'участников', 'участников'])}`
    return { title: `Напоминать пока некому: у ${who} не подключён канал`, description: 'Позовите их сами.' }
  }
  return { title: 'Всем уже есть что подарить' }
}

export function formatTime(d: Date): string {
  return d.toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

export const chatSchema = z.object({
  body: z.string().trim().min(1, 'Напишите сообщение').max(1000, 'До 1000 символов'),
})
export type ChatValues = z.infer<typeof chatSchema>

/** Подпись вкладки чата: «Моему Санте · 2 новых». */
export function chatTabLabel(withWho: SantaChatWith, unread: SantaChatUnread | null): string {
  const base = withWho === 'receiver' ? 'Подопечному' : 'Моему Санте'
  const n = unread ? (withWho === 'receiver' ? unread.fromReceiver : unread.fromSanta) : 0
  return n > 0 ? `${base} · ${n} ${pluralRu(n, ['новое', 'новых', 'новых'])}` : base
}

/** Карточка участника после открытия вкладки: её входящие бэк отметил прочитанными. */
export function withChatRead(me: SantaMe, withWho: SantaChatWith): SantaMe {
  if (!me.chat) return me
  return { ...me, chat: { ...me.chat, [withWho === 'receiver' ? 'fromReceiver' : 'fromSanta']: 0 } }
}
