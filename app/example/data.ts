import { Present, Wishlist } from '@/shared/types'

export type ExampleData = {
  wishlist: Wishlist
  presents: Present[]
}

const STUB_DATE = '2026-01-01T00:00:00Z'

// ── День рождения ────────────────────────────────────────────────
const birthdayWishlist: Wishlist = {
  id: 'example-birthday',
  title: 'День рождения Саши 🎂',
  description: 'Сашке исполняется 7 лет! Он обожает конструкторы, активный отдых и книги про волшебников.',
  cover: '',
  presentsCount: 4,
  userId: 'example',
  settings: {
    colorScheme: 'blush',
    showGiftAvailability: false,
    presentsLayout: 'grid2',
  },
  location: { name: '' },
  blocks: [],
  createdAt: STUB_DATE,
  updatedAt: STUB_DATE,
}

const birthdayPresents: Present[] = [
  {
    id: 'ex-b-1',
    wishlistId: 'example-birthday',
    title: 'LEGO City — Пожарная станция',
    description: 'Набор 60320, 540 деталей',
    cover: '',
    price: 4990,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
  {
    id: 'ex-b-2',
    wishlistId: 'example-birthday',
    title: 'Самокат Micro Sprite',
    description: 'Складной, для детей 5–12 лет',
    cover: '',
    price: 7500,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
  {
    id: 'ex-b-3',
    wishlistId: 'example-birthday',
    title: 'Наушники JBL JR310',
    description: 'Детские, с ограничением громкости',
    cover: '',
    price: 2490,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
  {
    id: 'ex-b-4',
    wishlistId: 'example-birthday',
    title: 'Гарри Поттер и философский камень',
    description: 'Иллюстрированное издание',
    cover: '',
    price: 890,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
]

// ── Свадьба ──────────────────────────────────────────────────────
const weddingWishlist: Wishlist = {
  id: 'example-wedding',
  title: 'Свадьба Кати и Димы 💍',
  description: 'Мы женимся! Если хочешь сделать нам подарок — здесь собрали всё самое нужное для нашего нового дома.',
  cover: '',
  presentsCount: 4,
  userId: 'example',
  settings: {
    colorScheme: 'cloud',
    showGiftAvailability: false,
    presentsLayout: 'grid2',
  },
  location: { name: '' },
  blocks: [],
  createdAt: STUB_DATE,
  updatedAt: STUB_DATE,
}

const weddingPresents: Present[] = [
  {
    id: 'ex-w-1',
    wishlistId: 'example-wedding',
    title: 'Чайник Smeg KLF04',
    description: 'Ретро-стиль, 1,7 л, кремовый',
    cover: '',
    price: 12900,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
  {
    id: 'ex-w-2',
    wishlistId: 'example-wedding',
    title: 'Постельное бельё IKEA NATTJASMIN',
    description: 'Комплект евро, 100% хлопок',
    cover: '',
    price: 3490,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
  {
    id: 'ex-w-3',
    wishlistId: 'example-wedding',
    title: 'Сертификат в ресторан Björn',
    description: 'На романтический ужин на двоих',
    cover: '',
    price: 5000,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
  {
    id: 'ex-w-4',
    wishlistId: 'example-wedding',
    title: 'Ваза Villeroy & Boch',
    description: 'Коллекция Manufacture Glow, 30 см',
    cover: '',
    price: 8200,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
]

// ── Вечеринка ────────────────────────────────────────────────────
const partyWishlist: Wishlist = {
  id: 'example-party',
  title: 'Вечеринка у Макса 🎉',
  description: 'Собираемся в эту пятницу! Принесите что-нибудь из списка — сделаем вечер незабываемым.',
  cover: '',
  presentsCount: 4,
  userId: 'example',
  settings: {
    colorScheme: 'cosmic',
    showGiftAvailability: false,
    presentsLayout: 'grid2',
  },
  location: { name: '' },
  blocks: [],
  createdAt: STUB_DATE,
  updatedAt: STUB_DATE,
}

const partyPresents: Present[] = [
  {
    id: 'ex-p-1',
    wishlistId: 'example-party',
    title: 'Коктейльный набор Barfly',
    description: 'Шейкер, стрейнер, мерник, ложка',
    cover: '',
    price: 3200,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
  {
    id: 'ex-p-2',
    wishlistId: 'example-party',
    title: 'Настолка «Имаджинариум»',
    description: 'Компактная версия, 6 игроков',
    cover: '',
    price: 1890,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
  {
    id: 'ex-p-3',
    wishlistId: 'example-party',
    title: 'Bluetooth-колонка JBL Flip 6',
    description: 'Водостойкая, 12 ч работы',
    cover: '',
    price: 4990,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
  {
    id: 'ex-p-4',
    wishlistId: 'example-party',
    title: 'Флешка с плейлистом вечера',
    description: '64 ГБ, подборка от хозяина вечеринки',
    cover: '',
    price: 990,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
]

// ── Экспорт ──────────────────────────────────────────────────────
export const examples: ExampleData[] = [
  { wishlist: birthdayWishlist, presents: birthdayPresents },
  { wishlist: weddingWishlist, presents: weddingPresents },
  { wishlist: partyWishlist, presents: partyPresents },
]
