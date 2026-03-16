# SEO Improvement Design — prosto-namekni.ru

**Date:** 2026-03-16
**Project:** wish-list-2-front
**Domain:** prosto-namekni.ru
**Status:** Approved

---

## Context

New domain starting from scratch (previous domain expired). The goal is to rank for transactional Russian-language queries: "создать вишлист", "вишлист онлайн", "список желаний". Public wishlist pages (`/s/[shortId]`) will NOT be indexed (personal user data). Full content marketing approach: technical fixes + occasion landing pages + blog/FAQ.

---

## Блок 1 — Технические правки

### 1.1 Критические исправления

| Проблема | Правка |
|---|---|
| `<html lang="en">` в `app/layout.tsx` | → `lang="ru"` |
| Root layout title "Get wishlist - Бесплатный сервис по созданию вишлистов" | → "Просто намекни — Создай вишлист и отправь ссылку" |
| `Manrope` шрифт с `subsets: ['latin']` | → `subsets: ['latin', 'cyrillic']` |
| `how-it-works/page.tsx` использует `<Head>` из Pages Router | → заменить на `export const metadata: Metadata` |
| `terms-of-service/page.tsx` использует `<Head>` из Pages Router | → заменить на `export const metadata: Metadata`, добавить `robots: noindex` |
| Неверное название бренда "WishMaker" в `how-it-works` | → "Просто намекни" |
| H1 на `/how-it-works` — "Как это работает" | → "Как создать вишлист" (согласно целевому запросу) |

### 1.2 Root metadata (`app/layout.tsx`)

```ts
export const metadata: Metadata = {
  metadataBase: new URL('https://prosto-namekni.ru'),
  title: {
    default: 'Просто намекни — Создай вишлист и отправь ссылку',
    template: '%s | Просто намекни',
  },
  description: 'Создай красивый вишлист онлайн и просто отправь ссылку друзьям. Бесплатно, без скачиваний.',
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: 'https://prosto-namekni.ru',
    siteName: 'Просто намекни',
    // images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    // ↑ Раскомментировать ТОЛЬКО после создания и деплоя public/og-image.png
  },
  twitter: {
    card: 'summary_large_image',
  },
  // Токены подставить после регистрации в поисковиках
  verification: {
    yandex: '<yandex-verification-token>',
    google: '<google-verification-token>',
  },
}
```

**Важно:** поле `images` в `openGraph` добавлять только после того, как `public/og-image.png` создан и задеплоен — иначе поисковики получат битую OG-картинку.

### 1.3 Публичные вишлисты (`/s/[shortId]`) — noindex без рефакторинга

`app/s/[shortId]/page.tsx` — клиентский компонент с тремя хуками (`useApiGetWishlistByShortId`, `useApiGetAllPresents`, `useApiGetMe`). Конвертировать в серверный компонент нельзя без бэкенд-изменений.

Правильный подход — создать серверный layout-файл для сегмента:

