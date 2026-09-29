# Расширенные типы подарков + фикс описания на мобилке

Дата: 2026-06-16
Статус: согласовано

## Цель

Расширить функциональность подарков в вишлисте тремя возможностями:

1. **Групповой подарок** — несколько человек могут отметить «я хочу подарить»
   (например, деньги, которые скидываются дарить несколько человек). Отслеживание —
   простой анонимный счётчик участников.
2. **Многосоставной подарок** — один подарок объединяет несколько недорогих вещей:
   несколько картинок (слайдер в обложке) и несколько ссылок.
3. **Фикс UI-бага** — на мобильных устройствах обрезается описание подарка
   (`line-clamp-3`). Описание должно быть видно всегда полностью.

## Согласованные решения

- Групповой подарок отслеживается **простым счётчиком участников** (без целевой
  суммы, без лимита, без идентификации на сервере). Бронь остаётся анонимной, как
  сейчас; собственное участие запоминается в `localStorage`.
- Многосоставной подарок — **галерея картинок + плоский список ссылок**. Цена и
  описание общие на весь набор; у отдельных позиций своих полей нет.
- Типы подарка **взаимоисключающие**: `single` | `group` | `multi`.
- Описание в публичной карточке показывается **всегда полностью** (убрать
  `line-clamp-3`).
- Групповой подарок может иметь собственную обложку и ссылку (например, на
  конкретный товар, на который скидываются).

## Текущее состояние (что есть сейчас)

- Бэкенд: `entity.Present` / `PresentModel` — плоские поля: один `Cover`, один
  `Link`, один `Price`, `Reserved bool`. Миграции — через GORM `AutoMigrate`
  (`internal/app/app.go`).
- Бронь анонимна: публичный `PUT /presents/:id/reserve` переключает boolean, без
  авторизации. Есть `PUT /presents/:id/release`.
- Картинки заливаются заранее через `POST /upload` (возвращает `{ url }`) и
  `POST /upload/bulk` (поле `files`, до 10 шт.). В подарок приходят готовые URL —
  `parsePresentInput` читает `cover_url`.
- Фронт: форма `app/wishlist/[id]/present/components/create-edit-form.tsx`
  (multipart/form-data), публичная карточка
  `app/s/[shortId]/components/present-item.tsx` (`line-clamp-3` на описании —
  баг), карточка владельца `app/wishlist/[id]/present/components/present-card.tsx`
  (`truncate`, одна строка — оставляем).
- UI-примитивов carousel / tabs / radio-group нет; есть `select.tsx`.

## Модель данных (бэкенд)

Добавить в `entity.Present` и `PresentModel` (`internal/repo/persistent/models.go`):

| Поле | Тип | Назначение |
|------|-----|-----------|
| `Type` | `string`, default `"single"` | `"single"` \| `"group"` \| `"multi"` |
| `ParticipantsCount` | `int`, default `0` | счётчик для группового |
| `Images` | `[]string` (jsonb) | галерея для многосоставного |
| `Links` | `[]string` (jsonb) | несколько ссылок для многосоставного |

GORM `AutoMigrate` создаст новые колонки автоматически. Для jsonb-массивов добавить
тип `StringSliceJSON` с реализацией `driver.Valuer` / `sql.Scanner` по образцу
существующих `BlocksJSON` / `SettingsJSON` в `models.go`.

Конвертеры `toPresentModel` / `toPresentEntity` (`converters.go`) дополнить новыми
полями.

Поведение по типам (взаимоисключающие):

- **single** — `Cover`, `Link`, `Price`, `Reserved` (как сейчас, без изменений).
- **group** — `Cover`, `Link`, `Price`, `ParticipantsCount`. `Reserved` не
  используется.
- **multi** — `Images[]` (слайдер), `Links[]`, `Price`, `Reserved` (весь набор
  бронирует один человек).

## API (бэкенд)

### Create / Update

`parsePresentInput` (`internal/controller/restapi/v1/present.go`) дополнить чтением
новых form-полей:

- `type` — строка; валидировать против множества `{single, group, multi}`,
  пустое → `single`.
- `images` — JSON-строка массива URL (`json.Unmarshal` в `[]string`).
- `links` — JSON-строка массива URL (`json.Unmarshal` в `[]string`).

`usecase.CreatePresentInput` дополнить полями `Type`, `Images`, `Links`. Usecase
`Create` / `Update` (`internal/usecase/present/present.go`) проставляет их в
сущность. `ParticipantsCount` владельцем не задаётся (стартует 0).

Валидация: для `multi` ссылки/картинки опциональны, но если присутствуют —
проверить длину URL (по образцу `validatePresentFields`) и лимит количества.

