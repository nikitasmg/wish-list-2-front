export type User = {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
}

export type BlockType =
  // основа
  | 'cover'
  | 'text'
  | 'quote'
  | 'media'
  | 'video'
  | 'divider'
  // список — один блок, пять видов
  | 'list'
  // о празднике
  | 'date'
  | 'location'
  | 'color_scheme'
  | 'timing'
  | 'contact'
  // подарки
  | 'wishlist'
  // гости
  | 'rsvp'
  | 'poll'
  | 'playlist'
  | 'guestbook'
  // legacy — читаются у старых вишлистов, новые такими не собирают
  | 'text_image'
  | 'image'
  | 'gallery'
  | 'agenda'
  | 'checklist'

/** Типы формата v1: рисуем плашкой «блок из старой версии». */
export const LEGACY_BLOCK_TYPES: BlockType[] = [
  'image', 'gallery', 'agenda', 'checklist',
]

/** Версии формата блоков — совпадают с константами бэка. */
export const BLOCKS_VERSION_LEGACY = 1
export const BLOCKS_VERSION_CURRENT = 3

export type Block = {
  /** Стабильный id. К нему привязаны ответы гостей, голоса и треки —
   *  позиция для этого не годится, она меняется при перестановке блоков. */
  id: string
  type: BlockType
  /** Ряд и колонка в нём. Настройки ряда — в Wishlist.rows по номеру ряда.
   *  colSpan у v3 всегда 1; 2 бывает только у вишлистов формата v2. */
  row: number
  col: number
  colSpan: number
  /** Ширина содержимого, когда блок один в ряду. */
  width?: 'narrow' | 'full' | ''
  /** Вариант отображения внутри типа. */
  view?: string
  caption?: string
  title?: string
  /** Владелец скрыл блок — гостю он не приходит вовсе. */
  hidden?: boolean
  /** «Секрет до даты»: пока не наступила, бэк отдаёт блок без data. */
  revealAt?: string | null
  /** Что гость видит до revealAt: замок с таймером, только замок или ничего. */
  secretMode?: 'timer' | 'lock' | 'hidden' | ''
  /** Надпись на замке. Вне data: data до даты бэк вырезает. */
  secretText?: string
  data: Record<string, unknown>
}

export type RowRatio = '' | '1:1' | '2:1' | '1:2' | '1:1:1'

/** Настройки ряда. Ряд — блоки с одинаковым row. */
export type RowSettings = {
  columns?: number
  ratio?: RowRatio
  height?: '' | 'equal' | 'auto'
  gap?: '' | 's' | 'm' | 'l'
  mobileReverse?: boolean
}

export type HeadingFont = 'accent' | 'strict' | 'soft' | 'poster' | 'elegant' | 'classic'
export type BackgroundPattern = 'none' | 'stars' | 'confetti' | 'lines'

/** «Оформление» конструктора. */
export type Look = {
  headingFont?: HeadingFont | ''
  pattern?: BackgroundPattern | ''
  mainDreamLarge?: boolean
  confettiOnReserve?: boolean
  liveTimer?: boolean
}

// Вид (view) по типам блоков:
//   cover:    center | left | number | photo | circle | arch
//   list:     tags | pairs | tiles | schedule | timeline
//   media:    single | row
//   wishlist: cards | list | tiles
//
// Форма data по типам:
//   cover:        { number?: string; subtitle?: string }
//   text:         { html: string; size?: 'sm'|'md'|'lg'; align?: 'left'|'center';
//                   width?: 'narrow'|'full'; imageUrl?: string; imagePosition?: 'side'|'top' }
//   quote:        { text: string; author?: string }
//   media:        { images: string[]; captions?: string[] }
//   video:        { url: string }
//   divider:      { style: 'line' | 'dots' | 'wave' }
//   list:         { items: { k?: string; t?: string; v: string }[]; strike?: boolean }
//   date:         { datetime: string; label?: string }
//   location:     { name: string; address?: string; link?: string }
//   color_scheme: { colors: string[] }
//   timing:       { end: string }
//   contact:      { name: string; role?: string; telegram?: string; phone?: string }
//   wishlist:     {}
//   rsvp:         { fields: string[] }   // plusOne, kids, menu, transfer, who
//   poll:         { question: string; options: string[] }
//   playlist:     { votes: boolean }
//   guestbook:    { photos: boolean }

export type CustomScheme = {
  base: 'dark' | 'light'
  /** hex вида #RRGGBB */
  accent: string
}

