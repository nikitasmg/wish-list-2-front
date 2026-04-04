import { Present, Wishlist } from '@/shared/types'

export type OccasionData = {
  slug: string
  title: string
  h1: string
  metaDescription: string
  description: string
  wishlist: Wishlist
  presents: Present[]
}

const STUB_DATE = '2026-01-01T00:00:00Z'

// ── День рождения ────────────────────────────────────────────────
const birthday: OccasionData = {
  slug: 'birthday',
  title: 'Вишлист на день рождения',
  h1: 'Вишлист на день рождения',
  metaDescription: 'Создай вишлист на день рождения онлайн бесплатно. Добавь желаемые подарки и поделись ссылкой с друзьями и родными.',
  description: 'Создай вишлист на день рождения и отправь ссылку друзьям. Никаких ненужных подарков — только то, что ты действительно хочешь.',
  wishlist: {
    id: 'example-birthday',
    title: 'День рождения Саши 🎂',
    description: 'Сашке исполняется 7 лет! Он обожает конструкторы, активный отдых и книги про волшебников.',
    cover: '/wishlist-covers/birthday.png',
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
        row: 0,
        col: 0,
        colSpan: 2,
        data: {
          html: '<p>Привет! Мы приглашаем тебя на праздник 🎉 Сашке исполняется <strong>7 лет</strong> — это особенный день! Приходи с хорошим настроением, остальное мы уже организовали.</p>',
        },
      },
      { type: 'date', row: 1, col: 0, colSpan: 1, data: { datetime: '2026-04-07T12:00:00', label: 'День рождения' } },
      { type: 'location', row: 1, col: 1, colSpan: 1, data: { name: 'ТЦ Мега Химки, детский развлекательный центр «Джунгли»', link: 'https://yandex.ru/maps' } },
      { type: 'timing', row: 2, col: 0, colSpan: 2, data: { end: '2026-04-07T12:00:00' } },
      { type: 'divider', row: 3, col: 0, colSpan: 2, data: { style: 'dots' } },
      {
        type: 'agenda',
        row: 4,
        col: 0,
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
        row: 5,
        col: 0,
        colSpan: 1,
        data: {
          title: 'Что взять с собой',
          items: [{ text: 'Хорошее настроение' }, { text: 'Сменную обувь для зала' }, { text: 'Подарок (список ниже 👇)' }, { text: 'Подтвердить присутствие заранее' }],
        },
      },
      { type: 'divider', row: 6, col: 0, colSpan: 2, data: { style: 'line' } },
      { type: 'contact', row: 7, col: 0, colSpan: 1, data: { name: 'Наташа', role: 'Мама именинника', telegram: '@natasha_birthday', phone: '+7 916 123-45-67' } },
    ],
  },
  presents: [
    { id: 'ex-b-1', wishlistId: 'example-birthday', title: 'LEGO City — Пожарная станция', description: 'Набор 60320, 540 деталей', cover: '', price: 4990, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-b-2', wishlistId: 'example-birthday', title: 'Самокат Micro Sprite', description: 'Складной, для детей 5–12 лет', cover: '', price: 7500, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-b-3', wishlistId: 'example-birthday', title: 'Наушники JBL JR310', description: 'Детские, с ограничением громкости', cover: '', price: 2490, reserved: true, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-b-4', wishlistId: 'example-birthday', title: 'Гарри Поттер и философский камень', description: 'Иллюстрированное издание Росмэн', cover: '', price: 890, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-b-5', wishlistId: 'example-birthday', title: 'Набор для рисования Crayola', description: '140 предметов: фломастеры, карандаши, акварель', cover: '', price: 1490, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-b-6', wishlistId: 'example-birthday', title: 'Сертификат в «Детский мир»', description: 'На любую игрушку по выбору именинника', cover: '', price: 2000, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
  ],
}