### Групповой счётчик

Два новых публичных роута рядом с `reserve` / `release`
(`internal/controller/restapi/v1/router.go`, секция `api` без авторизации):

- `PUT /presents/:id/join` → `ParticipantsCount++`
- `PUT /presents/:id/leave` → `ParticipantsCount--` (не ниже 0)

Хендлеры по образцу `reserve` / `release`. Usecase-методы `Join` / `Leave`:
загрузить подарок, проверить `Type == "group"` (иначе ошибка), изменить счётчик,
сохранить. `reserve` / `release` остаются для single/multi без изменений.

## Фронтенд

### Типы

`shared/types.ts` — в `Present` добавить:

```ts
type: 'single' | 'group' | 'multi'
participantsCount: number
images?: string[]
links?: string[]
```

### API-хуки

`api/present/index.ts` — добавить `useApiJoinGroupPresent` и
`useApiLeaveGroupPresent` (по образцу `useApiReservePresent`, инвалидируют
`['presents', wishlistId]`).

### Форма создания/редактирования

`create-edit-form.tsx`:

- Сверху селектор типа (3 варианта: Обычный / Групповой / Многосоставной) —
  сегментированный переключатель.
- Поля рендерятся по выбранному типу:
  - **single** — как сейчас (title, description, price, link, cover).
  - **group** — title, description, price, link, cover + подсказка «несколько
    человек смогут отметить, что хотят подарить».
  - **multi** — title, description, price + мульти-загрузка картинок (галерея) +
    динамический список ссылок (add/remove через `useFieldArray`).
- Zod-схема расширяется полем `type` и условными `images` / `links`.
- `onSubmit` отправляет `type`, а для multi — `images` и `links` как
  JSON-строки массивов.

Новые UI-компоненты:

- `MultiImageUpload` — поверх существующего `uploadImage` (`api/upload.ts`):
  массив URL, добавление/удаление, превью. Возвращает `string[]`.
- Сегментированный переключатель типа (на базе кнопок или нового tabs-примитива).

### Отображение (публичная карточка `present-item.tsx`)

- **Обложка:** для `multi` с >1 картинкой — слайдер (carousel); иначе как сейчас
  (`CardCover` / заглушка с `Heart`).
- **group:** вместо «Забронировать» — кнопка «Я хочу подарить» + текст «N человек
  хотят подарить». Toggle join/leave; собственное участие хранится в `localStorage`
  (ключ по `present.id`), бронь анонимна как и сейчас.
- **multi:** вместо одной ссылки «В магазин» — список всех ссылок из `links[]`.
- **Описание:** убрать `line-clamp-3` → текст виден всегда (фикс мобильного бага).
  Пересмотреть фиксированные `min-h-[72px]` / `min-h-[65px]`, чтобы не ломали
  раскладку при полном тексте.

### Карточка владельца (`present-card.tsx`)

- Показывать первую картинку (`images?.[0]` или `cover`) как обложку.
- Маленький бейдж типа (групповой / многосоставной).
- `truncate` описания оставить (компактный админский вид, баг был в публичной
  карточке).

## Новые зависимости

- `embla-carousel-react` + shadcn `carousel` (для слайдера обложки multi).

## Вне рамок (YAGNI)

- Целевая сумма / прогресс-бар для группового — не делаем.
- Лимит участников — не делаем.
- Идентификация участников на сервере — не делаем (анонимно + localStorage).
- Комбинирование типов — не делаем (взаимоисключающие).
- Отдельные цены/описания у позиций multi — не делаем.

## Затрагиваемые файлы

Бэкенд (`/Users/nvsmagin/GolandProjects/wishlist`):
- `internal/entity/present.go`
- `internal/repo/persistent/models.go` (+ тип `StringSliceJSON`)
- `internal/repo/persistent/converters.go`
- `internal/usecase/present/present.go` (+ `CreatePresentInput`, `Join`/`Leave`)
- `internal/usecase/*` интерфейс `PresentUseCase`
- `internal/controller/restapi/v1/present.go` (parse + хендлеры join/leave)
- `internal/controller/restapi/v1/router.go` (роуты)

Фронтенд:
- `shared/types.ts`
- `api/present/index.ts`
- `app/wishlist/[id]/present/components/create-edit-form.tsx`
- `app/s/[shortId]/components/present-item.tsx`
- `app/wishlist/[id]/present/components/present-card.tsx`
- новый `components/multi-image-upload.tsx`
- новый `components/ui/carousel.tsx` (shadcn)
- сегментированный переключатель типа
