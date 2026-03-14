# Example Page Design

**Goal:** Создать страницу `/example` с тремя статическими примерами вишлистов (день рождения ребёнка, свадьба, вечеринка), отображаемыми в виде превью-карточек с открытием полного вишлиста в модальном окне.

**Tech Stack:** Next.js 16 App Router, shadcn/ui Dialog, WishlistLanding, Tailwind CSS

---

## Architecture

Два файла:

- `app/example/data.ts` — статические мок-данные и тип `ExampleData`
- `app/example/page.tsx` — клиентская страница: сетка карточек + единый `Dialog`

Страница не требует API-запросов — всё статично.

---

## Data (`app/example/data.ts`)

### Тип

```ts
export type ExampleData = {
  wishlist: Wishlist
  presents: Present[]
}

export const examples: ExampleData[] = [...]
```

### Поля `Wishlist` (все обязательные)

| Поле | Значение |
|------|---------|
| `id` | уникальная строка (например `'example-birthday'`) |
| `title` | название |
| `description` | описание |
| `cover` | `''` (заглушка) |
| `presentsCount` | длина массива presents |
| `userId` | `'example'` |
| `settings.colorScheme` | схема (см. ниже) |
| `settings.showGiftAvailability` | `false` |
| `settings.presentsLayout` | `'grid2'` |
| `location.name` | `''` (пустая строка — поле обязательно, но не показываем) |
| `location.time` | `undefined` |
| `shortId` | `undefined` |
| `blocks` | `[]` |
| `createdAt` | `'2026-01-01T00:00:00Z'` |
| `updatedAt` | `'2026-01-01T00:00:00Z'` |

### Поля `Present` (все обязательные)

| Поле | Значение |
|------|---------|
| `id` | уникальная строка (например `'ex-b-1'`) |
| `wishlistId` | совпадает с `id` родительского вишлиста |
| `title` | название подарка |
| `description` | `''` или краткое описание |
| `cover` | `''` (нет изображения) |
| `link` | `undefined` |
| `price` | число или `undefined` |
| `reserved` | `false` |
| `createdAt` | `'2026-01-01T00:00:00Z'` |
| `updatedAt` | `'2026-01-01T00:00:00Z'` |

### Три примера

#### День рождения ребёнка 🎂
- `colorScheme: 'blush'`
- Подарки: LEGO City (4 990 ₽), Самокат Micro (7 500 ₽), Наушники JBL Kids (2 490 ₽), Книга «Гарри Поттер» (890 ₽)

#### Свадьба 💍
- `colorScheme: 'cloud'`
- Подарки: Чайник Smeg (12 900 ₽), Постельное Ikea (3 490 ₽), Сертификат в ресторан (5 000 ₽), Ваза Villeroy & Boch (8 200 ₽)

#### Вечеринка 🎉
- `colorScheme: 'cosmic'`
- Подарки: Коктейльный набор (3 200 ₽), Настолка «Имаджинариум» (1 890 ₽), Bluetooth-колонка JBL (4 990 ₽), Флешка с плейлистом (990 ₽)

---

## Page (`app/example/page.tsx`)

### Состояние

```ts
const [selected, setSelected] = React.useState<ExampleData | null>(null)
```

### Разметка

```tsx
<div>
  <h1>Примеры вишлистов</h1>
  <p>Подзаголовок</p>

  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
    {examples.map((ex) => (
      <ExampleCard key={ex.wishlist.id} data={ex} onOpen={() => setSelected(ex)} />
    ))}
  </div>

  <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null) }}>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
      {selected && (
        <WishlistLanding
          wishlist={selected.wishlist}
          presents={selected.presents}
          isMyWishlist={false}
          disableBodyTheme
        />
      )}
    </DialogContent>
  </Dialog>
</div>
```

### `ExampleCard` (инлайн-компонент)

- Цветная заглушка: дублирует паттерн из `wishlist-card.tsx` (функция `WishlistCoverPlaceholder` там не экспортируется — логика копируется inline ~15 строк)
- Название, кол-во подарков
- Кнопка «Посмотреть»

```tsx
function ExampleCard({ data, onOpen }: { data: ExampleData; onOpen: () => void }) {
  const scheme = colorSchema.find(s => s.value === data.wishlist.settings.colorScheme) ?? colorSchema[0]
  const [bg, accent] = scheme.colors
  // ... цветная заглушка + контент + кнопка
}
```

---

## Component Reuse

| Компонент | Откуда | Использование |
|-----------|--------|---------------|
| `WishlistLanding` | `app/s/[shortId]/components/wishlist-landing.tsx` | Полный вид вишлиста в модалке |
| `Dialog, DialogContent` | `components/ui/dialog` | Модальное окно (controlled: `open` + `onOpenChange`) |
| `Button` | `components/ui/button` | Кнопка «Посмотреть» |
| `colorSchema` | `shared/constants.ts` | Цветные заглушки карточек |

> `WishlistCoverPlaceholder` **не экспортируется** из `wishlist-card.tsx` — дублируем логику inline в `ExampleCard`.

---

## Pages & Routes

- `app/example/page.tsx` — новая страница, доступна без авторизации (не в `/wishlist/*`, middleware не блокирует)

---

## Out of Scope

- API-запросы / реальные данные
- Авторизация
- SEO-метаданные
- Резервирование подарков (кнопка «Зарезервировать» видна, но `isMyWishlist={false}` — стандартное поведение)
