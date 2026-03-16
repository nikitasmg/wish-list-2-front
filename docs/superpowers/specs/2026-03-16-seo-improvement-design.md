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
| `how-it-works/page.tsx` использует `<Head>` из Pages Router | → заменить на `export const metadata: Metadata` |
| `terms-of-service/page.tsx` использует `<Head>` из Pages Router | → заменить на `export const metadata: Metadata` |
| Неверное название бренда "WishMaker" в `how-it-works` | → "Просто намекни" |

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
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
  },
}
```

### 1.3 Публичные вишлисты (`app/s/[shortId]/page.tsx`)

- Конвертировать из `'use client'` в серверный компонент с `generateMetadata`
- Добавить `robots: { index: false, follow: false }`
- Добавить в `next-sitemap.config.js` в `exclude: ['/s/*']`

### 1.4 Главная страница (`app/page.tsx`)

Расширить metadata:

```ts
export const metadata: Metadata = {
  title: 'Просто намекни — Создай вишлист и отправь ссылку',
  description: 'Намекни на то, чего хочешь — создай красивый вишлист онлайн и отправь ссылку. Никаких неловких разговоров о подарках. Бесплатно.',
  openGraph: {
    title: 'Просто намекни — Создай вишлист онлайн',
    description: 'Создай вишлист за минуту и поделись с друзьями. Бесплатно.',
    url: 'https://prosto-namekni.ru',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
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
  "applicationCategory": "LifestyleApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "RUB" },
  "description": "Бесплатный сервис создания вишлистов онлайн"
}
```

Дополнительно `WebSite` со `SearchAction` (sitelinks search box).

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

---

## Блок 5 — Sitemap + robots.txt

### 5.1 `next-sitemap.config.js`

```js
module.exports = {
  siteUrl: 'https://prosto-namekni.ru',
  generateRobotsTxt: true,
  exclude: ['/oauth', '/wishlist/*', '/s/*'],
  // Приоритеты через transform:
  // / → priority 1.0, changefreq: weekly
  // /wishlist-for/* → priority 0.9, changefreq: monthly
  // /blog/* → priority 0.8, changefreq: monthly
  // /how-it-works → priority 0.7
}
```

### 5.2 `robots.txt`

Добавить явный `Disallow: /s/` чтобы краулеры не тратили краулинговый бюджет на личные страницы.

---

## Блок 6 — Регистрация в поисковиках (после деплоя)

1. **Яндекс Вебмастер** — добавить сайт, подтвердить через meta-тег или DNS, отправить sitemap.xml
2. **Google Search Console** — добавить ресурс, подтвердить, отправить sitemap.xml
3. **Яндекс Метрика** — настроить цель "Регистрация" (событие на кнопку "Создать аккаунт")
4. **Google Analytics** — аналогично

---

## Порядок реализации (параллельно)

### Высокий приоритет (делать сразу)
1. `lang="ru"` в layout
2. Root metadata рефакторинг (layout.tsx + page.tsx)
3. Фикс `how-it-works` и `terms-of-service` (Pages Router → App Router metadata)
4. noindex для `/s/[shortId]`
5. JSON-LD на главной (`SoftwareApplication` + `WebSite`)
6. OG-изображение (статик)
7. Sitemap/robots.txt обновление

### Средний приоритет
8. `/how-it-works` — добавить `HowTo` JSON-LD
9. Occasion-лендинги (7 страниц)
10. Регистрация в Search Console и Вебмастере

### Низкий приоритет (контент)
11. Блог-инфраструктура (MDX setup)
12. 5 стартовых статей
13. JSON-LD на блог-статьях и occasion-страницах

---

## Файлы для создания/изменения

**Изменить:**
- `app/layout.tsx` — lang, metadata, OG
- `app/page.tsx` — расширить metadata, добавить JSON-LD
- `app/how-it-works/page.tsx` — Head → metadata, HowTo JSON-LD, исправить бренд
- `app/terms-of-service/page.tsx` — Head → metadata
- `app/s/[shortId]/page.tsx` — добавить noindex через generateMetadata
- `next-sitemap.config.js` — exclude /s/*, приоритеты
- `public/robots.txt` — Disallow /s/

**Создать:**
- `public/og-image.png`
- `app/wishlist-for/[occasion]/page.tsx` + `content/occasions/*.ts`
- `app/blog/page.tsx` + `app/blog/[slug]/page.tsx`
- `content/blog/*.mdx` (5 статей)
