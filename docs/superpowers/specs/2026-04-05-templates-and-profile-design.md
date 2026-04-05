# Шаблоны вишлистов и личный кабинет — Спецификация

**Дата:** 2026-04-05  
**Статус:** Approved

---

## 1. Обзор

Добавляем возможность сохранять вишлист как шаблон (структура блоков без контента + настройки), управлять шаблонами в личном кабинете, делиться ими публично через глобальную галерею. Параллельно расширяем профиль пользователя: `displayName` и `avatar`.

---

## 2. Изменения в данных

### 2.1 Новая таблица `templates`

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE
name        text NOT NULL
settings    jsonb NOT NULL  -- { colorScheme, showGiftAvailability, presentsLayout }
blocks      jsonb NOT NULL  -- [{ type, row, col, colSpan, data: {} }]
is_public   bool NOT NULL DEFAULT false
created_at  timestamptz NOT NULL DEFAULT now()
updated_at  timestamptz NOT NULL DEFAULT now()
```

**Стриппинг блоков:** при сохранении шаблона бэк обнуляет `data → {}` для каждого блока, сохраняя только `type`, `row`, `col`, `colSpan`. Контент (тексты, URL, даты) не сохраняется.

### 2.2 Расширение таблицы `users`

```sql
display_name  text        -- публичное имя, nullable
avatar        text        -- URL аватарки в MinIO, nullable
```

---

## 3. Бэкенд

### 3.1 Эндпоинты

| Метод | URL | Auth | Описание |
|---|---|---|---|
| `GET` | `/templates` | нет | Публичная галерея (is_public=true), пагинация cursor-based |
| `GET` | `/templates/my` | да | Все шаблоны текущего пользователя |
| `POST` | `/templates` | да | Создать шаблон из wishlistId |
| `PATCH` | `/templates/:id` | да | Переименовать / изменить is_public |
| `DELETE` | `/templates/:id` | да | Удалить шаблон |
| `POST` | `/wishlists/from-template/:templateId` | да | Создать вишлист из шаблона |
| `PATCH` | `/users/me` | да | Обновить displayName / avatar |

### 3.2 Контракты запросов/ответов

**POST /templates**
```json
Request:  { "wishlistId": "uuid", "name": "string", "isPublic": false }
Response: { "data": Template }
```

**PATCH /templates/:id**
```json
Request:  { "name"?: "string", "isPublic"?: bool }
Response: { "data": Template }
```

**POST /wishlists/from-template/:templateId**
```json
Request:  { "title": "string" }
Response: { "data": Wishlist }
```

**PATCH /users/me**
```json
Request:  multipart/form-data: { displayName?: string, avatar?: File }
Response: { "user": User }
```

**GET /templates** (пагинация)
```
Query params: limit=20&cursor=<created_at_iso>
Response: { "data": Template[], "nextCursor": string | null }
```

### 3.3 Безопасность

- `GET /templates` — публичный, без auth
- Все остальные эндпоинты — за существующим auth middleware
- `PATCH /templates/:id` и `DELETE /templates/:id` проверяют `user_id == текущий пользователь` (403 иначе)
- `POST /wishlists/from-template/:id` работает с публичными шаблонами ИЛИ шаблонами текущего пользователя

### 3.4 Go-структуры

```go
// entity/template.go
type Template struct {
    ID        uuid.UUID
    UserID    uuid.UUID
    Name      string
    Settings  Settings  // переиспользуем существующий тип
    Blocks    []Block   // переиспользуем существующий тип
    IsPublic  bool
    CreatedAt time.Time
    UpdatedAt time.Time
}
```

Расширение `User`:
```go
type User struct {
    ID          uuid.UUID
    Username    string
    Password    string
    DisplayName string
    Avatar      string
}
```

---

## 4. Фронтенд

### 4.1 Новые типы (`shared/types.ts`)

```ts
export type Template = {
  id: string
  userId: string
  userDisplayName?: string  // денормализовано с бэка (JOIN users) — приходит в обоих GET /templates и GET /templates/my
  name: string
  settings: {
    colorScheme: string
    showGiftAvailability: boolean
    presentsLayout?: 'list' | 'grid3' | 'grid2'
  }
  blocks: Block[]
  isPublic: boolean
  createdAt: string
  updatedAt: string
}
```

Расширение `User`:
```ts
export type User = {
  id: string
  username: string
  displayName?: string
  avatar?: string
}
```

### 4.2 Новые API-хуки (`api/template/index.ts`)

```ts
useApiGetPublicTemplates()       // GET /templates (с пагинацией)
useApiGetMyTemplates()           // GET /templates/my
useApiCreateTemplate()           // POST /templates
useApiUpdateTemplate(id)         // PATCH /templates/:id
useApiDeleteTemplate(id)         // DELETE /templates/:id
useApiCreateWishlistFromTemplate() // POST /wishlists/from-template/:id
```

Расширение `api/user/index.ts`:
```ts
useApiUpdateMe()                 // PATCH /users/me
```

### 4.3 Новые страницы и компоненты

#### Страница `/templates` (публичная галерея)

- Доступна без авторизации
- Грид карточек: название шаблона, превью цветовой схемы, автор (`displayName`)
- Кнопка "Использовать": авторизован → `FromUserTemplateDialog` → `POST /wishlists/from-template/:id` → редирект в редактор; неавторизован → `/login`
- Пагинация "Загрузить ещё" (cursor-based)

#### Компонент `FromUserTemplateDialog` (новый, отдельный от `TemplateDialog`)

- Упрощённая версия: только поле "Название вишлиста" + кнопки "Отмена" / "Создать"
- Без datepicker — пользовательские шаблоны имеют пустые блоки, дату вставлять некуда
- Существующий `TemplateDialog` остаётся без изменений для системных шаблонов

#### Страница `/wishlist/settings` (личный кабинет)

- В существующем `/wishlist` layout (за auth)
- Аватарка: upload через существующий `/upload` endpoint, превью
- Отображаемое имя: input для `displayName`
- Username: read-only поле
- Кнопка "Сохранить" → `PATCH /users/me`

#### Компонент `SaveAsTemplateModal`

- Переиспользуется из обеих точек входа
- Поля: название (prefilled из `wishlist.title`), тогл "Сделать публичным"
- При сабмите: `POST /templates` → toast "Шаблон сохранён"
- Toast содержит ссылку "Мои шаблоны" → `/templates`

### 4.4 Изменения существующих компонентов

**`ConstructorHeader`** — добавить кнопку "Сохранить как шаблон" (иконка + текст), открывает `SaveAsTemplateModal`.

**`WishlistMenu`** (`app/wishlist/[id]/components/wishlist-menu.tsx`) — добавить пункт "Сохранить как шаблон" в меню `...`.

**`app/wishlist/create/page.tsx`** — добавить секцию "Мои шаблоны":
```
[Системные шаблоны — текущие hardcoded]
─── или ───
Мои шаблоны    [кнопка "Пользовательские шаблоны" → /templates]
  [до 4 карточек из useApiGetMyTemplates()]
  (секция не показывается если шаблонов нет)
