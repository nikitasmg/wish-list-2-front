# Wishlist Constructor-Only Redesign

**Date:** 2026-03-14
**Branch:** feature/constructor-wishlist

## Overview

Переход на конструктор как единственный способ создания вишлистов. Переработка UI карточек, модализация создания/редактирования подарков, упрощение шаринга до нативного API, удаление всего legacy-кода. База чистая — старых вишлистов без блоков нет.

---

## 1. Удаление старого способа создания вишлистов

### Что удаляем
- Страница `/wishlist/create` (`app/wishlist/create/page.tsx`)
- Компонент `app/wishlist/components/create-form.tsx`
- Кнопка «Обычный вишлист» на странице списка вишлистов
- Проверка `Array.isArray(blocks)` в `edit/[id]/page.tsx` — всегда показываем `ConstructorEditor`

### Что остаётся
- Единственная точка создания: кнопка «Создать вишлист» на `/wishlist` → `useApiCreateConstructorWishlist()` → редирект в `/wishlist/edit/{id}`

---

## 2. Редизайн страницы списка вишлистов

### Карточка вишлиста (`WishlistCard`)

**Раскладка:** компактная сетка — 3–4 колонки на десктопе, 2 на планшете, 1 на мобильном. Брейкпоинты на усмотрение разработчика (tailwind `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`).

**Структура карточки:**
- Обложка сверху (110px, `object-fit: cover`)
- Заглушка при `cover == null`: точечный паттерн + градиент из цветовой схемы
- Название (1–2 строки, truncate)
- Мета: кол-во подарков · дата (если есть)
- Футер: кнопка «Поделиться» + кнопка «Открыть» (primary)
- Меню (⋯): «Редактировать» → `/wishlist/edit/{id}`, «Удалить»

**Заглушка (нет обложки):**
- `radial-gradient` точечный паттерн с акцентным цветом схемы (opacity 15%)
- Поверх: `linear-gradient` из двух цветов схемы (opacity 25–15%)
- Цвета берутся из `getSchemeConfig(wishlist.settings.colorScheme)`

### Страница списка (`/wishlist`)
- Одна кнопка «Создать вишлист» (или FAB на мобильном)
- Пустое состояние: иллюстрация/иконка + текст + CTA «Создать первый вишлист»

---

## 3. Модалка создания/редактирования подарка

### Затронутые файлы
- **Удалить:** `app/wishlist/[id]/present/create/page.tsx`
- **Удалить:** `app/wishlist/[id]/present/edit/[presentId]/page.tsx`
- **Создать:** `app/wishlist/components/present-modal.tsx`

### API компонента
```tsx
<PresentModal
  wishlistId={string}
  present={Present | undefined}  // undefined = create mode, Present = edit mode
  open={boolean}
  onOpenChange={(open) => void}
/>
```
Заголовок: «Новый подарок» (create) / «Редактировать подарок» (edit).
CTA: «Добавить» (create) / «Сохранить» (edit).

### Поведение
- После сохранения: `queryClient.invalidateQueries(['presents', wishlistId])` → модалка закрывается → остаёмся на вкладке «Подарки»
- Кнопка submit disabled пока поле «Название» пустое

### Структура диалога

**Секция парсера (верхняя):**
- Input для вставки ссылки
- Бейджи: Ozon, Wildberries, Яндекс Маркет
- Кнопка «Найти» — **disabled**, при клике toast «Скоро появится 🚀»
- UI трёх состояний реализован (пустой / загрузка / заполнен) — активируется когда бэкенд парсера будет готов без изменения UI

**Форма:**
- Превью обложки + кнопка загрузки (`ImageUpload` компонент, существующее поведение)
- Название (required, text input)
- Цена (number input, опционально) + Ссылка (url input, опционально) — в одну строку
- Описание (textarea, опционально)

**Удаление подарка** — не в модалке. Остаётся в меню `PresentMenu` на карточке подарка (существующее поведение).

**Загрузка изображения** — `multipart/form-data`, через существующий `ImageUpload` компонент, поведение не меняется.

---

## 4. Упрощение шаринга

### Что удаляем
- `components/share-sheet.tsx` — bottom sheet с QR-кодом
- `app/wishlist/[id]/components/share-buttons.tsx` — старый компонент
- Зависимость `qrcode.react` (проверить что больше нигде не используется)

### Новый share UI (рефактор `components/share-button.tsx`)
Две кнопки рядом:

1. **«Поделиться»** — вызывает `navigator.share({ title: wishlist.title, url })`. Если API недоступен (`!navigator.share`) — автоматически копирует URL в буфер как fallback.
2. **«Скопировать ссылку»** — всегда видна, копирует URL в буфер + toast «Ссылка скопирована»

**URL везде:** `${NEXT_PUBLIC_APP_URL}/s/${wishlist.shortId}`

Если `wishlist.shortId` не определён (не ожидается, но на всякий случай) — кнопки задизейблены.

### Места использования
- Карточка вишлиста (`WishlistCard`) — в футере карточки
- Конструктор (`constructor-editor.tsx`) — в шапке или настройках

---

## 5. Удаление старого URL-формата

### Что удаляем
- `app/[userId]/[wishlistId]/page.tsx` — полностью, без редиректа

**Решение принято осознанно:** база чистая, старых публичных ссылок нет. Единственный публичный URL — `/s/{shortId}`.

---

## Файлы к удалению

| Файл | Причина |
|------|---------|
| `app/wishlist/create/page.tsx` | Старая форма создания |
| `app/wishlist/components/create-form.tsx` | Старая форма |
| `app/wishlist/[id]/present/create/page.tsx` | Переезжает в модалку |
| `app/wishlist/[id]/present/edit/[presentId]/page.tsx` | Переезжает в модалку |
| `app/[userId]/[wishlistId]/page.tsx` | Старый URL-формат |
| `components/share-sheet.tsx` | Заменяется новым share UI |
| `app/wishlist/[id]/components/share-buttons.tsx` | Заменяется новым share UI |

## Файлы к созданию

| Файл | Назначение |
|------|-----------|
| `app/wishlist/components/present-modal.tsx` | Модалка create/edit подарка с секцией парсера |

## Файлы к изменению

| Файл | Изменение |
|------|-----------|
| `app/wishlist/page.tsx` | Убрать кнопку «Обычный вишлист», добавить пустое состояние |
| `app/wishlist/edit/[id]/page.tsx` | Убрать проверку blocks, всегда рендерить `ConstructorEditor` |
| `app/wishlist/components/wishlist-card.tsx` | Новый дизайн, заглушка, новые кнопки |
| `app/wishlist/components/constructor-editor.tsx` | Вкладка «Подарки» открывает `PresentModal` вместо перехода на страницу |
| `components/share-button.tsx` | Рефактор: share + copy, новый URL |
