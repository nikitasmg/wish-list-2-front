# Wishlist Templates — Design Spec

**Date:** 2026-04-03  
**Status:** Approved

---

## Overview

Добавляем выбор шаблона при создании вишлиста. Вместо мгновенного создания пустого вишлиста кнопка «Создать вишлист» ведёт на страницу `/wishlist/create`, где пользователь выбирает шаблон или начинает с чистого листа.

---

## User Flow

1. Пользователь на `/wishlist` нажимает «Создать вишлист»
2. Редирект на `/wishlist/create`
3. Страница показывает 5 шаблонов + «Скоро больше» (disabled) + «Пустой вишлист»
4. **Клик на шаблон** → открывается Dialog с формой: Название + Дата события
5. Пользователь заполняет → «Создать вишлист» → вызов `useApiCreateConstructorWishlist` → редирект в `/wishlist/edit/{id}`
6. **Клик на «Пустой вишлист»** → сразу создаётся пустой вишлист (текущее поведение), редирект в `/wishlist/edit/{id}`

---

## Страница `/wishlist/create`

### Layout

- Заголовок: «Создать вишлист» + подзаголовок «Начни с шаблона — мы уже собрали структуру за тебя.»
- Лейбл «Выбери шаблон»
- Сетка 3×2: 5 карточек шаблонов + 1 карточка «Скоро больше»
- Разделитель «или»
- Кнопка «Пустой вишлист»

### Template Cards

Каждая карточка:
- Верхняя часть: градиент из двух цветов темы (`colors[0]` → `colors[1]`), крупная эмодзи, подпись категории (прим. «День рождения»)
- Нижняя часть: белый фон, `border-top` акцентного цвета, жирное название, серое описание блоков
- Hover: `translateY(-2px)` + box-shadow в цвет акцента

### Шаблоны

| ID | Название | Эмодзи | Тема | colorScheme |
|----|----------|--------|------|-------------|
| `birthday_boy` | Для мальчика | 🚀 | Cloud | `cloud` |
| `birthday_girl` | Для девочки | 🦄 | Blush | `blush` |
| `birthday_man` | Для него | 🎯 | Cosmic | `cosmic` |
| `birthday_woman` | Для неё | 💐 | Lavender | `lavender` |
| `wedding` | Свадьба | 💍 | Sand | `sand` |

«Скоро больше» — disabled карточка, не кликабельна.

---

## Dialog (форма шаблона)

Открывается поверх страницы при клике на шаблон. Shadcn `<Dialog>`.

**Заголовок диалога:** Только название шаблона — например «Для неё» (без категории).

**Поля:**
- **Название вишлиста** — текстовый input, placeholder «День рождения Маши»
- **Дата события** — date-picker (существующий `DatePicker` из `app/wishlist/components/date-picker.tsx`)

**Кнопки:**
- «Отмена» — закрывает диалог
- «Создать вишлист» — акцентный цвет из темы шаблона, вызывает создание

**Валидация:** название обязательно (не пустое), дата опциональна.

---

## Архитектура

### `content/templates/index.ts`

```ts
export type WishlistTemplate = {
  id: string
  label: string        // «Для неё»
  category: string     // «День рождения»
  emoji: string
  colorScheme: string  // значение из colorSchema
  accentColor: string  // colors[1] из colorSchema — для border и кнопки
  buildBlocks: (title: string, date?: Date) => Block[]
}

export const templates: WishlistTemplate[] = [ /* 5 шаблонов */ ]
```

Каждый `buildBlocks(title, date)` возвращает `Block[]` с датой, вшитой в блоки `type: 'date'` и `type: 'timing'`, и именем именинника в блоке `type: 'text'`.

### Блоки по шаблону

**birthday_boy / birthday_girl** (детские):
`text` (приветствие) → `date` + `location` → `timing` → `divider` → `agenda` → `checklist` → `divider` → `contact`

**birthday_man / birthday_woman** (взрослые):
`text` (приветствие) → `date` + `location` → `timing` → `divider` → `quote` → `contact`

**wedding**:
`text` (приветствие) → `date` + `location` → `timing` → `divider` → `agenda` → `contact` (жених) + `contact` (невеста)

### Новые файлы

- `content/templates/index.ts` — определения шаблонов
- `app/wishlist/create/page.tsx` — страница выбора
- `app/wishlist/create/components/template-card.tsx` — карточка шаблона
- `app/wishlist/create/components/template-dialog.tsx` — Dialog с формой

### Изменения в существующих файлах

- `app/wishlist/page.tsx` — кнопка «Создать вишлист» меняет `onClick` с прямого вызова `createConstructor` на `router.push('/wishlist/create')`

---

## Out of scope

- Создание подарков (presents) из шаблона — не реализуется
- Превью шаблона до создания — не реализуется
- Серверное хранение шаблонов — шаблоны только на фронте