```ts
// app/s/[shortId]/layout.tsx  (НОВЫЙ файл)
import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

`page.tsx` при этом не трогаем.

### 1.4 Главная страница (`app/page.tsx`)

Текущий title уже корректный. Нужно только расширить description и добавить OG-теги:

```ts
export const metadata: Metadata = {
  title: 'Просто намекни — Создай вишлист и отправь ссылку',
  description: 'Намекни на то, чего хочешь — создай красивый вишлист онлайн и отправь ссылку. Никаких неловких разговоров о подарках. Бесплатно.',
  openGraph: {
    title: 'Просто намекни — Создай вишлист онлайн',
    description: 'Создай вишлист за минуту и поделись с друзьями. Бесплатно.',
    url: 'https://prosto-namekni.ru',
    // images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    // ↑ Раскомментировать ТОЛЬКО после создания и деплоя public/og-image.png
  },
  alternates: {
    canonical: 'https://prosto-namekni.ru',
  },
}
```

---

## Блок 2 — Контентная стратегия

### 2.1 Лендинги под конкретные случаи

Маршрут: `app/wishlist-for/[occasion]/page.tsx`

| URL | H1 | Целевой запрос |
|---|---|---|
| `/wishlist-for/birthday` | Вишлист на день рождения | вишлист на день рождения |
| `/wishlist-for/new-year` | Вишлист на Новый год | вишлист на новый год |
| `/wishlist-for/wedding` | Вишлист на свадьбу | вишлист на свадьбу |
| `/wishlist-for/valentines` | Вишлист на 14 февраля | вишлист на 14 февраля |
| `/wishlist-for/march-8` | Вишлист на 8 марта | вишлист на 8 марта |
| `/wishlist-for/christmas` | Вишлист на Рождество | вишлист на рождество |
| `/wishlist-for/kids` | Вишлист для ребёнка | вишлист для ребёнка |

Каждая страница содержит:
- Уникальный H1 и description под праздник
- Вводный параграф (150–200 слов) с ключевыми словами
- Секция "Идеи подарков" (список из 8–10 идей под тему)
- Секция "Как создать" (краткий how-to, 3–4 шага)
- CTA — кнопка "Создать вишлист"
- JSON-LD `WebPage`

Технически: статические страницы через `generateStaticParams`, данные хранятся в `content/occasions/*.ts`.

### 2.2 Блог (`/blog/[slug]`)

Маршрут: `app/blog/[slug]/page.tsx`

Стартовые статьи (MDX-файлы в `content/blog/`):

| Slug | Title | Запрос |
|---|---|---|
| `how-to-create-wishlist` | Как создать вишлист: пошаговая инструкция | как создать вишлист |
| `wishlist-ideas` | 50 идей для вишлиста на любой случай | идеи для вишлиста |
| `what-is-wishlist` | Что такое вишлист и зачем он нужен | что такое вишлист |
| `share-wishlist` | Как поделиться вишлистом с друзьями | как поделиться вишлистом |
| `wishlist-gifts` | Вишлист вместо списка подарков: почему это удобно | вишлист подарки |

Технически: MDX через `@next/mdx` или `next-mdx-remote`. Метаданные статьи (title, description, date) в frontmatter MDX-файла.

Листинг блога: `app/blog/page.tsx` — список всех статей с заголовками и датами.

---

## Блок 3 — Structured Data (JSON-LD)

### 3.1 Главная страница

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Просто намекни",
  "url": "https://prosto-namekni.ru",
  "applicationCategory": "LifestyleApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "RUB" },
  "description": "Бесплатный сервис создания вишлистов онлайн"
}
```

Дополнительно `WebSite` — без `SearchAction` (внутреннего поиска на сайте нет, добавлять некорректный SearchAction создаст ошибки в Search Console):

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Просто намекни",
  "url": "https://prosto-namekni.ru"
}
```

### 3.2 `/how-it-works`

`HowTo` схема — идеально соответствует содержимому страницы (6 шагов). Даёт расширенный сниппет в поиске.

### 3.3 Блог-статьи

`BlogPosting` + `BreadcrumbList` на каждой статье.

### 3.4 Occasion-страницы

`WebPage` + `FAQPage` (вопросы "Как создать вишлист на день рождения?" и т.д.).

---

## Блок 4 — OG-изображение

Один статический файл `public/og-image.png` (1200×630 px):
- Тёмный фон (соответствует дизайну лендинга)
- Логотип / название "Просто намекни"
- Слоган "Создай вишлист и отправь ссылку"

Для occasion-страниц — вариации с названием праздника (опционально, второй приоритет).

**Порядок:** OG-изображение создаётся ДО добавления `images` в metadata. Не добавлять OG-image в код до тех пор, пока файл не создан и не задеплоен.

---

## Блок 5 — Sitemap + robots.txt

### 5.1 `next-sitemap.config.js`

```js
module.exports = {
  siteUrl: 'https://prosto-namekni.ru',
  generateRobotsTxt: true,
  exclude: ['/oauth', '/wishlist/*', '/s/*', '/login', '/registration'],
  transform: async (config, path) => {
    let priority = 0.7
    let changefreq = 'monthly'

    if (path === '/') {
      priority = 1.0
      changefreq = 'weekly'
    } else if (path.startsWith('/wishlist-for/')) {
      priority = 0.9
      changefreq = 'monthly'
    } else if (path.startsWith('/blog/')) {
      priority = 0.8
      changefreq = 'monthly'
    } else if (path === '/how-it-works') {
      priority = 0.7
      changefreq = 'monthly'
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    }
  },
}
```

### 5.2 `robots.txt`

Добавить явный `Disallow: /s/` чтобы краулеры не тратили краулинговый бюджет на личные страницы:

```
User-agent: *
Allow: /
Disallow: /s/
Disallow: /wishlist/
Disallow: /oauth/
Disallow: /login/
Disallow: /registration/

Host: https://prosto-namekni.ru
Sitemap: https://prosto-namekni.ru/sitemap.xml
```

---

## Блок 6 — Регистрация в поисковиках (после деплоя)

1. **Google Search Console** — добавить ресурс, получить verification token, вставить в `metadata.verification.google` в `layout.tsx`, задеплоить, подтвердить. Отправить sitemap.xml.
2. **Яндекс Вебмастер** — добавить сайт, получить verification token, вставить в `metadata.verification.yandex` в `layout.tsx`, задеплоить, подтвердить. Отправить sitemap.xml.
3. **Яндекс Метрика** — настроить цель "Регистрация" (событие на кнопку "Создать аккаунт")
4. **Google Analytics** — аналогично

---

## Порядок реализации (параллельно)

### Высокий приоритет (делать сразу)
1. `lang="ru"` и `subsets: ['latin', 'cyrillic']` в `layout.tsx`
2. Root metadata рефакторинг (`layout.tsx`)
3. Фикс `how-it-works` (Pages Router → App Router metadata, H1, бренд)
4. Фикс `terms-of-service` (Pages Router → App Router metadata, noindex)
5. Создать `app/s/[shortId]/layout.tsx` с `robots: noindex`
6. JSON-LD на главной (`SoftwareApplication` + `WebSite`)
7. Создать `public/og-image.png`
8. Добавить OG-теги в layout и главную (после п.7)
9. Sitemap/robots.txt обновление

### Средний приоритет
10. `/how-it-works` — добавить `HowTo` JSON-LD
11. Occasion-лендинги (7 страниц)
12. Регистрация в Search Console и Вебмастере (после деплоя)

### Низкий приоритет (контент)
13. Блог-инфраструктура (MDX setup)
14. 5 стартовых статей
15. JSON-LD на блог-статьях и occasion-страницах

---

## Файлы для создания/изменения

**Изменить:**
- `app/layout.tsx` — lang, cyrillic subset, metadata, OG, verification
- `app/page.tsx` — расширить description/OG (title уже корректный)
- `app/how-it-works/page.tsx` — Head → metadata, H1, бренд, HowTo JSON-LD
- `app/terms-of-service/page.tsx` — Head → metadata, noindex
- `next-sitemap.config.js` — exclude /s/*, /login, /registration; transform с приоритетами
- `public/robots.txt` — Disallow /s/, /login/, /registration/

**Создать:**
- `app/s/[shortId]/layout.tsx` — noindex layout
- `public/og-image.png` — 1200×630
- `app/wishlist-for/[occasion]/page.tsx` + `content/occasions/*.ts`
- `app/blog/page.tsx` + `app/blog/[slug]/page.tsx`
- `content/blog/*.mdx` (5 статей)
