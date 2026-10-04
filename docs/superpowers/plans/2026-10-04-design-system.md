# Дизайн-система: план работ

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести весь фронт на смысловые токены (типографика, скругления, отступы, высоты, тени, цвета, анимации) и единые компоненты `components/ui/`, затем запретить произвольные значения.

**Architecture:** Токены — ключи `tailwind.config.ts` (`text-body`, `rounded-control`, `shadow-float`, `h-control`, `duration-base`) поверх CSS-переменных `app/globals.css`. Сначала ключи добавляются *рядом* со стоковыми, код переводится по зонам, в конце стоковые ключи удаляются, а тест-сторож и ESLint ловят возврат разнобоя.

**Tech Stack:** Next.js 16, Tailwind 3.4, shadcn (new-york), tailwind-merge 2.6, class-variance-authority, motion 12, node:test.

**Spec:** `docs/superpowers/specs/2026-10-04-design-system-design.md`

## Global Constraints

- Палитры 9 схем и «своей схемы», шрифты заголовков (`look-font-*`), узоры, раскладку блоков, тексты, бэкенд — не менять.
- Сдвиг внешнего вида — не больше 1–2 px от схлопывания значений; всё, что больше, — ошибка.
- Новых npm-зависимостей нет.
- Коммиты — на ветке `redesign`, от имени пользователя, без трейлера `Co-Authored-By` (правило `CLAUDE.md`).
- Комментарии в коде — по-русски, как в проекте.
- После каждой задачи: `pnpm exec tsc --noEmit`, `pnpm lint`, `node --test tests/*.test.cjs` — зелёные.

### Таблица перевода (общая для задач 3–9)

Выбор — по **роли элемента**, таблица задаёт значение по умолчанию.

**Кегль** (трекинг/интерлиньяж рядом с новым токеном убрать, кроме `leading-none` у однострочных цифр и иконок; вес оставить, как был):

| Было | Стало |
|---|---|
| `text-[8px]`…`text-[11px]` | `text-micro`; капс с разрядкой → `text-eyebrow` (убрать `uppercase tracking-*`) |
| `text-xs`, `text-[12px]`, `text-[0.8rem]` | `text-caption` |
| `text-[13px]` | `text-label` |
| `text-sm`, `text-[14px]` | `text-body-sm` |
| `text-[15px]` | `text-body` |
| `text-base`, `text-[16px]` | `text-lead` (в абзацах и подзаголовках), `text-body` (в кнопках/пунктах) |
| `text-lg`, `text-[17px]`…`text-[19px]` | заголовок → `text-title-xs`; абзац → `text-lead` |
| `text-xl`, `text-[20px]` | `text-title-sm` |
| `text-2xl`, `text-[22px]`…`text-[26px]` | `text-title` |
| `text-3xl`, `text-4xl`, `text-[28px]`…`text-[36px]`, старый `text-display-sm` | `text-title-lg` |
| `text-5xl`, `text-[40px]`…`text-[48px]`, старый `text-display` | `text-display-sm` |
| `text-6xl`, `text-7xl`, `text-[52px]`…`text-[84px]`, `text-[5rem]`, старый `text-display-lg` | `text-display` |
| `text-8xl`, старый `text-display-xl` | `text-display-xl` |

**Скругление** (в этом проекте `rounded-lg` = `var(--radius)` = 14px в интерфейсе, `md` = 12, `sm` = 10; на странице гостя они меняются по схеме):

| Было | Интерфейс | Страница гостя и блоки (`app/s/**`, `constructor/blocks/**`) |
|---|---|---|
| `rounded`, `rounded-sm` (стоковый смысл ≤4), `rounded-[2–4px]` | `rounded-xs` | `rounded-xs` |
| `rounded-[6–9px]`, элементы ≤30px | `rounded-tag` | `rounded-block-sm` |
| `rounded-sm`, `rounded-[10–11px]`, элементы 32–40px | `rounded-control` | `rounded-block-sm` |
| `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-[12–15px]` | `rounded-control-lg` (элемент 44–56px) или `rounded-control` (32–40px) | `rounded-block` |
| `rounded-2xl`, `rounded-[16–20px]` | `rounded-card` | `rounded-block` |
| `rounded-3xl`, `rounded-[22–40px]` | `rounded-sheet` | `rounded-block` |
| `rounded-full`, `rounded-none` | без изменений | без изменений |

Направленные (`rounded-t-2xl`, `rounded-br-[4px]`) — по той же таблице с префиксом стороны.