─── или ───
[Пустой вишлист]
```

**`app/wishlist/layout.tsx`** — добавить пункт "Настройки" в навигацию.

---

## 5. Флоу "Сохранить как шаблон"

```
Пользователь нажимает "Сохранить как шаблон"
  (из ConstructorHeader или WishlistMenu)
  ↓
SaveAsTemplateModal открывается
  ↓
Заполняет название, опционально включает is_public
  ↓
POST /templates { wishlistId, name, isPublic }
  ↓
Бэк: загружает вишлист, стриппит data блоков → {}
     сохраняет в templates
  ↓
Toast "Шаблон сохранён" + ссылка "Мои шаблоны"
```

---

## 6. Флоу "Использовать шаблон из галереи"

```
/templates → кнопка "Использовать"
  ↓
Если не авторизован → /login
  ↓
TemplateDialog (ввод названия вишлиста)
  ↓
POST /wishlists/from-template/:templateId { title }
  ↓
Бэк: копирует settings + blocks из шаблона,
     создаёт новый вишлист с title
  ↓
Редирект → /wishlist/edit/:newWishlistId
```

---

## 7. Что НЕ входит в скоуп

- Редактирование блоков внутри шаблона (шаблон не редактируется, только переименовывается и меняется публичность)
- Поиск/фильтрация в галерее (добавить позже)
- Лайки/избранное для шаблонов
- Категории шаблонов
- Изменение username (только displayName)