export type Wishlist = {
  id: string;
  title: string;
  description: string;
  cover: string;
  presentsCount: number;
  /** Сколько подарков занято — считается бэком на выдаче списка. */
  reservedCount: number;
  viewsCount: number;
  userId: string
  settings: {
    colorScheme: string
    showGiftAvailability: boolean
    presentsLayout?: 'list' | 'grid3' | 'grid2'
    customScheme?: CustomScheme
  } & Look
  location: {
    name: string,
    link?: string,
    time?: string
  }
  /** Дата праздника — отдельно от location: нужна и без указанного места. */
  eventDate?: string | null
  occasion?: string
  shortId?: string
  blocks?: Block[]
  /** Настройки рядов по номеру ряда (формат v3). */
  rows?: RowSettings[] | null
  blocksVersion: number
  /** Шаблон, из которого создан вишлист, — только для подписи. */
  templateName?: string
  createdAt: string,
  updatedAt: string,
}

export type Present = {
  id: string;
  title: string;
  description: string;
  cover: string;
  /** Магазины, где подарок можно купить. Подпись — хост ссылки. */
  links?: string[];
  /** Первая из links. Остаётся ради совместимости. */
  link?: string;
  price?: number;
  reserved: boolean;
  /** Бронь поставил текущий гость — значит, он же может её снять. */
  reservedByMe?: boolean;
  /** Как подписался забронировавший гость. Владельцу бэк его не отдаёт. */
  reservedByName?: string;
  /** Главная мечта: первой и крупнее. Одна на вишлист. */
  isMain?: boolean;
  sortOrder?: number;
  /** Владелец отметил подарок подаренным. */
  gifted?: boolean;
  /** single — один даритель, group — скидываются, multi — набор вещей. */
  type: 'single' | 'group' | 'multi';
  participantsCount: number;
  images?: string[];
  createdAt: string,
  updatedAt: string,
  wishlistId: string
}

/** Лимит описания подарка. Тот же, что проверяет бэк. */
export const MAX_PRESENT_DESCRIPTION = 1000

/**
 * Пользовательский шаблон: человек сохранил свой вишлист как заготовку и,
 * если захотел, опубликовал её в галерее /templates.
 */
export type Template = {
  id: string;
  userId: string;
  userDisplayName?: string;
  name: string;
  settings: {
    colorScheme: string;
    showGiftAvailability: boolean;
    presentsLayout?: 'list' | 'grid3' | 'grid2';
  };
  blocks: Block[];
  isPublic: boolean;
  likesCount: number;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Системная заготовка — она идёт вместе с релизом, одинакова для всех и
 * показывается только на экране создания вишлиста. Ни владельца, ни лайков,
 * ни публичности у неё нет: это не то же самое, что Template.
 */
export type SystemTemplate = {
  id: string
  category: string
  name: string
  colorScheme: string
  /** Название-пример: подставляется в превью и в поле «Для кого». */
  sampleTitle: string
  occasion: string
  blocks: Block[]
}

export type SystemTemplateCategory = {
  id: string
  name: string
}

export type RSVPResponse = {
  id: string
  wishlistId: string
  blockId: string
  name: string
  going: boolean
  plusOne: number
  kids: number
  menu: string
  transfer: boolean
  comment: string
  /** Ответы на свои вопросы организатора, ключ — id вопроса. */
  answers?: Record<string, string> | null
  mine: boolean
  createdAt: string
  updatedAt: string
}

/** «Кто идёт»: имена согласившихся и сколько всего людей. */
export type RSVPGuests = {
  names: string[]
  total: number
}

export type RSVPSummary = {
  going: number
  notGoing: number
  plusOnes: number
  kids: number
  transfer: number
  totalPeople: number
  responses: RSVPResponse[]
}

export type PollResults = {
  /** Голоса по id варианта; null — результаты этому зрителю пока скрыты. */
  votes: Record<string, number> | null
  total: number
  myVotes: string[] | null
  /** Скрыты настройкой блока: «после голоса» или «только организатору». */
  hidden: boolean
  closed: boolean
  /** Варианты, которые добавили гости. */
  guestOptions: { id: string; text: string; mine: boolean; hidden: boolean }[]
}

export type PlaylistTrack = {
  id: string
  title: string
  votes: number
  votedByMe: boolean
  mine: boolean
  createdAt: string
}

export type GuestbookEntry = {
  id: string
  name: string
  text: string
  photoUrl: string
  hidden: boolean
  mine: boolean
  createdAt: string
}

export type AuthProps = {
  id: number
  first_name: string
  last_name: string
  username: string
  auth_date: number
  photo_url: string
  hash: string
}
