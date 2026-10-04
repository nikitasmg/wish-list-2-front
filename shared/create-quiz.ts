/**
 * Опросник перед созданием вишлиста с телефона.
 *
 * Логика отдельно от вёрстки: шаги зависят от повода, а подсказки названий
 * и дата со временем — те места, где легко ошибиться незаметно.
 */

/** Повод — категория системных шаблонов или «Просто список» без шаблона. */
export type QuizOccasion = string
export const LIST_OCCASION = 'list'

export type QuizStep = 'occasion' | 'who' | 'title' | 'when' | 'where' | 'look'

export type QuizPerson = { name: string; name2?: string; age?: number }

/**
 * Шаги для повода. У «Просто списка» нет праздника — значит, нет имени,
 * даты, места и шаблона: остаётся название.
 */
export function quizSteps(occasion: QuizOccasion | null): QuizStep[] {
  return occasion === LIST_OCCASION
    ? ['occasion', 'title']
    : ['occasion', 'who', 'title', 'when', 'where', 'look']
}

/** Возраст спрашиваем там, где он бывает на обложке или в названии. */
export function asksAge(occasion: QuizOccasion | null): boolean {
  return occasion === 'bday' || occasion === 'kids' || occasion === 'jubilee'
}

/** [год, года, лет] с учётом 11–14. */
export function yearsWord(n: number): string {
  const tens = n % 100
  if (tens >= 11 && tens <= 14) return 'лет'
  const ones = n % 10
  if (ones === 1) return 'год'
  if (ones >= 2 && ones <= 4) return 'года'
  return 'лет'
}

/** Имя для {name} в текстах шаблона: у свадьбы — пара через «и». */
export function personName(occasion: QuizOccasion | null, person: QuizPerson): string {
  const first = person.name.trim()
  const second = (person.name2 ?? '').trim()
  return occasion === 'wedding' && first && second ? `${first} и ${second}` : first
}

const GENERIC_TITLES: Record<string, string[]> = {
  bday: ['Мой день рождения'],
  kids: ['Детский праздник'],
  wedding: ['Наша свадьба'],
  jubilee: ['Юбилей'],
  party: ['Вечеринка'],
  [LIST_OCCASION]: ['Мой список желаний', 'Хочу на Новый год', 'Хочу на день рождения'],
}

/**
 * Готовые названия. Только именительный падеж: «Маше — 30!» красивее, но
 * склонять произвольные имена надёжно не получится, а «Маша, 30!» не
 * ломается ни на каком имени.
 */
export function titleSuggestions(occasion: QuizOccasion | null, person: QuizPerson): string[] {
  const key = occasion ?? 'bday'
  const name = personName(key, person)
  const out: string[] = []
  if (name && key === 'wedding') out.push(name)
  else if (name && asksAge(key) && person.age) {
    out.push(`${name}, ${person.age}!`, `${name} · ${person.age} ${yearsWord(person.age)}`)
  } else if (name && key === 'party') out.push(`Вечеринка · ${name}`)
  else if (name && asksAge(key)) out.push(name)
  return [...out, ...(GENERIC_TITLES[key] ?? [])]
}

/** «30» → 30; пусто, ноль и мусор — возраст не указан. */
export function parseAge(value: string): number | undefined {
  const trimmed = value.trim()
  if (!/^\d{1,3}$/.test(trimmed)) return undefined
  const age = Number(trimmed)
  return age >= 1 && age <= 150 ? age : undefined
}

/**
 * Дата и время из полей `date` и `time` → RFC3339 в местном времени.
 *
 * Без времени берём полдень: так дата переживает любой сдвиг часового
 * пояса, не меняя число. Со временем — ровно его: от него идёт таймер.
 */
export function eventDateTime(date: string, time: string): string | undefined {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim())
  if (!d) return undefined
  const t = /^(\d{2}):(\d{2})$/.exec(time.trim())
  const value = new Date(Number(d[1]), Number(d[2]) - 1, Number(d[3]), t ? Number(t[1]) : 12, t ? Number(t[2]) : 0)
  return Number.isNaN(value.getTime()) ? undefined : value.toISOString()
}