**Тень:** `shadow`, `shadow-sm` у кнопок/полей/карточек → удалить; `shadow-md`, `shadow-lg`, `shadow-xl` у меню/поповеров/тостов/перетаскиваемого → `shadow-float`; `shadow-2xl`, `shadow-[0_30–40px_…]` → `shadow-overlay`; `shadow-[inset_0_0_0_1px_…]` → `ring-1 ring-inset ring-primary/40`; `shadow-[inset_0_2px_0_…primary]` → `shadow-ring`-подобная отметка: `border-t-2 border-primary`; `shadow-[0_-4px_12px_…border]` → удалить, оставить `border-t`.

**Отступы:** `p-[3px]` → `p-0.5`; `p-[18px]`, `py-[18px]`, `gap-[18px]` → `4`/`5` по соседям; `p-[22px]`, `px-[22px]`, `p-[26px]` → `5`/`6`; `mb-[13px]` → `mb-3`; `gap-[72px]` → `gap-18`. Шаги `11 13 15 17 19 22` → ближайший разрешённый.

**Высоты элементов управления** (только кнопки, поля, сегменты — не иконки и не картинки): `h-8` → `h-control-sm`; `h-9`, `h-10` → `h-control`; `h-11`, `h-12` → `h-control-lg`; `h-14` → `h-control-xl`. Квадратные кнопки-иконки: `h-9 w-9`/`size-9` → `size-control` и т.п.

**Цвета:** `text-white` на кнопке → `text-primary-foreground` или `variant`; `bg-black/80`, `bg-black/40` у подложек → `bg-overlay`; `text-blue-600` → `text-primary`; `text-amber-500` → `text-warning`; `bg-green-500`/`border-green-500` → `bg-success`/`border-success`; `text-red-*`/`ring-red-400` → `text-destructive`/`ring-destructive`. Текст поверх фото (`text-white` + `from-black/75`) — оставить с комментарием `/* текст поверх фото */`. Hex и `rgba()` в TSX → классы ролей или CSS-переменные; мокапы — классы схем (`.midnight`, `.linen`, …).

**Анимации:** `duration-150` → `duration-fast`; `duration-200` → `duration-base`; `duration-300`, `duration-500` → `duration-slow`; `ease-out` у появления → `ease-out-soft`; `transition-all` → `transition-[transform,opacity]` или `transition-colors` по факту.

**Кнопки:** самодельный `<button className="…">`, который выглядит как кнопка (фон/рамка + текст), → `<Button variant size>`. `.btn-gradient` → `variant="brand"`. Сырой `<button>` остаётся у ячеек холста, ручек, кружков цвета, плиток — с токенами в классах.

## Review Focus

- `cn()` поверх новых ключей: `cn('text-body', 'text-primary')` обязан сохранить оба класса — иначе текст молча теряет кегль или цвет (тест в задаче 1).
- Поля ввода на iPhone: кегль < 16px при фокусе увеличивает страницу — `Input`/`Textarea` обязаны давать 16px до `md` (проверка в задаче 2).
- Страница гостя в каждой схеме: `rounded-block` должен следовать `--radius` схемы (Графит 0.625rem, Лаванда 1.25rem) — визуальная проверка в задаче 6 на трёх схемах.
- Светлая тема: `--warning`/`--success` и тени должны читаться на белом — контраст AA (задача 1, проверка значений).
- `prefers-reduced-motion`: модалки и шторки без сдвига и масштаба (задача 1 — глобальное правило, задача 2 — компоненты на токенах).

---

### Task 1: Фундамент — токены, `cn`, движение, сторож, документация

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`
- Modify: `lib/utils.ts`
- Create: `shared/motion.ts`
- Create: `tests/token-audit.cjs`, `tests/design-tokens.test.cjs`, `tests/cn.test.cjs`
- Create: `docs/design-system.md`

**Interfaces:**
- Produces: классы `text-micro|eyebrow|caption|label|body-sm|body|lead|title-xs|title-sm|title|title-lg|display-sm|display|display-xl`; `rounded-xs|tag|control|control-lg|card|sheet|block|block-sm`; `h-/w-/size-control-sm|control|control-lg|control-xl`; `shadow-float|overlay|ring`; `duration-fast|base|slow`; `ease-out-soft`; цвета `success`, `warning`, `overlay`; фон `bg-brand`. `cn()` знает их. `spring.default`, `spring.sheet` из `@/shared/motion`. `audit(dirs)` из `tests/token-audit.cjs` → `{ rule, file, line, match }[]`.

- [ ] **Step 1: тест `cn`** — `tests/cn.test.cjs`:

```js
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load.cjs')
const { cn } = load('lib/utils.ts')