// ── Новый год ────────────────────────────────────────────────────
const newYear: OccasionData = {
  slug: 'new-year',
  title: 'Вишлист на Новый год',
  h1: 'Вишлист на Новый год',
  metaDescription: 'Создай вишлист на Новый год онлайн бесплатно. Добавь желаемые подарки и поделись ссылкой до праздника.',
  description: 'Создай вишлист на Новый год и расскажи близким, что тебе подарить. Встречай праздник с подарками, которые радуют.',
  wishlist: {
    id: 'example-new-year',
    title: 'Новогодние желания Лены 🎄',
    description: 'Друзья, вот мой список желаний на Новый год! Выбирайте что понравится — буду рада любому подарку из списка.',
    cover: '/wishlist-covers/new-year.png',
    presentsCount: 5,
    userId: 'example',
    settings: {
      colorScheme: 'forest',
      showGiftAvailability: true,
      presentsLayout: 'grid2',
    },
    location: { name: 'Дома у Лены, Москва' },
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
    blocks: [
      {
        type: 'text',
        row: 0,
        col: 0,
        colSpan: 2,
        data: {
          html: '<p>Привет! 🎄 Новый год уже скоро, и чтобы вам было проще выбрать подарок — я собрала свои пожелания в один список. Выбирайте что по душе, а главное — приходите с хорошим настроением!</p>',
        },
      },
      { type: 'date', row: 1, col: 0, colSpan: 1, data: { datetime: '2026-12-31T22:00:00', label: 'Новый год' } },
      { type: 'timing', row: 2, col: 0, colSpan: 2, data: { end: '2026-12-31T22:00:00' } },
      { type: 'divider', row: 3, col: 0, colSpan: 2, data: { style: 'dots' } },
      {
        type: 'quote',
        row: 4,
        col: 0,
        colSpan: 2,
        data: {
          text: 'Новый год — это не только подарки, но с ними определённо приятнее!',
          author: 'Лена',
        },
      },
      {
        type: 'checklist',
        row: 5,
        col: 0,
        colSpan: 1,
        data: {
          title: 'Напоминание',
          items: [{ text: 'Поделись ссылкой до 20 декабря' }, { text: 'Отметь подарок, если уже купил' }, { text: 'Приходи к 22:00!' }],
        },
      },
    ],
  },
  presents: [
    { id: 'ex-ny-1', wishlistId: 'example-new-year', title: 'Подписка Яндекс Плюс на год', description: 'Музыка, кино, кешбэк — всё в одном', cover: '', price: 2990, reserved: true, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-ny-2', wishlistId: 'example-new-year', title: 'Тёплый плед Zara Home', description: 'Кремовый, 150×200 см, шерсть/акрил', cover: '', price: 4990, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-ny-3', wishlistId: 'example-new-year', title: 'Кофемашина DeLonghi Dedica', description: 'Компактная, рожковая, серебристая', cover: '', price: 18900, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-ny-4', wishlistId: 'example-new-year', title: 'Набор для ароматерапии', description: 'Диффузор + 6 эфирных масел', cover: '', price: 2490, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-ny-5', wishlistId: 'example-new-year', title: 'Книга «Атлас облаков»', description: 'Дэвид Митчелл, подарочное издание', cover: '', price: 890, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
  ],
}

// ── Свадьба ──────────────────────────────────────────────────────
const wedding: OccasionData = {
  slug: 'wedding',
  title: 'Вишлист на свадьбу',
  h1: 'Вишлист на свадьбу',
  metaDescription: 'Создай свадебный вишлист онлайн. Добавь подарки для молодожёнов и отправь ссылку гостям — пусть выбирают с удовольствием.',
  description: 'Свадебный вишлист онлайн: создай список желаний для молодожёнов и поделитесь с гостями.',
  wishlist: {
    id: 'example-wedding',
    title: 'Свадьба Кати и Димы 💍',
    description: 'Мы женимся! Если хочешь сделать нам подарок — здесь собрали всё самое нужное для нашего нового дома.',
    cover: '/wishlist-covers/wedding.png',
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
        row: 0,
        col: 0,
        colSpan: 2,
        data: {
          text: 'Любовь — это не глядеть друг на друга, а смотреть вместе в одном направлении.',
          author: 'Антуан де Сент-Экзюпери',
        },
      },
      { type: 'date', row: 1, col: 0, colSpan: 1, data: { datetime: '2026-06-14T15:00:00', label: 'День свадьбы' } },
      { type: 'location', row: 1, col: 1, colSpan: 1, data: { name: 'Ресторан «Турандот», Тверской бульвар, 26/5с1, Москва', link: 'https://yandex.ru/maps' } },
      { type: 'timing', row: 2, col: 0, colSpan: 2, data: { end: '2026-06-14T15:00:00' } },
      {
        type: 'color_scheme',
        row: 3,
        col: 0,
        colSpan: 2,
        data: {
          label: 'Дресс-код — пастельные оттенки',
          colors: ['#fce4ec', '#f8bbd9', '#e1bee7', '#e8eaf6', '#e0f2fe'],
        },
      },
      { type: 'divider', row: 4, col: 0, colSpan: 2, data: { style: 'wave' } },
      {
        type: 'agenda',
        row: 5,
        col: 0,
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
        row: 6,
        col: 0,
        colSpan: 1,
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
      { type: 'divider', row: 6, col: 1, colSpan: 1, data: { style: 'dots' } },
      { type: 'contact', row: 7, col: 0, colSpan: 1, data: { name: 'Анастасия', role: 'Организатор свадьбы', telegram: '@anastasia_events', phone: '+7 926 456-78-90' } },
      { type: 'contact', row: 7, col: 1, colSpan: 1, data: { name: 'Дима', role: 'Жених', telegram: '@dima_groom', phone: '+7 903 321-65-43' } },
    ],
  },
  presents: [
    { id: 'ex-w-1', wishlistId: 'example-wedding', title: 'Чайник Smeg KLF04', description: 'Ретро-стиль, 1,7 л, кремовый', cover: '', price: 12900, reserved: true, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-w-2', wishlistId: 'example-wedding', title: 'Постельное бельё IKEA NATTJASMIN', description: 'Комплект евро, 100% хлопок', cover: '', price: 3490, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-w-3', wishlistId: 'example-wedding', title: 'Ужин в ресторане Björn', description: 'Сертификат на романтический ужин на двоих', cover: '', price: 5000, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-w-4', wishlistId: 'example-wedding', title: 'Ваза Villeroy & Boch', description: 'Коллекция Manufacture Glow, 30 см', cover: '', price: 8200, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-w-5', wishlistId: 'example-wedding', title: 'Кофемашина DeLonghi Magnifica', description: 'Автоматическая, зерновая, с капучинатором', cover: '', price: 34900, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-w-6', wishlistId: 'example-wedding', title: 'Поездка в Санкт-Петербург', description: 'Сертификат на романтический уик-энд на двоих', cover: '', price: 25000, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
  ],
}

// ── 14 февраля ───────────────────────────────────────────────────
const valentines: OccasionData = {
  slug: 'valentines',
  title: 'Вишлист на 14 февраля',
  h1: 'Вишлист на 14 февраля',
  metaDescription: 'Вишлист на 14 февраля онлайн. Намекни любимому человеку на подарок мечты ко Дню Валентина.',
  description: 'Создай вишлист на День святого Валентина. Намекни партнёру на романтичный подарок — без неловких вопросов.',
  wishlist: {
    id: 'example-valentines',
    title: 'Валентинка для Маши 💝',
    description: 'Дорогой, вот мои пожелания на День Валентина. Выбирай что угодно — или просто проведи со мной вечер.',
    cover: '/wishlist-covers/valentines.png',
    presentsCount: 5,
    userId: 'example',
    settings: {
      colorScheme: 'crimson',
      showGiftAvailability: false,
      presentsLayout: 'list',
    },
    location: { name: 'Ресторан «Тёплое место», Москва' },
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
    blocks: [
      {
        type: 'quote',
        row: 0,
        col: 0,
        colSpan: 2,
        data: {
          text: 'Любовь — это когда кто-то знает, чего ты хочешь, ещё до того, как ты сам это понял.',
        },
      },
      { type: 'date', row: 1, col: 0, colSpan: 1, data: { datetime: '2027-02-14T19:00:00', label: 'День Валентина' } },
      { type: 'timing', row: 2, col: 0, colSpan: 2, data: { end: '2027-02-14T19:00:00' } },
      { type: 'divider', row: 3, col: 0, colSpan: 2, data: { style: 'line' } },
      {
        type: 'text',
        row: 4,
        col: 0,
        colSpan: 2,
        data: {
          html: '<p>Не обязательно дарить что-то из списка — главное, что мы вместе 💕 Но если хочешь порадовать — вот подсказки!</p>',
        },
      },
    ],
  },
  presents: [
    { id: 'ex-v-1', wishlistId: 'example-valentines', title: 'Парфюм Chanel Chance', description: 'Eau Tendre, 50 мл', cover: '', price: 8900, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-v-2', wishlistId: 'example-valentines', title: 'SPA-сертификат для двоих', description: 'Программа «Романтика», 2 часа', cover: '', price: 6500, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-v-3', wishlistId: 'example-valentines', title: 'Браслет Pandora', description: 'Серебро, базовый браслет + 2 шарма', cover: '', price: 5490, reserved: true, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-v-4', wishlistId: 'example-valentines', title: 'Букет из 25 роз', description: 'Красные розы Эквадор, премиум', cover: '', price: 3500, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-v-5', wishlistId: 'example-valentines', title: 'Ужин в ресторане', description: 'Сертификат на двоих, любое место', cover: '', price: 5000, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
  ],
}

// ── 8 марта ──────────────────────────────────────────────────────
const march8: OccasionData = {
  slug: 'march-8',
  title: 'Вишлист на 8 марта',
  h1: 'Вишлист на 8 марта',
  metaDescription: 'Вишлист на 8 марта онлайн бесплатно. Намекни на подарок мечты к Международному женскому дню.',
  description: 'Создай вишлист на 8 марта и расскажи, что тебе подарить. Никакой мимозы — только то, что по-настоящему радует.',
  wishlist: {
    id: 'example-march-8',
    title: 'Хочу на 8 марта 🌷',
    description: 'Мальчики, вот подсказки! Не надо гадать — всё расписано. Спасибо заранее!',
    cover: '/wishlist-covers/8-march.png',
    presentsCount: 5,
    userId: 'example',
    settings: {
      colorScheme: 'lavender',
      showGiftAvailability: true,
      presentsLayout: 'grid2',
    },
    location: { name: '' },
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
    blocks: [
      {
        type: 'text',
        row: 0,
        col: 0,
        colSpan: 2,
        data: {
          html: '<p>Каждый год одно и то же — «что тебе подарить?» 🙈 В этом году я облегчила задачу! Выбирайте из списка или вдохновляйтесь. Буду рада любому вниманию.</p>',
        },
      },
      { type: 'date', row: 1, col: 0, colSpan: 1, data: { datetime: '2027-03-08T10:00:00', label: '8 марта' } },
      { type: 'divider', row: 2, col: 0, colSpan: 2, data: { style: 'wave' } },
      {
        type: 'checklist',
        row: 3,
        col: 0,
        colSpan: 1,
        data: {
          title: 'Важно',
          items: [{ text: 'Размер одежды: S/42' }, { text: 'Аллергия на лилии' }, { text: 'Люблю запахи: ваниль, жасмин' }],
        },
      },
    ],
  },
  presents: [
    { id: 'ex-m8-1', wishlistId: 'example-march-8', title: 'Уходовый набор Clinique', description: 'Набор из 5 средств для лица', cover: '', price: 4990, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-m8-2', wishlistId: 'example-march-8', title: 'Сертификат на маникюр', description: 'Студия «Лунный свет», покрытие + дизайн', cover: '', price: 2500, reserved: true, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-m8-3', wishlistId: 'example-march-8', title: 'Фен Dyson Supersonic', description: 'Розовое золото, с набором насадок', cover: '', price: 34990, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-m8-4', wishlistId: 'example-march-8', title: 'Книга «Вино по бокалам»', description: 'Мадлен Пакетт, путеводитель по вину', cover: '', price: 1290, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-m8-5', wishlistId: 'example-march-8', title: 'Абонемент на йогу', description: 'Студия YogaSpace, 8 занятий', cover: '', price: 4800, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
  ],
}

// ── Рождество ────────────────────────────────────────────────────
const christmas: OccasionData = {
  slug: 'christmas',
  title: 'Вишлист на Рождество',
  h1: 'Вишлист на Рождество',
  metaDescription: 'Рождественский вишлист онлайн. Создай список желаний на Рождество и поделись с семьёй и друзьями.',
  description: 'Создай рождественский вишлист онлайн. Поделись с близкими списком желаний и встречай Рождество с подарками мечты.',
  wishlist: {
    id: 'example-christmas',
    title: 'Рождественские пожелания семьи Петровых ✨',
    description: 'Наш семейный список пожеланий на Рождество. Пусть каждый найдёт что-то по душе!',
    cover: '/wishlist-covers/christmas.png',
    presentsCount: 5,
    userId: 'example',
    settings: {
      colorScheme: 'ember',
      showGiftAvailability: true,
      presentsLayout: 'list',
    },
    location: { name: 'Дом бабушки, Подмосковье' },
    createdAt: STUB_DATE,
    updatedAt: STUB_DATE,
    blocks: [
      {
        type: 'quote',
        row: 0,
        col: 0,
        colSpan: 2,
        data: {
          text: 'Рождество — это время, когда хочется подарить тепло и получить его в ответ.',
        },
      },
      { type: 'date', row: 1, col: 0, colSpan: 1, data: { datetime: '2026-12-25T18:00:00', label: 'Рождество' } },
      { type: 'location', row: 1, col: 1, colSpan: 1, data: { name: 'Дом бабушки, посёлок Лесной, Подмосковье' } },
      { type: 'divider', row: 2, col: 0, colSpan: 2, data: { style: 'dots' } },
      {
        type: 'agenda',
        row: 3,
        col: 0,
        colSpan: 2,
        data: {
          items: [
            { time: '18:00', text: 'Сбор всей семьи' },
            { time: '19:00', text: 'Праздничный ужин' },
            { time: '20:30', text: 'Обмен подарками 🎁' },
            { time: '21:00', text: 'Настолки, чай и разговоры' },
          ],
        },
      },
    ],
  },
  presents: [
    { id: 'ex-ch-1', wishlistId: 'example-christmas', title: 'Адвент-календарь с шоколадом', description: 'Lindt, 24 дня, премиум', cover: '', price: 2490, reserved: true, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-ch-2', wishlistId: 'example-christmas', title: 'Тёплый свитер', description: 'Uniqlo, шерсть мериноса, бежевый, размер L', cover: '', price: 3990, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-ch-3', wishlistId: 'example-christmas', title: 'Настольная игра «Каркассон»', description: 'Базовый набор + расширение', cover: '', price: 2190, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-ch-4', wishlistId: 'example-christmas', title: 'Умная колонка Яндекс Станция Мини', description: 'С Алисой, серая', cover: '', price: 5990, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-ch-5', wishlistId: 'example-christmas', title: 'Фотокнига за год', description: 'Альбом 30×30, 40 страниц, дизайн на заказ', cover: '', price: 3500, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
  ],
}

// ── Вечеринка ────────────────────────────────────────────────────
const party: OccasionData = {
  slug: 'party',
  title: 'Вишлист на вечеринку',
  h1: 'Вишлист на вечеринку',
  metaDescription: 'Вишлист на вечеринку онлайн. Создай список пожеланий для гостей и сделай вечер незабываемым.',
  description: 'Собираешь вечеринку? Создай вишлист, чтобы гости знали, что принести. Удобно, просто, весело.',
  wishlist: {
    id: 'example-party',
    title: 'Вечеринка у Макса 🎉',
    description: 'Собираемся в эту пятницу! Принесите что-нибудь из списка — сделаем вечер незабываемым.',
    cover: '/wishlist-covers/party.png',
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
        row: 0,
        col: 0,
        colSpan: 2,
        data: {
          html: '<p>Народ, всё серьёзно 🕺 Собираемся у меня в пятницу вечером. Место знаете — этаж 4, домофон 14. Если ещё не были — пишите, встречу у подъезда.</p><p>Список желаний ниже — берите что хотите или просто приходите с собой 😎</p>',
        },
      },
      { type: 'date', row: 1, col: 0, colSpan: 1, data: { datetime: '2026-03-21T20:00:00', label: 'Вечеринка' } },
      { type: 'location', row: 1, col: 1, colSpan: 1, data: { name: 'ул. Пречистенка, д. 36, кв. 14, Москва', link: 'https://yandex.ru/maps' } },
      { type: 'divider', row: 2, col: 0, colSpan: 2, data: { style: 'line' } },
      {
        type: 'agenda',
        row: 3,
        col: 0,
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
        row: 4,
        col: 0,
        colSpan: 1,
        data: {
          title: 'Что взять с собой',
          items: [{ text: 'Хорошее настроение (обязательно!)' }, { text: 'Что-нибудь из вишлиста 👇' }, { text: 'Сменку, если планируешь остаться' }, { text: 'Снеки или что-то вкусное' }],
        },
      },
      { type: 'divider', row: 5, col: 0, colSpan: 2, data: { style: 'dots' } },
      { type: 'contact', row: 6, col: 0, colSpan: 1, data: { name: 'Макс', role: 'Хозяин вечеринки', telegram: '@max_party', phone: '+7 999 876-54-32' } },
      { type: 'quote', row: 6, col: 1, colSpan: 1, data: { text: 'Лучшие вечеринки — те, о которых потом рассказывают.', author: 'Народная мудрость' } },
    ],
  },
  presents: [
    { id: 'ex-p-1', wishlistId: 'example-party', title: 'Коктейльный набор Barfly', description: 'Шейкер, стрейнер, мерник, ложка', cover: '', price: 3200, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-p-2', wishlistId: 'example-party', title: 'Настолка «Имаджинариум»', description: 'Компактная версия, до 6 игроков', cover: '', price: 1890, reserved: true, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-p-3', wishlistId: 'example-party', title: 'Bluetooth-колонка JBL Flip 6', description: 'Водостойкая, 12 ч работы', cover: '', price: 4990, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-p-4', wishlistId: 'example-party', title: 'Флешка с плейлистом вечера', description: '64 ГБ, подборка от хозяина вечеринки', cover: '', price: 990, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
    { id: 'ex-p-5', wishlistId: 'example-party', title: 'Виниловая пластинка The Beatles', description: 'Abbey Road, переиздание 2019', cover: '', price: 2490, reserved: false, createdAt: STUB_DATE, updatedAt: STUB_DATE },
  ],
}

// ── Экспорт ──────────────────────────────────────────────────────
export const occasions: OccasionData[] = [
  birthday,
  newYear,
  wedding,
  valentines,
  march8,
  christmas,
  party,
]

export function getOccasionBySlug(slug: string): OccasionData | undefined {
  return occasions.find((o) => o.slug === slug)
}
