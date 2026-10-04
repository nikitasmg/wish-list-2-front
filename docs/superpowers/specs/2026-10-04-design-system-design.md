# Дизайн-система: смысловые токены и единые компоненты

Дата: 4 октября 2026. Ветка фронта: `redesign`.

## Зачем

Интерфейс собран из «пикселей», а не из шкалы. В 152 файлах `app/` и
`components/` — 16 произвольных скруглений (`rounded-[10px]`, `[14px]`,
`[18px]`…), 23 произвольных кегля (`text-[13px]` ×61, `[11px]` ×39,
`[15px]` ×26…), 14 вариантов тени, 7 высот кнопок, 99 самодельных
`<button>` рядом с 82 `<Button>`, 150 hex/rgba прямо в TSX. Макет
(канвас «Просто намекни — редизайн») сам нарисован так же: 25 разных
радиусов и 26 кеглей.

Цель — один набор токенов, названных по роли, весь код на нём, и запрет,
который не даст разнобою вернуться.

## Решения

- **Источник значений — макет + код.** Значения сведены по частотам в
  13 крупных артбордах (~1500 значений) и в коде; близкие схлопнуты.
  Вид сайта почти не меняется (сдвиги 1–2 px), становится консистентным.
- **Палитры схем не меняем.** «Правила дома» скилла
  claude-design-system-architect (без фиолетового, тёплые тона) отключены.
- **Подход A — смысловые токены.** Имена по роли (`text-body`,
  `rounded-control`, `shadow-float`), а не переопределение стоковой шкалы
  Tailwind: так ничего не меняется молча, а класс говорит, зачем он стоит.
- **Объём — всё сразу:** интерфейс, страница гостя, лендинг,
  «Как это работает», блог и юридические страницы.

## 1. Типографика

Гарнитура — Manrope. Шрифты заголовков страницы гостя (`look-font-*`) не
трогаем. Трекинг, интерлиньяж и вес зашиты в токен: `tracking-[…]`,
`leading-[…]` рядом с ними в разметке не нужны.

| Токен | Кегль | Интерлиньяж | Трекинг | Вес | Роль |
|---|---|---|---|---|---|
| `text-micro` | 11 | 1.3 | 0 | — | бейджи, «новый», «главная мечта» |
| `text-eyebrow` | 11 | 1.3 | 0.08em, капс | 700 | надпись над заголовком |
| `text-caption` | 12 | 1.4 | 0 | — | шапки таблиц, подсказки, даты |
| `text-label` | 13 | 1.4 | 0 | — | подписи полей, сегменты, метаданные |
| `text-body-sm` | 14 | 1.5 | 0 | — | второстепенный текст, малые кнопки |
| `text-body` | 15 | 1.5 | 0 | — | основной текст, кнопки, поля |
| `text-lead` | 16 | 1.5 | 0 | — | подзаголовок под H1 |
| `text-title-xs` | 17 | 1.3 | −0.01em | 700 | заголовок в шапке, строки-карточки |
| `text-title-sm` | 20 | 1.25 | −0.02em | 800 | заголовки блоков |
| `text-title` | 24 | 1.2 | −0.02em | 800 | модалки, карточки вишлистов |
| `text-title-lg` | 32 | 1.1 | −0.03em | 800 | H1 рабочих экранов |
| `text-display-sm` | 44 | 1.03 | −0.033em | 800 | H1 кабинета |
| `text-display` | 64 | 1 | −0.04em | 800 | лендинг |
| `text-display-xl` | 112 | 1 | −0.045em | 800 | герой лендинга |

Вес «—» = не задан токеном: ставится классом `font-*` рядом (подписи полей
и сегменты — `font-semibold`). Так перевод не делает текст жирнее молча.
Заголовки (`title-*`, `display-*`) вес задают всегда.

Нынешние `display-sm` (32) и `display` (44) переименовываются:
32 → `title-lg`, 44 → `display-sm`, 64 → `display`, 112 → `display-xl`.
Адаптивность — сменой токена на брейкпоинте (`text-title md:text-title-lg`),
не `clamp` в разметке.

## 2. Скругления

