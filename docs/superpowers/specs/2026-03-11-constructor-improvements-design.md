# Конструктор вишлиста — улучшения и новые блоки

**Дата:** 2026-03-11
**Ветка:** feature/constructor-wishlist

---

## Цель

Сделать конструктор вишлиста визуально богатым и функциональным:
- починить проблемы UX в существующих блоках
- добавить 7 новых типов блоков
- улучшить боковую панель (palette) с живыми превью

---

## 1. Улучшения существующих блоков

### 1.1 Image block — превью в canvas

**Проблема:** `getPreview()` для image возвращает строку «Картинка загружена», визуально непонятно.

**Решение:** Изменить тип возврата `getPreview()` в `block-item.tsx` с `string` на `React.ReactNode`. Для блока `image` возвращать `<img>` тумбнейл если `data.url` присутствует. Обновить рендер в `block-item.tsx` — убрать обёртку `<p>`, рендерить `ReactNode` напрямую.

### 1.2 Timing block — обратный отсчёт

**Данные (без изменений):** `{ start: string; end?: string }` — datetime-local строка.

**Изменение в `TimingBlockView`:** Добавить `'use client'` директиву (нужен `useEffect + setInterval`).

- Показывать дату события (отформатированную)
- Живой countdown через `useEffect + setInterval(1000)` считающий до `start`
- Отображение: `XX дней XX часов XX минут XX секунд`
- Если `start` уже прошёл, а `end` ещё нет → «Уже идёт!»
- Если и `end` прошёл → «Уже прошло»
- Если `end` не задан и `start` прошёл → «Уже наступило»

### 1.3 Color scheme block → Dress code / Palette

**Тип в BlockType:** остаётся `'color_scheme'` (обратная совместимость).

**`BLOCK_LABELS`** в `block-item.tsx` и `block-editor-modal.tsx`: обновить с «Цветовая схема» на «Дресс-код / Цвета».

**Данные (ломающее изменение):** `{ colors: string[]; label?: string }`. Обратная совместимость: если приходит `{ scheme: string }` (старый формат) — показывать пустое состояние в редакторе.

**Редактор:** список color input-ов (нативный `<input type="color">`), кнопка «Добавить цвет», кнопка удаления каждого цвета, опциональная подпись.

**`ColorSchemeBlockView`:** убрать `document.body.classList` полностью. Показывать цветные кружки (`border-radius: 50%`) с подписью.

### 1.4 Text block — Rich text editor

**Данные:** `{ html: string }` (было: `{ content: string }`).

**Обратная совместимость:** `TextBlockView` и `TextBlockEditor` читают `data.html ?? data.content` — если `html` отсутствует, используют `content` как plaintext fallback.

**Редактор:** Tiptap с расширениями Bold, Italic, Underline, Heading (H2/H3 вместо font-size — семантически чище и не требует проблемного `extension-font-size`). Toolbar с кнопками B / I / U / H2 / H3.

**Санитизация (XSS-защита):** Перед записью в `data.html` в `TextBlockEditor` — пропускать через `DOMPurify.sanitize()` с конфигом `{ ALLOWED_TAGS: ['b','strong','i','em','u','h2','h3','p','br'], ALLOWED_ATTR: [] }`. Использовать `isomorphic-dompurify` (работает в SSR).

**Вид:** `dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.html) }}` с классом `prose prose-sm` из `@tailwindcss/typography`. Двойная защита — sanitize и при сохранении, и при рендере.

### 1.5 Block palette — живые превью

Обновить `PALETTE_ITEMS` в `block-palette.tsx` — улучшить preview для всех старых блоков, добавить записи для 7 новых типов.

---

## 2. Новые типы блоков

### 2.1 `agenda` — Программа вечера

**Данные:** `{ items: { time: string; text: string }[] }`

**Редактор:** Список строк (input времени + input текста), кнопки «Добавить пункт» и «Удалить».

**Вид:** Вертикальный таймлайн — точка + линия слева, время жирно, текст рядом.

### 2.2 `gallery` — Галерея фото

**Данные:** `{ images: string[] }` (array of URLs/blob URLs)

**Редактор:** Рендерить несколько `ImageUpload` (по одному на каждое фото) + кнопка «Добавить фото». Каждый `ImageUpload` независим, при изменении обновляет соответствующий индекс в массиве. Кнопка удаления рядом с каждым.

**Вид:** CSS grid — первое фото занимает 2 колонки, остальные по 1. Адаптивно (1 колонка на мобиле).

### 2.3 `quote` — Цитата

