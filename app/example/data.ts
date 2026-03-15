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
  presentsCount: 6,
  userId: 'example',
  settings: {
    colorScheme: 'blush',
    showGiftAvailability: false,
    presentsLayout: 'grid2',
  },
  location: { name: 'ТЦ Мега, ДРЦ «Джунгли»', time: '12:00' },
  createdAt: STUB_DATE,
  updatedAt: STUB_DATE,
  blocks: [
    {
      type: 'text',
      position: 0,
      colSpan: 2,
      data: {
        html: '<p>Привет! Мы приглашаем тебя на праздник 🎉 Сашке исполняется <strong>7 лет</strong> — это особенный день! Приходи с хорошим настроением, остальное мы уже организовали.</p>',
      },
    },
    {
      type: 'date',
      position: 1,
      data: {
        datetime: '2026-04-07T12:00:00',
        label: 'День рождения',
      },
    },
    {
      type: 'location',
      position: 2,
      data: {
        name: 'ТЦ Мега Химки, детский развлекательный центр «Джунгли»',
        link: 'https://yandex.ru/maps',
      },
    },
    {
      type: 'timing',
      position: 3,
      colSpan: 2,
      data: {
        end: '2026-04-07T12:00:00',
      },
    },
    {
      type: 'divider',
      position: 4,
      colSpan: 2,
      data: { style: 'dots' },
    },
    {
      type: 'agenda',
      position: 5,
      colSpan: 2,
      data: {
        items: [
          { time: '12:00', text: 'Сбор гостей, приветствие' },
          { time: '12:30', text: 'Игры и аттракционы в «Джунглях»' },
          { time: '14:00', text: 'Праздничный стол и торт 🎂' },
          { time: '14:45', text: 'Вручение подарков' },
          { time: '15:30', text: 'Фотосессия и свободное время' },
          { time: '16:30', text: 'До свидания! Спасибо, что пришли 🙏' },
        ],
      },
    },
    {
      type: 'checklist',
      position: 6,
      data: {
        title: 'Что взять с собой',
        items: [
          'Хорошее настроение',
          'Сменную обувь для зала',
          'Подарок (список ниже 👇)',
          'Подтвердить присутствие заранее',
        ],
      },
    },
    {
      type: 'divider',
      position: 7,
      colSpan: 2,
      data: { style: 'line' },
    },
    {
      type: 'contact',
      position: 8,
      data: {
        name: 'Наташа',
        role: 'Мама именинника',
        telegram: '@natasha_birthday',
        phone: '+7 916 123-45-67',
      },
    },
  ],
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
    reserved: true,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
  {
    id: 'ex-b-4',
    wishlistId: 'example-birthday',
    title: 'Гарри Поттер и философский камень',
    description: 'Иллюстрированное издание Росмэн',
    cover: '',
    price: 890,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
  {
    id: 'ex-b-5',
    wishlistId: 'example-birthday',
    title: 'Набор для рисования Crayola',
    description: '140 предметов: фломастеры, карандаши, акварель',
    cover: '',
    price: 1490,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
  {
    id: 'ex-b-6',
    wishlistId: 'example-birthday',
    title: 'Сертификат в «Детский мир»',
    description: 'На любую игрушку по выбору именинника',
    cover: '',
    price: 2000,
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
  presentsCount: 6,
  userId: 'example',
  settings: {
    colorScheme: 'cloud',
    showGiftAvailability: true,
    presentsLayout: 'grid2',
  },
  location: { name: 'Ресторан «Турандот», Москва', time: '15:00' },
  createdAt: STUB_DATE,
  updatedAt: STUB_DATE,
  blocks: [
    {
      type: 'quote',
      position: 0,
      colSpan: 2,
      data: {
        text: 'Любовь — это не глядеть друг на друга, а смотреть вместе в одном направлении.',
        author: 'Антуан де Сент-Экзюпери',
      },
    },
    {
      type: 'date',
      position: 1,
      data: {
        datetime: '2026-06-14T15:00:00',
        label: 'День свадьбы',
      },
    },
    {
      type: 'location',
      position: 2,
      data: {
        name: 'Ресторан «Турандот», Тверской бульвар, 26/5с1, Москва',
        link: 'https://yandex.ru/maps',
      },
    },
    {
      type: 'timing',
      position: 3,
      colSpan: 2,
      data: {
        end: '2026-06-14T15:00:00',
      },
    },
    {
      type: 'color_scheme',
      position: 4,
      colSpan: 2,
      data: {
        label: 'Дресс-код — пастельные оттенки',
        colors: [ '#fce4ec', '#f8bbd9', '#e1bee7', '#e8eaf6', '#e0f2fe' ],
      },
    },
    {
      type: 'divider',
      position: 5,
      colSpan: 2,
      data: { style: 'wave' },
    },
    {
      type: 'agenda',
      position: 6,
      colSpan: 2,
      data: {
        items: [
          { time: '15:00', text: 'Сбор гостей, welcome-зона' },
          { time: '16:00', text: 'Выездная регистрация' },
          { time: '17:00', text: 'Торжественный банкет' },
          { time: '19:00', text: 'Танцевальная программа' },
          { time: '20:30', text: 'Свадебный торт 🎂' },
          { time: '21:00', text: 'Живая музыка и дискотека' },
        ],
      },
    },
    {
      type: 'checklist',
      position: 7,
      data: {
        title: 'Важно знать',
        items: [
          { text: 'Подтвердить присутствие до 1 июня' },
          { text: 'Указать пищевые предпочтения при подтверждении' },
          { text: 'Парковка платная, ближайшая — ТЦ «Охотный ряд»' },
          { text: 'Фотограф работает с 15:00 до 21:00' },
        ],
      },
    },
    {
      type: 'divider',
      position: 8,
      colSpan: 1,
      data: { style: 'dots' },
    },
    {
      type: 'contact',
      position: 9,
      data: {
        name: 'Анастасия',
        role: 'Организатор свадьбы',
        telegram: '@anastasia_events',
        phone: '+7 926 456-78-90',
      },
    },
    {
      type: 'contact',
      position: 10,
      data: {
        name: 'Дима',
        role: 'Жених',
        telegram: '@dima_groom',
        phone: '+7 903 321-65-43',
      },
    },
  ],
}

const weddingPresents: Present[] = [
  {
    id: 'ex-w-1',
    wishlistId: 'example-wedding',
    title: 'Чайник Smeg KLF04',
    description: 'Ретро-стиль, 1,7 л, кремовый',
    cover: '',
    price: 12900,
    reserved: true,
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
    title: 'Ужин в ресторане Björn',
    description: 'Сертификат на романтический ужин на двоих',
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
  {
    id: 'ex-w-5',
    wishlistId: 'example-wedding',
    title: 'Кофемашина DeLonghi Magnifica',
    description: 'Автоматическая, зерновая, с капучинатором',
    cover: '',
    price: 34900,
    reserved: false,
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
  },
  {
    id: 'ex-w-6',
    wishlistId: 'example-wedding',
    title: 'Поездка в Санкт-Петербург',
    description: 'Сертификат на романтический уик-энд на двоих',
    cover: '',
    price: 25000,
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
  presentsCount: 5,
  userId: 'example',
  settings: {
    colorScheme: 'cosmic',
    showGiftAvailability: false,
    presentsLayout: 'list',
  },
  location: { name: 'ул. Пречистенка, д. 36, кв. 14', time: '20:00' },
  createdAt: STUB_DATE,
  updatedAt: STUB_DATE,
  blocks: [
    {
      type: 'text',
      position: 0,
      colSpan: 2,
      data: {
        html: '<p>Народ, всё серьёзно 🕺 Собираемся у меня в пятницу вечером. Место знаете — этаж 4, домофон 14. Если ещё не были — пишите, встречу у подъезда.</p><p>Список желаний ниже — берите что хотите или просто приходите с собой 😎</p>',
      },
    },
    {
      type: 'date',
      position: 1,
      data: {
        datetime: '2026-03-21T20:00:00',
        label: 'Вечеринка',
      },
    },
    {
      type: 'location',
      position: 2,
      data: {
        name: 'ул. Пречистенка, д. 36, кв. 14, Москва',
        link: 'https://yandex.ru/maps',
      },
    },
    {
      type: 'divider',
      position: 3,
      colSpan: 2,
      data: { style: 'line' },
    },
    {
      type: 'agenda',
      position: 4,
      colSpan: 2,
      data: {
        items: [
          { time: '20:00', text: 'Сбор и приветственный коктейль 🍹' },
          { time: '20:30', text: 'Ужин и болтовня' },
          { time: '22:00', text: 'Настолки: Имаджинариум, Мафия' },
          { time: '23:00', text: 'Музыка, танцы, полный отрыв 🎶' },
          { time: '02:00', text: 'Кто ещё держится — чай и кино' },
        ],
      },
    },
    {
      type: 'checklist',
      position: 5,
      data: {
        title: 'Что взять с собой',
        items: [
          'Хорошее настроение (обязательно!)',
          'Что-нибудь из вишлиста 👇',
          'Сменку, если планируешь остаться',
          'Снеки или что-то вкусное',
        ],
      },
    },
    {
      type: 'divider',
      position: 6,
      colSpan: 2,
      data: { style: 'dots' },
    },
    {
      type: 'contact',
      position: 7,
      data: {
        name: 'Макс',
        role: 'Хозяин вечеринки',
        telegram: '@max_party',
        phone: '+7 999 876-54-32',
      },
    },
    {
      type: 'quote',
      position: 8,
      data: {
        text: 'Лучшие вечеринки — те, о которых потом рассказывают.',
        author: 'Народная мудрость',
      },
    },
  ],
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
    description: 'Компактная версия, до 6 игроков',
    cover: '',
    price: 1890,
    reserved: true,
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
  {
    id: 'ex-p-5',
    wishlistId: 'example-party',
    title: 'Виниловая пластинка The Beatles',
    description: 'Abbey Road, переиздание 2019',
    cover: '',
    price: 2490,
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