| Токен | Значение | Роль |
|---|---|---|
| `rounded-xs` | 4px | образцы цвета, мелкие метки |
| `rounded-tag` | 8px | бейджи, кнопки ≤ 30px, сегмент внутри переключателя, превью 34–48px |
| `rounded-control` | 10px | кнопки и поля 32–40px |
| `rounded-control-lg` | 14px | кнопки и поля 44–56px |
| `rounded-card` | 18px | карточки, панели |
| `rounded-sheet` | 24px | модалки, шторки, макеты телефона |
| `rounded-full` | 9999px | аватары, точки, таблетки |
| `rounded-block` | `var(--radius)` | блоки страницы гостя — у каждой схемы свой |
| `rounded-block-sm` | `calc(var(--radius) - 4px)` | элементы внутри блока гостя (фото, кнопки) |
| `rounded-none` | 0 | — |

Направленные варианты (`rounded-t-sheet`, `rounded-b-card`) работают
автоматически.

**Вложенность:** внутренний радиус = внешний − отступ между ними.
Переключатель: контейнер `rounded-control` (10) с `p-0.5` (2) → сегменты
`rounded-tag` (8).

## 3. Отступы

Шкала Tailwind (шаг 4px). Разрешённые шаги: `0 px 0.5 1 1.5 2 2.5 3 3.5 4
5 6 7 8 9 10 12 14 16 18 20`, на лендинге и в «Как это работает» ещё
`24 28 32` для вертикальных отступов секций. Произвольные `p-[…]`, `gap-[…]`, `m-[…]`
запрещены.

Роли `gap` (близость: внутри группы меньше, чем между группами):

| Уровень | Шаг | px |
|---|---|---|
| внутри элемента управления | `2` | 8 |
| поля формы, пункты списка | `3`–`3.5` | 12–14 |
| группы на экране | `5`–`6` | 20–24 |
| секции | `9`–`14` | 36–56 |
| поля страницы | `px-4` → `md:px-16` | 16 → 64 |

## 4. Высоты элементов управления

| Токен | px | Где |
|---|---|---|
| `h-control-sm` | 32 | сегменты, малые кнопки, кнопки в тулбарах |
| `h-control` | 40 | обычные кнопки и поля |
| `h-control-lg` | 48 | поля форм, главные кнопки, всё основное на телефоне |
| `h-control-xl` | 56 | крупные CTA лендинга и шагов создания |

Те же ключи в `size-*` и `w-*` для квадратных кнопок-иконок.
Кнопки гостя «Беру» и чипы в карточках (26–28px) — `h-7` + `rounded-tag`:
это не элемент управления формы, а метка-кнопка внутри карточки, на
телефоне её область нажатия расширяется псевдоэлементом до 44px.

## 5. Тени

| Токен | Значение | Роль |
|---|---|---|
| `shadow-float` | `0 16px 40px rgb(0 0 0 / var(--shadow-alpha))` | тосты, меню, поповеры, перетаскиваемый блок |
| `shadow-overlay` | `0 32px 96px rgb(0 0 0 / var(--shadow-alpha-strong))` | модалки, шторки, макеты устройств |
| `shadow-ring` | `0 0 0 2px hsl(var(--ring))` | выбранный элемент (не фокус) |
| `shadow-none` | — | — |

`--shadow-alpha` = 0.45 / 0.12 и `--shadow-alpha-strong` = 0.5 / 0.18
(тёмная / светлая тема). У кнопок, полей и карточек теней нет.

## 6. Цвета

Роли схем и shadcn остаются как есть. Добавляются:

| Токен | Значение | Роль |
|---|---|---|
| `--success` / `success-foreground` | `160 81% 30%` (`#0E8A6A`) / белый | «подарено», «добавлено» |
| `--warning` / `warning-foreground` | `43 100% 70%` (`#FFD166`) / `45 100% 9%` | «главная мечта» |
| `--brand-gradient` | `linear-gradient(90deg, #17B6D6, #7B5CF0)` | главная кнопка интерфейса (`bg-brand`) |
| `--overlay` | `rgb(3 5 12 / 0.72)` | подложка модалок |

В светлой теме `--success` и `--warning` затемнены до AA на белом
(`--warning` → `36 90% 38%`). Токен `blue` удаляется, если не используется.

