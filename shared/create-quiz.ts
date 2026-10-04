/**
 * Опросник перед созданием вишлиста с телефона.
 *
 * Логика отдельно от вёрстки: шаги зависят от повода и выбранных блоков, а
 * подсказки названий, дата со временем и сборка страницы из ответов — те
 * места, где легко ошибиться незаметно.
 */

/** Повод — категория системных шаблонов или «Просто список» без шаблона. */
export type QuizOccasion = string
export const LIST_OCCASION = 'list'

/** Ключ блока страницы — тот же каталог, что принимает бэк в `page.blocks`. */
export type PageBlockKey =
  | 'about' | 'place' | 'program' | 'dress' | 'contact'
  | 'gifts' | 'likes' | 'stop' | 'sizes'
  | 'rsvp' | 'playlist' | 'guestbook'

/** Блоки, у которых есть свой экран с вопросами. */
export type FillKey = 'about' | 'place' | 'program' | 'dress' | 'contact' | 'likes' | 'stop' | 'sizes'

export type QuizStep = 'occasion' | 'who' | 'title' | 'when' | 'blocks' | FillKey | 'look'

export type PageBlockMeta = { key: PageBlockKey; label: string; group: 'about' | 'gifts' | 'guests' }

export const PAGE_BLOCKS: PageBlockMeta[] = [
  { key: 'about', label: 'Пара слов гостям', group: 'about' },
  { key: 'place', label: 'Место', group: 'about' },
  { key: 'program', label: 'Программа', group: 'about' },
  { key: 'dress', label: 'Дресс-код', group: 'about' },
  { key: 'contact', label: 'Контакт', group: 'about' },
  { key: 'gifts', label: 'Подарки', group: 'gifts' },
  { key: 'likes', label: 'Что люблю', group: 'gifts' },
  { key: 'stop', label: 'Стоп-лист', group: 'gifts' },
  { key: 'sizes', label: 'Размеры', group: 'gifts' },
  { key: 'rsvp', label: 'Ответ «Приду»', group: 'guests' },
  { key: 'playlist', label: 'Плейлист', group: 'guests' },
  { key: 'guestbook', label: 'Поздравления', group: 'guests' },
]

export const PAGE_GROUPS: { id: PageBlockMeta['group']; title: string }[] = [
  { id: 'about', title: 'О празднике' },
  { id: 'gifts', title: 'Про подарки' },
  { id: 'guests', title: 'Для гостей' },
]

/** Порядок экранов с вопросами. */
export const FILL_ORDER: FillKey[] = ['about', 'place', 'program', 'dress', 'contact', 'likes', 'stop', 'sizes']

export function hasQuestions(key: PageBlockKey): key is FillKey {
  return (FILL_ORDER as string[]).includes(key)
}

/** Что обычно бывает на странице повода. «Подарки» есть всегда. */
const DEFAULT_BLOCKS: Record<string, PageBlockKey[]> = {
  bday: ['about', 'place', 'stop', 'rsvp'],
  kids: ['about', 'place', 'likes', 'sizes', 'rsvp'],
  wedding: ['about', 'place', 'program', 'dress', 'contact', 'rsvp'],
  jubilee: ['about', 'place', 'rsvp', 'guestbook'],
  party: ['about', 'place', 'program', 'rsvp', 'playlist'],
}

export function defaultBlocks(occasion: QuizOccasion | null): PageBlockKey[] {
  return ['gifts', ...(DEFAULT_BLOCKS[occasion ?? ''] ?? ['about', 'place', 'rsvp'])]
}

/**
 * Шаги для повода и выбранных блоков. У «Просто списка» нет праздника —
 * значит, нет имени, даты, страницы и шаблона: остаётся название.
 */