test('кегль-токен и цвет текста не вытесняют друг друга', () => {
  assert.equal(cn('text-body', 'text-primary'), 'text-body text-primary')
  assert.equal(cn('text-label text-muted-foreground'), 'text-label text-muted-foreground')
})

test('два кегля — побеждает последний', () => {
  assert.equal(cn('text-body', 'text-label'), 'text-label')
  assert.equal(cn('text-sm', 'text-title'), 'text-title')
})

test('скругления, тени, высоты, длительности сливаются по группам', () => {
  assert.equal(cn('rounded-control', 'rounded-card'), 'rounded-card')
  assert.equal(cn('shadow-float', 'shadow-overlay'), 'shadow-overlay')
  assert.equal(cn('h-control', 'h-control-lg'), 'h-control-lg')
  assert.equal(cn('size-control', 'size-control-sm'), 'size-control-sm')
  assert.equal(cn('duration-fast', 'duration-slow'), 'duration-slow')
  assert.equal(cn('ease-out-soft', 'ease-in-out'), 'ease-in-out')
})

test('цвета success/warning/overlay — это цвета, а не размеры', () => {
  assert.equal(cn('text-body', 'text-success'), 'text-body text-success')
  assert.equal(cn('bg-overlay', 'bg-card'), 'bg-card')
})
```

- [ ] **Step 2:** `node --test tests/cn.test.cjs` — FAIL (`text-body` вытесняется `text-primary`).

- [ ] **Step 3: `lib/utils.ts`** — заменить `twMerge` на сконфигурированный:

```ts
import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Смысловые токены дизайн-системы (docs/design-system.md). Без этой
// настройки twMerge примет `text-body` за цвет и выкинет его рядом с
// `text-primary`.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['micro', 'eyebrow', 'caption', 'label', 'body-sm', 'body', 'lead', 'title-xs', 'title-sm', 'title', 'title-lg', 'display-sm', 'display', 'display-xl'] }],
      rounded: [{ rounded: ['xs', 'tag', 'control', 'control-lg', 'card', 'sheet', 'block', 'block-sm'] }],
      shadow: [{ shadow: ['float', 'overlay', 'ring'] }],
      h: [{ h: ['control-sm', 'control', 'control-lg', 'control-xl'] }],
      w: [{ w: ['control-sm', 'control', 'control-lg', 'control-xl'] }],
      size: [{ size: ['control-sm', 'control', 'control-lg', 'control-xl'] }],
      duration: [{ duration: ['fast', 'base', 'slow'] }],
      ease: [{ ease: ['out-soft'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Направленные скругления (`rounded-t-sheet`) — добавить те же значения в группы `rounded-t`, `rounded-b`, `rounded-l`, `rounded-r`, `rounded-tl`, `rounded-tr`, `rounded-bl`, `rounded-br` (тот же массив).

- [ ] **Step 4:** `node --test tests/cn.test.cjs` — PASS.

- [ ] **Step 5: `tailwind.config.ts`** — в `extend` (стоковые ключи пока остаются):

```ts
      fontSize: {
        // Шкала дизайн-системы (docs/design-system.md). Трекинг и
        // интерлиньяж зашиты в токен; вес задают только заголовки.
        'micro':      [ '0.6875rem', { lineHeight: '1.3' } ],
        'eyebrow':    [ '0.6875rem', { lineHeight: '1.3', letterSpacing: '0.08em', fontWeight: '700' } ],
        'caption':    [ '0.75rem',   { lineHeight: '1.4' } ],
        'label':      [ '0.8125rem', { lineHeight: '1.4' } ],
        'body-sm':    [ '0.875rem',  { lineHeight: '1.5' } ],
        'body':       [ '0.9375rem', { lineHeight: '1.5' } ],
        'lead':       [ '1rem',      { lineHeight: '1.5' } ],
        'title-xs':   [ '1.0625rem', { lineHeight: '1.3',  letterSpacing: '-0.01em',  fontWeight: '700' } ],
        'title-sm':   [ '1.25rem',   { lineHeight: '1.25', letterSpacing: '-0.02em',  fontWeight: '800' } ],
        'title':      [ '1.5rem',    { lineHeight: '1.2',  letterSpacing: '-0.02em',  fontWeight: '800' } ],
        'title-lg':   [ '2rem',      { lineHeight: '1.1',  letterSpacing: '-0.03em',  fontWeight: '800' } ],
        'display-sm': [ '2.75rem',   { lineHeight: '1.03', letterSpacing: '-0.033em', fontWeight: '800' } ],
        'display':    [ '4rem',      { lineHeight: '1',    letterSpacing: '-0.04em',  fontWeight: '800' } ],
        'display-xl': [ '7rem',      { lineHeight: '1',    letterSpacing: '-0.045em', fontWeight: '800' } ],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'xs': '4px',
        'tag': '8px',
        'control': '10px',
        'control-lg': '14px',
        'card': '18px',
        'sheet': '24px',
        'block': 'var(--radius)',
        'block-sm': 'calc(var(--radius) - 4px)',
      },
      spacing: {
        'control-sm': '2rem',
        'control': '2.5rem',
        'control-lg': '3rem',
        'control-xl': '3.5rem',
      },
      boxShadow: {
        float: '0 16px 40px rgb(0 0 0 / var(--shadow-alpha))',
        overlay: '0 32px 96px rgb(0 0 0 / var(--shadow-alpha-strong))',
        ring: '0 0 0 2px hsl(var(--ring))',
      },
      transitionDuration: { fast: '120ms', base: '200ms', slow: '320ms' },
      transitionTimingFunction: { 'out-soft': 'cubic-bezier(.22, 1, .36, 1)' },
      backgroundImage: { brand: 'var(--brand-gradient)', /* + существующие heart, star… */ },
```

Цвета в `colors`: `success: { DEFAULT: 'hsl(var(--success))', foreground: 'hsl(var(--success-foreground))' }`, то же для `warning`; `overlay: 'rgb(var(--overlay) / 0.72)'`. Старые `display-sm/display/display-lg/display-xl` удаляются, их употребления переименовываются по таблице (grep `text-display`). Spacing-ключи `control*` дают `h-control`, `w-control`, `size-control` — но и `p-control`; это допустимо, в коде не используется.

- [ ] **Step 6: `app/globals.css`** — в `:root` (светлая) и `.dark`:

```css
    /* Дизайн-система: роли сверх схемы (docs/design-system.md) */
    --success: 160 81% 30%;
    --success-foreground: 0 0% 100%;
    --warning: 36 90% 38%;          /* на светлом — затемнён до AA */
    --warning-foreground: 0 0% 100%;
    --overlay: 3 5 12;
    --brand-gradient: linear-gradient(90deg, #17B6D6, #7B5CF0);
    --shadow-alpha: 0.12;
    --shadow-alpha-strong: 0.18;
```

в `.dark`: `--success: 160 70% 45%; --warning: 43 100% 70%; --warning-foreground: 45 100% 9%; --shadow-alpha: 0.45; --shadow-alpha-strong: 0.5;`. Тёмные схемы (`.space`, `.midnight`, `.graphite`, `.lavender`, `.malachite`, `.lagoon`) наследуют `.dark`-значения через блок `:is(.space, .midnight, .graphite, .lavender, .malachite, .lagoon) { --success…; --warning…; --shadow-alpha…; }`, светлые (`.powder`, `.linen`, `.pastel`) — светлые значения. Имена классов схем сверить с `shared/constants.ts`.

`.btn-gradient` переписать на `background-image: var(--brand-gradient)`.

В конец — правило:

```css
/* Уменьшенное движение: без сдвигов и масштаба, только прозрачность. */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-property: opacity, color, background-color, border-color !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 7: `shared/motion.ts`**

```ts
// Пружины дизайн-системы для motion. По умолчанию — без отскока; отскок
// только там, где ему предшествовал жест с импульсом (шторка, бросок).
export const spring = {
  default: { type: 'spring', bounce: 0, duration: 0.4 },
  sheet: { type: 'spring', bounce: 0.15, duration: 0.35 },
} as const
```

- [ ] **Step 8: сторож** — `tests/token-audit.cjs`:

```js
const fs = require('node:fs')
const path = require('node:path')

// Правила дизайн-системы (docs/design-system.md). Каждое — регулярка по
// тексту файла. Файлы-данные с палитрами исключены из правила цвета.
const RULES = {
  'стоковый кегль': /(?<![\w-])text-(xs|sm|base|lg|[2-9]?xl)(?![\w-])/g,
  'произвольный кегль': /(?<![\w-])text-\[\d[^\]]*\]/g,
  'стоковое скругление': /(?<![\w-])rounded(?:-(?:t|r|b|l|s|e|tl|tr|br|bl|ss|se|es|ee))?(?:-(?:sm|md|lg|xl|2xl|3xl))?(?![\w[-])/g,
  'произвольное скругление': /(?<![\w-])rounded(?:-[a-z]{1,2})?-\[/g,
  'стоковая тень': /(?<![\w-])shadow(?:-(?:sm|md|lg|xl|2xl|inner))?(?![\w[-])/g,
  'произвольная тень': /(?<![\w-])shadow-\[/g,
  'произвольный отступ': /(?<![\w-])-?(?:p[xytblrse]?|m[xytblrse]?|gap(?:-[xy])?|space-[xy])-\[/g,
  'шаг отступа вне шкалы': /(?<![\w-])-?(?:p[xytblrse]?|m[xytblrse]?|gap(?:-[xy])?|space-[xy])-(?:11|13|15|17|19|22|36|40|44|48|52|56|60|64|72|80|96)(?![\w.-])/g,
  'произвольный трекинг/интерлиньяж': /(?<![\w-])(?:tracking|leading)-\[/g,
  'transition-all': /(?<![\w-])transition-all(?![\w-])/g,
  'длительность числом': /(?<![\w-])duration-\d+(?![\w-])/g,
  'цвет в коде': /(?<![&\w])#[0-9a-fA-F]{3,8}\b|rgba?\(/g,
}

const DATA_FILES = new Set([
  'shared/constants.ts', 'shared/derive-scheme.ts', 'shared/look.ts',
  'app/wishlist/components/colors-select.tsx', 'app/layout.tsx', 'app/manifest.ts',
])

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.(tsx?|mdx)$/.test(e.name)) out.push(p.split(path.sep).join('/'))
  }
  return out
}

function audit(dirs = ['app', 'components', 'shared']) {
  const found = []
  for (const file of dirs.flatMap(d => walk(d))) {
    const lines = fs.readFileSync(file, 'utf8').split('\n')
    lines.forEach((text, i) => {
      for (const [rule, re] of Object.entries(RULES)) {
        if (rule === 'цвет в коде' && DATA_FILES.has(file)) continue
        for (const m of text.matchAll(re)) found.push({ rule, file, line: i + 1, match: m[0] })
      }
    })
  }
  return found
}

module.exports = { audit, RULES }

// node tests/token-audit.cjs app/wishlist — нарушения по зоне
if (require.main === module) {
  const found = audit(process.argv.slice(2).length ? process.argv.slice(2) : undefined)
  for (const f of found) console.log(`${f.file}:${f.line}  ${f.rule}  ${f.match}`)
  const byRule = {}
  for (const f of found) byRule[f.rule] = (byRule[f.rule] || 0) + 1
  console.log(byRule, 'всего', found.length)
}
```

`tests/design-tokens.test.cjs`:

```js
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { audit, RULES } = require('./token-audit.cjs')

// Пока код переводится, правило помечено todo: отчёт виден, прогон не
// падает. Задача 10 плана снимает todo.
const TODO = true

for (const rule of Object.keys(RULES)) {
  test(`дизайн-система: ${rule}`, { todo: TODO }, () => {
    const found = audit().filter(f => f.rule === rule)
    assert.deepEqual(found.map(f => `${f.file}:${f.line} ${f.match}`), [])
  })
}

test('сторож ловит нарушения', () => {
  const sample = 'text-[13px] rounded-lg shadow-md p-[3px] transition-all duration-200 #fff'
  for (const re of Object.values(RULES)) re.lastIndex = 0
  const hits = Object.entries(RULES).filter(([, re]) => sample.match(re)).map(([r]) => r)
  assert.ok(hits.includes('произвольный кегль'))
  assert.ok(hits.includes('стоковое скругление'))
  assert.ok(hits.includes('стоковая тень'))
  assert.ok(hits.includes('произвольный отступ'))
  assert.ok(hits.includes('transition-all'))
  assert.ok(hits.includes('длительность числом'))
  assert.ok(hits.includes('цвет в коде'))
})

test('сторож не трогает токены', () => {
  const sample = 'text-body text-primary rounded-control rounded-t-sheet rounded-full rounded-block shadow-float shadow-none p-0.5 gap-18 duration-base'
  const hits = Object.entries(RULES).filter(([, re]) => sample.match(re)).map(([r]) => r)
  assert.deepEqual(hits, [])
})
```

- [ ] **Step 9:** `node --test tests/*.test.cjs` — всё PASS (правила сторожа — todo). `node tests/token-audit.cjs` — записать исходные счётчики в отчёт задачи.

- [ ] **Step 10: `docs/design-system.md`** — документация для разработчиков: таблицы токенов из спеки (разделы 1–7), правила (вложенность, близость, фокус, анимации, сырой `<button>`), таблица «так / не так» (произвольный кегль, `transition-all`, `shadow` у кнопки, `scale(0)` при появлении, hex в TSX), как проверить (`node tests/token-audit.cjs <папка>`). Ссылка на неё — в `CLAUDE.md`, раздел Architecture → Theming.

- [ ] **Step 11:** `pnpm exec tsc --noEmit && pnpm lint && node --test tests/*.test.cjs`; коммит `feat(front): токены дизайн-системы, cn и сторож`.

### Task 2: Компоненты `components/ui/`

**Files:**
- Modify: `components/ui/button.tsx`, `input.tsx`, `textarea.tsx`, `card.tsx`, `switch.tsx`, `dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`, `popover.tsx`, `dropdown-menu.tsx`, `toast.tsx`, `label.tsx`, `form.tsx`, `calendar.tsx`, `breadcrumb.tsx`, `avatar.tsx`
- Create: `components/ui/badge.tsx`, `components/ui/segmented.tsx`, `components/ui/field.tsx`, `components/ui/view-tiles.tsx`
- Modify: `app/wishlist/components/constructor/controls.tsx` (реэкспорт)
- Delete: `components/ui/{animated-content,blur-text,bounce-cards,carousel,click-spark,fade-content,glare-hover,particles,scroll-reveal,scroll-velocity,splash-cursor,star-border,mode-toggle,tooltip,select}.tsx`; правило про `splash-cursor`/`star-border` в `eslint.config.mjs`

**Interfaces:**
- Consumes: токены задачи 1.
- Produces: `Button` с `variant: default|brand|secondary|outline|ghost|destructive|link`, `size: sm|default|lg|xl|icon-sm|icon|icon-lg`; `Badge` с `variant: accent|success|warning|muted`; `Segmented<T>({ value, options: {value: T, label: ReactNode}[], onChange, label?, size?: 'sm'|'md' })`; `Toggle`, `Field`, `ViewTiles` — прежние сигнатуры из `controls.tsx`.

- [ ] **Step 1: `button.tsx`** — варианты (имена `default`/`default` сохраняются, чтобы 82 вызова не менялись):

```ts
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[transform,background-color,color,opacity] duration-fast active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Цвет схемы — роль «Кнопка». Работает и в интерфейсе, и у гостя.
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        // Главное действие интерфейса — градиент бренда.
        brand: "bg-brand text-white font-bold hover:opacity-90",
        secondary: "bg-card text-foreground border border-border hover:bg-secondary",
        outline: "border border-input bg-transparent hover:bg-secondary",
        ghost: "hover:bg-secondary hover:text-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        sm: "h-control-sm rounded-tag px-3 text-body-sm",
        default: "h-control rounded-control px-4 text-body-sm",
        lg: "h-control-lg rounded-control-lg px-5 text-body",
        xl: "h-control-xl rounded-control-lg px-6 text-body",
        "icon-sm": "size-control-sm rounded-tag",
        icon: "size-control rounded-control",
        "icon-lg": "size-control-lg rounded-control-lg",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)
```

`text-white` у `brand` — исключение: градиент один на обе темы. Комментарии «Импортируем иконку…» оставить.

- [ ] **Step 2: `input.tsx` / `textarea.tsx`**

```ts
"flex h-control-lg w-full rounded-control-lg border border-input bg-background px-3.5 text-lead text-foreground transition-colors duration-fast file:border-0 file:bg-transparent file:text-body-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 md:text-body"
```

Textarea: то же без `h-control-lg`, с `min-h-24 py-3`. Комментарий над классом: «16px до md — иначе iOS увеличивает страницу при фокусе».

- [ ] **Step 3: `badge.tsx`**

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Метка-таблетка: «главная мечта», «новый», статусы подарков.
const badgeVariants = cva(
  "inline-flex items-center gap-1 h-5 px-2 rounded-full text-micro font-bold whitespace-nowrap",
  {
    variants: {
      variant: {
        accent: "bg-primary/15 text-primary",
        success: "bg-success/15 text-success",
        warning: "bg-warning/15 text-warning",
        muted: "bg-secondary text-muted-foreground",
      },
    },
    defaultVariants: { variant: "muted" },
  }
)

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
```

- [ ] **Step 4: перенос `Segmented`, `Toggle`, `Field`, `ViewTiles`** из `constructor/controls.tsx` в `components/ui/segmented.tsx`, `switch.tsx` (как `Toggle` рядом со `Switch`), `field.tsx`, `view-tiles.tsx`; классы — по таблице (контейнер сегментов `inline-flex p-0.5 gap-0.5 rounded-control border border-border`, сегмент `h-control-sm px-3 rounded-tag text-label font-semibold`, выбранный `bg-secondary text-foreground`). `controls.tsx` становится:

```ts
// Перенесены в components/ui — оставлено для старых импортов.
export { Segmented } from '@/components/ui/segmented'
export { Toggle } from '@/components/ui/switch'
export { Field } from '@/components/ui/field'
export { ViewTiles } from '@/components/ui/view-tiles'
```

- [ ] **Step 5: остальные** — по таблице перевода:
  - `card.tsx`: `rounded-card border border-border bg-card text-card-foreground` (без `shadow`); `CardTitle` → `text-title-sm`; `CardDescription` → `text-body-sm text-muted-foreground`.
  - `dialog.tsx`/`alert-dialog.tsx`: оверлей `bg-overlay`; контент `rounded-sheet shadow-overlay p-6 gap-5 border border-border bg-card`, анимации `duration-slow ease-out-soft` + `data-[state=open]:zoom-in-[.96]`; крестик — `Button variant="ghost" size="icon-sm"`-классы; `DialogTitle` → `text-title`; описание → `text-body-sm text-muted-foreground`.
  - `sheet.tsx`: `bottom` → `rounded-t-sheet`, `shadow-overlay`, `duration-slow ease-out-soft`; заголовок `text-title`.
  - `popover.tsx`, `dropdown-menu.tsx`: контент `rounded-control-lg shadow-float border p-1`, пункты `h-control-sm rounded-tag px-2.5 text-body-sm`, ярлык `text-caption`.
  - `toast.tsx`: `rounded-control-lg shadow-float`, заголовок `text-body-sm font-semibold`, описание `text-body-sm`.
  - `label.tsx`: `text-label font-semibold`. `form.tsx`: `text-[0.8rem]` → `text-caption`.
  - `switch.tsx`: убрать `shadow-sm`/`shadow-lg`, `transition-colors duration-fast`.
  - `calendar.tsx`, `breadcrumb.tsx`, `avatar.tsx`: по таблице.

- [ ] **Step 6:** удалить неиспользуемые файлы (список в Files), убрать из `eslint.config.mjs` блок `splash-cursor`/`star-border`; `grep -rn "ui/(animated-content|…)" app components` пусто.

- [ ] **Step 7:** `node tests/token-audit.cjs components/ui` — 0 нарушений. `pnpm exec tsc --noEmit && pnpm lint && node --test tests/*.test.cjs`.

- [ ] **Step 8:** визуально (см. «Как смотреть в браузере» ниже): кабинет, форма подарка, диалог — 1440 и 390; на 390 у поля ввода computed `font-size` = 16px.

- [ ] **Step 9:** коммит `feat(front): компоненты ui на токенах дизайн-системы`.

### Как смотреть в браузере (для задач 2–10)

`node_modules` в OneDrive частично «только в облаке», Turbopack на них падает. Рабочая копия — вне OneDrive, по короткому пути: `robocopy` дерева (без `node_modules`, `.next`, `.worktrees`) в `%TEMP%\w\web`, там `pnpm install --prefer-offline`, `pnpm dev`. Скриншоты — Playwright из `tests/editor.browser.cjs` (тот же запуск браузера), 1440×900 и 390×844, тёмная и светлая тема. Перед первой зоной снять «до» тех же экранов с текущего HEAD.

### Задачи 3–9: перевод зон

Одинаковый порядок для каждой зоны:

- [ ] **Step 1:** `node tests/token-audit.cjs <папки зоны>` — список нарушений.
- [ ] **Step 2:** каждое нарушение — по таблице перевода; самодельные кнопки → `Button`, сегменты → `Segmented`, бейджи → `Badge`, карточки → `rounded-card border border-border bg-card`; высоты элементов управления → `h-control*`.
- [ ] **Step 3:** `node tests/token-audit.cjs <папки зоны>` — 0.
- [ ] **Step 4:** `pnpm exec tsc --noEmit && pnpm lint && node --test tests/*.test.cjs` (для конструктора ещё `node tests/editor.browser.cjs`).
- [ ] **Step 5:** скриншоты «после» тех же экранов, сравнить с «до»; расхождения больше 1–2 px — исправить.
- [ ] **Step 6:** коммит `refactor(front): <зона> на токенах дизайн-системы`.

| Task | Зона | Папки | Экраны для сверки |
|---|---|---|---|
| 3 | Кабинет и создание | `app/wishlist/page.tsx`, `app/wishlist/components/*.tsx` (без `constructor/`), `app/wishlist/create`, `app/wishlist/settings`, `app/wishlist/edit` | `/wishlist`, `/wishlist/create` (шаги опросника), 1440/390 |
| 4 | Конструктор | `app/wishlist/components/constructor/**`, `app/wishlist/[id]` | редактор: шапка, рельс, инспекторы «Блок/Ряд/Оформление/Доступ», меню вставки, мобильный режим |
| 5 | Подарки | `app/wishlist/[id]/present/**`, `presents-manager.tsx` (если не в задаче 3) | экран «Подарки», форма подарка, шторка на 390 |
| 6 | Страница гостя | `app/s/**`, `app/[userId]/**` | `/s/<id>` в схемах Космос, Графит, Лаванда, Пудра, Лён; бронь, подарки |
| 7 | Оболочка | `components/*.tsx` (без `ui/`), `components/Auth/**`, `app/login`, `app/registration`, `app/oauth` | шапка, подвал, вход, регистрация, баннер cookies |
| 8 | Публичные страницы | `app/(landing)/**`, `app/how-it-works/**`, `app/templates/**`, `app/wishlist-for/**`, `app/page.tsx` | главная, «Как это работает», шаблоны, `/wishlist-for/<повод>`; мокапы — на классах схем вместо hex |
| 9 | Тексты | `app/blog/**`, `app/privacy-policy`, `app/terms-of-service`, `mdx-components.tsx`, `content/**` (если есть классы) | блог, статья, политика |

### Task 10: Замок

**Files:**
- Modify: `tailwind.config.ts`, `eslint.config.mjs`, `tests/design-tokens.test.cjs`, `docs/design-system.md`

- [ ] **Step 1:** `node tests/token-audit.cjs` — 0 по всем правилам (доделать остатки).
- [ ] **Step 2:** `tests/design-tokens.test.cjs`: `const TODO = false`. `node --test tests/design-tokens.test.cjs` — PASS.
- [ ] **Step 3:** `tailwind.config.ts`: `fontSize`, `borderRadius` (без `lg/md/sm`), `boxShadow` (плюс `none: 'none'`), `transitionDuration` (плюс `0: '0ms'`) — из `extend` в `theme`; `borderRadius` дополнить `none: '0'`, `full: '9999px'`.
- [ ] **Step 4: ESLint** — в `eslint.config.mjs` блок для `app/**`, `components/**`, `shared/**` (`.ts`, `.tsx`):

```js
  // Дизайн-система: только токены (docs/design-system.md). То же правило
  // проверяет tests/design-tokens.test.cjs.
  {
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'shared/**/*.{ts,tsx}'],
    ignores: ['shared/constants.ts', 'shared/derive-scheme.ts', 'shared/look.ts', 'app/wishlist/components/colors-select.tsx', 'app/layout.tsx'],
    rules: {
      'no-restricted-syntax': ['error', ...[
        String.raw`(?<![\w-])text-\[\d`,
        String.raw`(?<![\w-])(rounded(-[a-z]{1,2})?|shadow|tracking|leading)-\[`,
        String.raw`(?<![\w-])-?(p[xytblrse]?|m[xytblrse]?|gap(-[xy])?|space-[xy])-\[`,
        String.raw`(?<![\w-])text-(xs|sm|base|lg|[2-9]?xl)(?![\w-])`,
        String.raw`(?<![\w-])transition-all(?![\w-])`,
        String.raw`(?<![\w-])duration-\d`,
      ].flatMap(re => [
        { selector: `Literal[value=/${re}/]`, message: 'Только токены дизайн-системы — docs/design-system.md' },
        { selector: `TemplateElement[value.raw=/${re}/]`, message: 'Только токены дизайн-системы — docs/design-system.md' },
      ])],
    },
  },
```

Скругления и тени без скобок ловит сторож, а не ESLint: после шага 3 стоковые ключи всё равно не генерируют CSS.

- [ ] **Step 5:** проверить, что правило работает: временно вписать `className="text-[13px]"` в любой файл → `pnpm lint` даёт ошибку → убрать.
- [ ] **Step 6:** `pnpm exec tsc --noEmit && pnpm lint && node --test tests/*.test.cjs`; полный проход скриншотов (все экраны задач 3–9).
- [ ] **Step 7:** `docs/design-system.md` — раздел «Как это охраняется»; итоговые счётчики «было/стало» — в `docs/superpowers/plans/2026-10-04-design-system-progress.md`.
- [ ] **Step 8:** коммит `feat(front): замок дизайн-системы — только токены`.
