const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load.cjs')
const { prepareBlocks } = load('shared/editor-model.ts')

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

const { addBlockAfter } = load('shared/editor-model.ts')

test('новый блок встаёт строкой ниже, а соседи снизу сдвигаются', () => {
  const blocks = [
    { id: 'a', type: 'text', row: 0, col: 0, colSpan: 2, data: {} },
    { id: 'b', type: 'text', row: 1, col: 0, colSpan: 2, data: {} },
  ]

  const next = addBlockAfter(blocks, 'a', 'text')
  const byId = Object.fromEntries(next.map(b => [b.id, b]))

  assert.equal(next.length, 3)
  assert.equal(byId.a.row, 0, 'якорь остаётся на месте')
  assert.equal(byId.b.row, 2, 'нижний сосед уезжает на строку вниз')

  const fresh = next.find(b => b.id !== 'a' && b.id !== 'b')
  assert.ok(fresh.id, 'у нового блока своя идентичность')
  assert.equal(fresh.row, 1, 'новый блок встаёт в освободившуюся строку')
  assert.equal(fresh.type, 'text')
})

test('добавление не трогает исходный массив', () => {
  const blocks = [{ id: 'a', type: 'text', row: 0, col: 0, colSpan: 2, data: {} }]
  addBlockAfter(blocks, 'a', 'text')
  assert.equal(blocks.length, 1)
  assert.equal(blocks[0].row, 0, 'исходные координаты не поехали')
})

test('неизвестный блок — список остаётся прежним', () => {
  const blocks = [{ id: 'a', type: 'text', row: 0, col: 0, colSpan: 2, data: {} }]
  assert.equal(addBlockAfter(blocks, 'нет-такого', 'text').length, 1)
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