Hex и `rgba()` в TSX запрещены, кроме данных: палитр в
`shared/constants.ts`, `derive-scheme.ts`, заготовок цвета в выборе
«своей схемы». Мокапы на лендинге и в «Как это работает» рисуются
классами схем (`.midnight`, `.linen` …) и ролями. `text-white`,
`bg-black/…`, `blue-600` → роли (`text-primary-foreground`,
`bg-overlay`, `text-primary`). Исключение — текст поверх фото
(`text-white` + градиент-подложка): отмечается комментарием.

## 7. Анимации

В макете анимаций нет; принципы — из apple-design.

| Токен | Значение | Роль |
|---|---|---|
| `duration-fast` | 120ms | нажатие, наведение |
| `duration-base` | 200ms | меню, смена состояния, тост |
| `duration-slow` | 320ms | модалка, шторка |
| `ease-out-soft` | `cubic-bezier(.22, 1, .36, 1)` | появление |
| `ease-in-out` | стоковая | перемещение |

Пружины для `motion` — `shared/motion.ts`:
`spring.default = { type: 'spring', bounce: 0, duration: 0.4 }`,
`spring.sheet = { type: 'spring', bounce: 0.15, duration: 0.35 }`
(только после жеста с импульсом).

Нажатие — `active:scale-[.97]` (встроено в `Button`). Анимируются только
`transform` и `opacity`; `transition-all` запрещён. При
`prefers-reduced-motion: reduce` — только смена прозрачности, без
сдвигов и масштаба (глобальное правило в `globals.css`).

## 8. Компоненты (`components/ui/`)

| Компонент | Спецификация |
|---|---|
| `Button` | Варианты: `default` (`bg-primary text-primary-foreground` — цвет схемы, имя сохранено ради 82 вызовов), `brand` (`bg-brand`, белый текст — главное действие интерфейса), `secondary` (`bg-card border border-border`), `outline`, `ghost`, `destructive`, `link`. Размеры: `sm` (`h-control-sm rounded-tag text-body-sm px-3`), `default` (`h-control rounded-control text-body-sm px-4`), `lg` (`h-control-lg rounded-control-lg text-body px-5`), `xl` (`h-control-xl rounded-control-lg text-body px-6`), `icon-sm`, `icon`, `icon-lg`. Вес 600 (brand — 700). Нажатие `active:scale-[.97]`, `transition-[transform,background-color,color,opacity] duration-fast`. `disabled:opacity-50`. `loading` — спиннер. Размер по умолчанию — `default` (= md). |
| `Input`, `Textarea` | `h-control-lg rounded-control-lg border border-input bg-background px-3.5 text-lead md:text-body` (16px на телефоне — иначе iOS увеличивает страницу при фокусе); placeholder `text-muted-foreground`; фокус — общий. |
| `Segmented` | Контейнер `inline-flex p-0.5 gap-0.5 rounded-control border border-border`, сегмент `h-control-sm px-3 rounded-tag text-label`, выбранный `bg-secondary text-foreground`, остальные `text-muted-foreground`. `role="radiogroup"` / `aria-pressed`. Размер `sm` для инспектора. |
| `Toggle`, `Switch` | один компонент — `Switch` (radix); `Toggle` из конструктора становится обёрткой с подписью. |
| `Field` | подпись `text-label`, подсказка `text-caption text-muted-foreground`, `gap-1.5`. |
| `Badge` (новый) | `inline-flex items-center gap-1 h-5 px-2 rounded-full text-micro`; варианты `accent`, `success`, `warning`, `muted` — фон роли с прозрачностью 14%, текст роли. |
| `Card` | `rounded-card border border-border bg-card`; паддинг по месту (`p-5`/`p-6`). |
| `Dialog`, `AlertDialog` | `rounded-sheet shadow-overlay p-6 gap-5`, подложка `bg-overlay`, заголовок `text-title`. Появление: opacity + scale .96→1, `duration-slow ease-out-soft`. |
| `Sheet` | `rounded-t-sheet` снизу на телефоне, `shadow-overlay`. |
| `Popover`, `DropdownMenu` | `rounded-control-lg shadow-float border`, пункты `h-control-sm rounded-tag text-body-sm`. `transform-origin` от триггера (radix-переменная). |
| `Toast` | `rounded-control-lg shadow-float text-body-sm`. |

**Фокус** у всего интерактивного:
`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
focus-visible:ring-offset-2 focus-visible:ring-offset-background`.

Сырой `<button>` остаётся только там, где это не кнопка по виду: ячейки
холста, ручки перетаскивания, кружки цвета, плитки выбора. Классы и там —
только токены.