**Данные:** `{ text: string; author?: string }`

**Редактор:** `<Textarea>` для текста цитаты, `<Input>` для автора.

**Вид:** Левая фиолетовая полоса (border-left), текст курсивом, имя автора снизу малым текстом.

### 2.4 `divider` — Разделитель

**Данные:** `{ style: 'line' | 'dots' | 'wave' }`

**Редактор:** Три варианта кнопками (не RadioGroup — `@radix-ui/react-radio-group` не установлен). Три кнопки-плитки с live-превью, активная выделена.

**Вид:**
- `line` — горизонтальная линия с gradient (transparent → primary → transparent)
- `dots` — «• • •» по центру
- `wave` — inline SVG волнистая линия

### 2.5 `contact` — Контакт организатора

**Данные:** `{ name: string; role?: string; telegram?: string; phone?: string }`

**Редактор:** Поля: Имя, Роль, Telegram (без @), Телефон.

**Вид:** Аватар из инициалов (первая буква первого слова + первая буква последнего слова; для однословного имени — первые две буквы), имя, роль, кнопки-ссылки `tg://...` и `tel:`.

### 2.6 `video` — Видео

**Данные:** `{ url: string; title?: string }`

**Редактор:** Input для URL + опциональный заголовок. Показывает embed-превью если URL содержит `youtube.com`, `youtu.be` или `vimeo.com`.

**Вид:** `<iframe>` с extracted embed URL:
- YouTube: `https://www.youtube.com/embed/{videoId}`
- Vimeo: `https://player.vimeo.com/video/{videoId}`
- Иначе: кнопка-ссылка «Смотреть видео»

Iframe атрибуты: `sandbox="allow-scripts allow-same-origin allow-presentation"`, `allow="autoplay; fullscreen"`, `loading="lazy"`.

Отношение сторон: 16:9 через `aspect-video` (Tailwind).

### 2.7 `checklist` — Чеклист

**Данные:** `{ title?: string; items: string[] }`

**Редактор:** Input для заголовка, список input-ов для пунктов, кнопки «Добавить» и «Удалить».

**Вид:** Заголовок (если есть), список со статичными иконками галочек (не интерактивные — это инструкция гостям, не to-do лист).

---

## 3. Изменения в архитектуре

### shared/types.ts
- Добавить в `BlockType` union: `'agenda' | 'gallery' | 'quote' | 'divider' | 'contact' | 'video' | 'checklist'`
- Обновить комментарии с формами данных для ВСЕХ типов (включая изменённые):
  - `text: { html: string }` (было `{ content: string }`)
  - `color_scheme: { colors: string[]; label?: string }` (было `{ scheme: string }`)
  - Добавить комментарии для 7 новых типов

### block-item.tsx
- `getPreview()` → тип `React.ReactNode`
- Image: `<img>` тумбнейл
- Новые типы: текстовые превью (agenda: кол-во пунктов, gallery: кол-во фото и т.д.)
- Заменить `<p className="text-sm text-foreground line-clamp-3">{preview}</p>` на `<div className="text-sm text-foreground line-clamp-3">{preview}</div>`

### block-palette.tsx
- Обновить `PALETTE_ITEMS` — все старые + 7 новых

### block-editor-modal.tsx
- Добавить 7 новых веток в switch

### block-renderer.tsx (`app/s/[shortId]/components/blocks/`)
- Добавить маппинг 7 новых типов

### Новые файлы

**Editors** (`app/wishlist/components/constructor/blocks/`):
- `agenda-block-editor.tsx`
- `gallery-block-editor.tsx`
- `quote-block-editor.tsx`
- `divider-block-editor.tsx`
- `contact-block-editor.tsx`
- `video-block-editor.tsx`
- `checklist-block-editor.tsx`

**Views** (`app/s/[shortId]/components/blocks/`):
- `agenda-block-view.tsx`
- `gallery-block-view.tsx`
- `quote-block-view.tsx`
- `divider-block-view.tsx`
- `contact-block-view.tsx`
- `video-block-view.tsx`
- `checklist-block-view.tsx`

---

## 4. Зависимости

```bash
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-underline @tailwindcss/typography isomorphic-dompurify
pnpm add -D @types/dompurify
```

Добавить в `tailwind.config.ts` → `plugins: [require('@tailwindcss/typography')]`.

---

## 5. Что не меняем

- Логику drag-and-drop (dnd-kit)
- Систему colSpan/rowSpan
- API-слой и мутации
- CSS-темы и `settings.colorScheme`
- Компонент `ImageUpload` (переиспользуем как есть)