export function quizSteps(occasion: QuizOccasion | null, blocks: PageBlockKey[] = []): QuizStep[] {
  if (occasion === LIST_OCCASION) return ['occasion', 'title']
  return ['occasion', 'who', 'title', 'when', 'blocks', ...FILL_ORDER.filter(k => blocks.includes(k)), 'look']
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

export type QuizPerson = { name: string; name2?: string; age?: number }

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

/** Готовые фразы для «Пары слов гостям» — под повод. */
const PHRASES: Record<string, string[]> = {
  bday: [
    'Без пафоса: друзья, вкусная еда и хорошая музыка. Буду рад видеть!',
    'Собираемся самым близким кругом — приходите, будет тепло.',
    'Отмечаем громко и до утра. Подарки — по списку ниже, а лучший подарок — вы.',
  ],
  kids: [
    'Будут игры, торт и много шариков. Ждём вас с детьми!',
    'Праздник для маленьких гостей — родители тоже приглашены.',
    'Приходите веселиться: аниматор, угощения и сюрпризы.',
  ],
  wedding: [
    'Будем счастливы разделить этот день с вами.',
    'Мы женимся! Ниже — всё, что нужно знать гостям.',
    'Самый важный день — и мы хотим провести его с вами.',
  ],
  jubilee: [
    'Соберёмся всей семьёй и старыми друзьями.',
    'Круглая дата — хороший повод увидеться. Ждём вас!',
    'Будет тёплый вечер, любимые песни и много воспоминаний.',
  ],
  party: [
    'Повод есть, музыка будет. Приходите!',
    'Собираемся весело провести вечер — зовите друзей.',
    'Громко, весело, соседи предупреждены.',
  ],
}

export function aboutPhrases(occasion: QuizOccasion | null): string[] {
  return PHRASES[occasion ?? ''] ?? PHRASES.bday
}

/** Частые варианты для чипов. */
export const TAG_OFFERS: Record<'likes' | 'stop', string[]> = {
  likes: ['настолки', 'кофе', 'путешествия', 'спорт', 'музыка', 'кино', 'книги', 'готовить'],
  stop: ['носки', 'парфюм', 'алкоголь', 'кружки с надписями', 'сладкое', 'цветы', 'деньги в конверте', 'сувениры'],
}

export const DRESS_SWATCHES: { hex: string; name: string }[] = [
  { hex: '#141414', name: 'Чёрный' }, { hex: '#F5F5F0', name: 'Белый' }, { hex: '#9CA3AF', name: 'Серый' },
  { hex: '#D6C3A5', name: 'Бежевый' }, { hex: '#3B6FD8', name: 'Синий' }, { hex: '#2F8F6B', name: 'Зелёный' },
  { hex: '#7A1F35', name: 'Бордо' }, { hex: '#F2A7C3', name: 'Розовый' }, { hex: '#B9AEFF', name: 'Лаванда' },
  { hex: '#D9B45A', name: 'Золото' },
]

export const MAX_TAGS = 12
export const MAX_PROGRAM = 8
export const MAX_COLORS = 5

/** Ответы по блокам — ровно то, что уходит на бэк в `page`. */
export type PageAnswers = {
  blocks: PageBlockKey[]
  about: string
  place: { name: string; address: string; note: string }
  program: { t: string; v: string }[]
  dress: { colors: { hex: string; name: string }[]; note: string }
  contact: { name: string; way: string }
  likes: string[]
  stop: string[]
  sizes: { clothes: string; shoes: string; height: string; ring: string }
}

export function emptyAnswers(occasion: QuizOccasion | null): PageAnswers {
  return {
    blocks: defaultBlocks(occasion),
    about: '',
    place: { name: '', address: '', note: '' },
    program: [{ t: '', v: '' }, { t: '', v: '' }],
    dress: { colors: [], note: '' },
    contact: { name: '', way: '' },
    likes: [],
    stop: [],
    sizes: { clothes: '', shoes: '', height: '', ring: '' },
  }
}

/** Добавить пункт в список чипов: без пустых, повторов и сверх лимита. */
export function addTag(list: string[], value: string): string[] {
  const v = value.trim()
  if (!v || list.includes(v) || list.length >= MAX_TAGS) return list
  return [...list, v]
}

/** Есть ли у блока содержимое. Пустой блок создастся скрытым от гостей. */
export function blockFilled(key: PageBlockKey, a: PageAnswers): boolean {
  switch (key) {
    case 'about': return a.about.trim() !== ''
    case 'place': return a.place.name.trim() !== '' || a.place.address.trim() !== ''
    case 'program': return a.program.some(r => r.v.trim() !== '')
    case 'dress': return a.dress.colors.length > 0
    case 'contact': return a.contact.name.trim() !== '' || a.contact.way.trim() !== ''
    case 'likes': return a.likes.length > 0
    case 'stop': return a.stop.length > 0
    case 'sizes': return Object.values(a.sizes).some(v => v.trim() !== '')
    default: return true
  }
}

/** Короткое описание содержимого блока — для превью перед созданием. */
export function blockSummary(key: PageBlockKey, a: PageAnswers): string {
  switch (key) {
    case 'about': return a.about.trim()
    case 'place': return [a.place.name, a.place.address].map(s => s.trim()).filter(Boolean).join(', ')
    case 'program': return a.program.filter(r => r.v.trim()).map(r => [r.t.trim(), r.v.trim()].filter(Boolean).join(' ')).join(' · ')
    case 'dress': return [a.dress.colors.map(c => c.name).join(', '), a.dress.note.trim()].filter(Boolean).join(' — ')
    case 'contact': return [a.contact.name, a.contact.way].map(s => s.trim()).filter(Boolean).join(' · ')
    case 'likes': return a.likes.join(', ')
    case 'stop': return a.stop.join(', ')
    case 'sizes': return ([['одежда', a.sizes.clothes], ['обувь', a.sizes.shoes], ['рост', a.sizes.height], ['кольцо', a.sizes.ring]] as const)
      .filter(([, v]) => v.trim()).map(([k, v]) => `${k} ${v.trim()}`).join(' · ')
    case 'gifts': return 'Добавите после создания'
    case 'rsvp': return 'Кнопки «Приду» и «Не смогу»'
    case 'playlist': return 'Гости предлагают треки'
    case 'guestbook': return 'Гости оставляют поздравления'
  }
}

/**
 * `page` для бэка. «Подарки» он добавляет сам, поэтому их в списке нет;
 * строки обрезаны, пустые строки программы выкинуты.
 */
export function pagePayload(a: PageAnswers) {
  const trim = (s: string) => s.trim()
  return {
    blocks: a.blocks.filter(k => k !== 'gifts'),
    about: trim(a.about),
    place: { name: trim(a.place.name), address: trim(a.place.address), note: trim(a.place.note) },
    program: a.program.map(r => ({ t: trim(r.t), v: trim(r.v) })).filter(r => r.v).slice(0, MAX_PROGRAM),
    dress: { colors: a.dress.colors.slice(0, MAX_COLORS), note: trim(a.dress.note) },
    contact: { name: trim(a.contact.name), way: trim(a.contact.way) },
    likes: a.likes,
    stop: a.stop,
    sizes: { clothes: trim(a.sizes.clothes), shoes: trim(a.sizes.shoes), height: trim(a.sizes.height), ring: trim(a.sizes.ring) },
  }
}
