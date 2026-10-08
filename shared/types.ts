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
  /** Имя-пример для {name} в текстах блоков — только у шаблонов, где оно есть. */
  sampleName?: string
  occasion: string
  blocks: Block[]
  rows?: RowSettings[] | null
  look?: Look
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

// ── Тайный Санта ─────────────────────────────────────────────────────
// API оборачивает каждый успешный ответ в { data: T }. Типы ниже описывают
// внутреннюю часть T; хуки API должны разворачивать .data.
// Даты приходят из Go как ISO-строки; exchangeDate — полночь UTC дня обмена.

export type SantaRoomStatus = 'open' | 'drawn'

export type SantaRoom = {
  id: string
  ownerId: string
  slug: string
  title: string
  /** Рубли; null — без лимита. */
  budget: number | null
  exchangeDate: string | null
  drawAt: string | null
  message: string
  status: SantaRoomStatus
  drawnAt: string | null
  /** Жеребьёвка по расписанию не прошла: готовых меньше трёх. Сбрасывается новым временем или жеребьёвкой. */
  drawFailedAt: string | null
  lastRemindedAt: string | null
  createdAt: string
  updatedAt: string
}

export type SantaRoomSummary = SantaRoom & { isOwner: boolean; participantsCount: number }

/** Участник глазами организатора: без текста пожеланий и без пар. */
export type SantaParticipantView = {
  id: string
  name: string
  hasWishes: boolean
  hasWishlist: boolean
  /** Канал подтверждён: попадёт в жеребьёвку. */
  ready: boolean
  isOwner: boolean
  createdAt: string
}

/** giftsReady — сколько отметили «Подарок готов»; без имён: пары тайные. */
export type SantaRoomDetails = { room: SantaRoom; participants: SantaParticipantView[]; giftsReady: number }

export type SantaInvite = {
  slug: string
  title: string
  organizerName: string
  budget: number | null
  exchangeDate: string | null
  drawAt: string | null
  message: string
  participantsCount: number
  status: SantaRoomStatus
  /** Когда прошла последняя жеребьёвка (меняется при перезапуске); null до неё. */
  drawnAt: string | null
}

export type SantaReceiver = { name: string; wishes: string; wishlistUrl: string }

export type SantaChannel = '' | 'email' | 'telegram'

/** Куда участнику придут уведомления; видит только он сам. */
export type SantaNotifyView = {
  channel: SantaChannel
  /** Подтверждённый адрес — на него идут письма. */
  email: string
  emailVerified: boolean
  /** Новый адрес, ждущий кода; пусто — нет. Пока он не подтверждён, письма идут на email. */
  pendingEmail: string
  /** Код отправлен на pendingEmail и ещё не введён. */
  emailPending: boolean
  telegram: boolean
  /** Канал подтверждён — участник попадёт в жеребьёвку. */
  ready: boolean
}

export type SantaMe = {
  participantId: string
  name: string
  wishes: string
  wishlistUrl: string
  notify: SantaNotifyView
  room: SantaInvite
  /** Подопечный; null до жеребьёвки. */
  receiver: SantaReceiver | null
  /** Непрочитанные в чате; null, пока у участника нет пары. */
  chat: SantaChatUnread | null
  /** Участник отметил, что подарок подопечному готов. */
  giftReady: boolean
}

export type SantaJoinResult = { token: string; me: SantaMe }

/** Итог «Напомнить»: сколько получат и сколько без канала. */
export type SantaRemindResult = { sent: number; unreachable: number }

/** С кем переписка: со своим подопечным или со своим Сантой. */
export type SantaChatWith = 'receiver' | 'santa'

/** Сообщение глазами участника: без имён и id сторон. */
export type SantaChatMessage = { id: string; mine: boolean; body: string; createdAt: string }

export type SantaChat = { with: SantaChatWith; messages: SantaChatMessage[] }

/** Непрочитанные: от своего Санты и от своего подопечного. */
export type SantaChatUnread = { fromSanta: number; fromReceiver: number }

export type SantaRoomInput = {
  title: string
  budget: number | null
  /** ГГГГ-ММ-ДД или null. */
  exchangeDate: string | null
  /** Время жеребьёвки по расписанию (ISO) или null — только вручную. */
  drawAt: string | null
  message: string
  organizerJoins: boolean
  organizerName: string
  organizerWishes: string
}

export type SantaProfileInput = { name: string; wishes: string; wishlistUrl: string }
