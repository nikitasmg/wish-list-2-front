import {
  AlignLeft,
  CalendarDays,
  CheckCheck,
  Contact,
  Gift,
  Image,
  LayoutGrid,
  ListOrdered,
  MapPin,
  MessageSquareQuote,
  Minus,
  Music,
  Palette,
  Quote,
  Rows3,
  Tags,
  Timer,
  Type,
  Video,
  Vote,
  type LucideIcon,
} from 'lucide-react'

/**
 * Иконки блоков.
 *
 * Лежат отдельно от каталога в shared: тот разбирается и тестами, и слэш-меню,
 * и тянуть в него React ради картинок незачем. Ключ — id пресета из библиотеки,
 * запасной — тип блока.
 */
const BY_LIBRARY_ID: Record<string, LucideIcon> = {
  schedule: Timer,
  timeline: Rows3,
  pairs: AlignLeft,
  tags: Tags,
  stoplist: Tags,
  sizes: LayoutGrid,
}

const BY_TYPE: Record<string, LucideIcon> = {
  cover: Image,
  text: Type,
  quote: Quote,
  media: LayoutGrid,
  video: Video,
  divider: Minus,
  list: ListOrdered,
  date: CalendarDays,
  location: MapPin,
  color_scheme: Palette,
  timing: Timer,
  contact: Contact,
  wishlist: Gift,
  rsvp: CheckCheck,
  poll: Vote,
  playlist: Music,
  guestbook: MessageSquareQuote,
}

export function blockIcon(type: string, libraryId?: string): LucideIcon {
  return (libraryId && BY_LIBRARY_ID[libraryId]) || BY_TYPE[type] || Type
}

/** Иконки видов внутри типа — для плиток «Вид» в инспекторе. */
const BY_VIEW: Record<string, LucideIcon> = {
  tags: Tags,
  pairs: AlignLeft,
  tiles: LayoutGrid,
  schedule: Timer,
  timeline: Rows3,
  single: Image,
  row: LayoutGrid,
  cards: LayoutGrid,
  list: ListOrdered,
  center: AlignLeft,
  left: AlignLeft,
  number: Type,
  photo: Image,
  circle: Image,
  arch: Image,
}

export function viewIcon(view: string): LucideIcon {
  return BY_VIEW[view] ?? LayoutGrid
}