`Segmented`, `Toggle`, `Field`, `ViewTiles` переезжают из
`app/wishlist/components/constructor/controls.tsx` в `components/ui/`;
старый файл реэкспортирует их, пока все импорты не переведены, затем
удаляется.

## 9. tailwind-merge

`twMerge` не знает новых ключей: `text-body` он примет за цвет и выкинет
рядом с `text-primary`. Первым делом `lib/utils.ts` переходит на
`extendTailwindMerge` с группами `font-size`, `rounded`, `shadow`, `h`,
`size`, `w`, `duration`, `ease`, перечисляющими новые ключи. Тест
`tests/cn.test.cjs` проверяет: `cn('text-body text-primary')` сохраняет
оба, `cn('text-body text-label')` оставляет последний,
`cn('rounded-control rounded-card')` — последний.

## 10. Порядок перевода

Каждый этап — отдельный коммит (или несколько), сайт рабочий после каждого.

1. **Фундамент.** CSS-переменные (тени, анимации, success/warning/brand/
   overlay) в `globals.css`; смысловые ключи в `tailwind.config.ts`
   (`extend`, рядом со стоковыми); `cn`; `shared/motion.ts`;
   reduced-motion; `docs/design-system.md`. Внешне ничего не меняется.
2. **`components/ui/`** по разделу 8.
3. **Экраны по зонам:** кабинет и создание → конструктор → подарки →
   страница гостя `s/[shortId]` → авторизация, профиль, диалоги, шапка,
   подвал → лендинг, «Как это работает», шаблоны → блог, юридические
   страницы, `[userId]`.
4. **Замок.** В `tailwind.config.ts` `fontSize`, `borderRadius`,
   `boxShadow`, `transitionDuration` переходят из `extend` в `theme` —
   стоковые ключи исчезают. Запрет — без новых зависимостей:
   - тест-сторож `tests/design-tokens.test.cjs` сканирует `app/`,
     `components/`, `shared/` и падает на стоковых и произвольных
     `text-*`, `rounded-*`, `shadow-*`, произвольных отступах,
     `transition-all`, `duration-<число>`, hex/`rgba(` вне файлов-данных;
   - то же правило в ESLint через встроенный `no-restricted-syntax`
     (селекторы `Literal` и `TemplateElement` по регулярному выражению),
     чтобы ошибка была видна прямо в редакторе.
   Произвольные значения раскладки (`w-[…]`, `h-[…]`, `max-w-[…]`,
   `grid-cols-[…]`, `inset-[…]`, `translate-[…]`, `aspect-[…]`,
   `scale-[.97]`) разрешены.

Неиспользуемые файлы `components/ui/` удаляются: 12 эффектов reactbits
(`animated-content`, `blur-text`, `bounce-cards`, `carousel`, `click-spark`,
`fade-content`, `glare-hover`, `particles`, `scroll-reveal`,
`scroll-velocity`, `splash-cursor`, `star-border`), а также `mode-toggle`,
`tooltip`, `select` — ни один нигде не импортируется.

## 11. Проверка

- После каждого этапа: `pnpm exec tsc --noEmit`, `pnpm lint`,
  `node --test tests/*.test.cjs`.
- Визуальная сверка в браузере: кабинет, создание, конструктор, подарки,
  страница гостя (Космос, Пудра, Лён), лендинг, «Как это работает»,
  вход — на 1440 и 390, тёмная и светлая тема. Допустимы сдвиги 1–2 px
  от схлопывания; остальное — ошибка.
- Контраст `--success`, `--warning` и `text-muted-foreground` на `card`
  во всех 9 схемах — AA.
- Итоговые счётчики (тот же grep, что в аудите): произвольных
  `text-[…]`, `rounded-[…]`, `shadow-[…]`, spacing `[…]` — 0; hex в TSX —
  только в файлах-данных.

## Не меняем

Палитры 9 схем и «своей схемы», шрифты заголовков, узоры, раскладку
блоков, тексты, бэкенд.

## Артефакты

- `docs/design-system.md` — документация для разработчиков: таблицы
  токенов, правила (вложенность, близость, фокус, анимации), «так / не
  так».
- `tailwind.config.ts`, `app/globals.css`, `lib/utils.ts`,
  `shared/motion.ts`, `components/ui/*`.
