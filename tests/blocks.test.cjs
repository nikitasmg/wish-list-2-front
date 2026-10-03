const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load.cjs')
const { prepareLayout } = load('shared/editor-model.ts')
const prepareBlocks = w => prepareLayout(w).blocks

const wishlist = (blocks) => ({ blocks, cover: '', title: 'Праздник' })

test('text_image становится текстом с фото, не теряя ни текста, ни картинки', () => {
  const [block] = prepareBlocks(wishlist([
    { id: 'ti', type: 'text_image', row: 0, col: 0, colSpan: 2, data: { content: 'Привет, это Маша', imageUrl: 'https://cdn/photo.jpg' } },
  ]))

  assert.equal(block.type, 'text')
  assert.equal(block.id, 'ti', 'идентичность блока сохраняется — к ней привязаны ответы гостей')
  assert.equal(block.data.html, 'Привет, это Маша')
  assert.equal(block.data.imageUrl, 'https://cdn/photo.jpg')
  assert.equal(block.data.imagePosition, 'side')
})

test('text_image без картинки превращается в обычный текст', () => {
  const [block] = prepareBlocks(wishlist([
    { id: 'ti', type: 'text_image', row: 0, col: 0, colSpan: 2, data: { content: 'Только текст' } },
  ]))

  assert.equal(block.type, 'text')
  assert.equal(block.data.html, 'Только текст')
  assert.equal(block.data.imageUrl, undefined)
})

test('уже переехавший текст не трогаем повторно', () => {
  const [block] = prepareBlocks(wishlist([
    { id: 't', type: 'text', row: 0, col: 0, colSpan: 2, data: { html: '<p>Готово</p>', imagePosition: 'top' } },
  ]))

  assert.equal(block.data.html, '<p>Готово</p>')
  assert.equal(block.data.imagePosition, 'top', 'чужая раскладка не перетирается на side')
})

test('legacy-конвертация не меняет исходный вишлист', () => {
  const source = [{ id: 'ti', type: 'text_image', row: 0, col: 0, colSpan: 2, data: { content: 'Текст', imageUrl: 'u' } }]
  prepareBlocks(wishlist(source))
  assert.equal(source[0].type, 'text_image', 'источник остаётся нетронутым')
})

const { addBlockAfter, libraryBlock, BLOCK_LIBRARY } = load('shared/editor-model.ts')
const { normalizeLayout } = load('shared/layout.ts')

test('новый блок встаёт отдельным рядом под якорем, нижние ряды сдвигаются', () => {
  const layout = normalizeLayout([
    { id: 'a', type: 'text', row: 0, col: 0, colSpan: 2, data: {} },
    { id: 'b', type: 'text', row: 1, col: 0, colSpan: 2, data: {} },
  ])

  const { layout: next, id } = addBlockAfter(layout, 'a', 'text')
  const byId = Object.fromEntries(next.blocks.map(b => [b.id, b]))

  assert.equal(next.blocks.length, 3)
  assert.equal(byId.a.row, 0, 'якорь остаётся на месте')
  assert.equal(byId[id].row, 1, 'новый блок — следующим рядом')
  assert.equal(byId.b.row, 2, 'нижний сосед уезжает на ряд вниз')
})

test('добавление не трогает исходную раскладку', () => {
  const layout = normalizeLayout([{ id: 'a', type: 'text', row: 0, col: 0, colSpan: 2, data: {} }])
  addBlockAfter(layout, 'a', 'text')
  assert.equal(layout.blocks.length, 1)
})

test('неизвестный блок — раскладка прежняя', () => {
  const layout = normalizeLayout([{ id: 'a', type: 'text', row: 0, col: 0, colSpan: 2, data: {} }])
  assert.equal(addBlockAfter(layout, 'нет-такого', 'text').layout, layout)
})

test('блок из библиотеки приходит с видом, подписью и заготовкой содержимого', () => {
  const block = libraryBlock(BLOCK_LIBRARY.find(i => i.id === 'stoplist'))
  assert.equal(block.type, 'list')
  assert.equal(block.view, 'tags')
  assert.equal(block.caption, 'Стоп-лист')
  assert.equal(block.data.strike, true)
  assert.ok(block.data.items.length, 'пустой блок объяснять некому — items заполнены')
})

test('заготовка библиотеки не расшаривается между блоками', () => {
  const sizes = BLOCK_LIBRARY.find(i => i.id === 'sizes')
  const first = libraryBlock(sizes)
  first.data.items[0].v = 'XXL'
  assert.notEqual(libraryBlock(sizes).data.items[0].v, 'XXL')
})

test('в библиотеке 14 типов блоков, как в макете', () => {
  assert.equal(new Set(BLOCK_LIBRARY.map(i => i.type)).size, 14)
})

const { isSecretHidden } = load('shared/editor-model.ts')
const now = new Date('2026-09-29T12:00:00Z')

test('секрет скрыт, пока не наступила дата', () => {
  assert.equal(isSecretHidden({ type: 'text', revealAt: '2026-10-01T00:00:00Z', data: {} }, now), true)
})

test('после даты секрет раскрывается, даже если data пустая', () => {
  // divider, location, contact и ещё полдюжины типов законно живут с data: {}.
  // Прежняя проверка «пустая data — значит секрет» держала их закрытыми
  // навсегда, а кнопка «Открыть сюрприз» перезагружала страницу по кругу.
  assert.equal(isSecretHidden({ type: 'divider', revealAt: '2026-09-01T00:00:00Z', data: {} }, now), false)
  assert.equal(isSecretHidden({ type: 'location', revealAt: '2026-09-28T00:00:00Z', data: {} }, now), false)
})

test('без revealAt блок не секретный', () => {
  assert.equal(isSecretHidden({ type: 'text', data: {} }, now), false)
  assert.equal(isSecretHidden({ type: 'text', revealAt: null, data: {} }, now), false)
})

test('мусор вместо даты не прячет блок', () => {
  assert.equal(isSecretHidden({ type: 'text', revealAt: 'не дата', data: {} }, now), false)
})
