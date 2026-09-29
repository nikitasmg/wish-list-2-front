const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
function load(file) {
  const source = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const loaded = { exports: {} }
  new Function('exports', 'require', 'module', output)(loaded.exports, require, loaded)
  return loaded.exports
}
globalThis.crypto ??= require('node:crypto').webcrypto
const { prepareBlocks } = load('shared/editor-model.ts')

const wishlist = (blocks) => ({ blocks, cover: '', title: 'Праздник' })

test('text_image становится текстом с фото, не теряя ни текста, ни картинки', () => {
  const [block] = prepareBlocks(wishlist([
    { id: 'ti', type: 'text_image', position: 0, data: { content: 'Привет, это Маша', imageUrl: 'https://cdn/photo.jpg' } },
  ]))

  assert.equal(block.type, 'text')
  assert.equal(block.id, 'ti', 'идентичность блока сохраняется — к ней привязаны ответы гостей')
  assert.equal(block.data.html, 'Привет, это Маша')
  assert.equal(block.data.imageUrl, 'https://cdn/photo.jpg')
  assert.equal(block.data.imagePosition, 'side')
})

test('text_image без картинки превращается в обычный текст', () => {
  const [block] = prepareBlocks(wishlist([
    { id: 'ti', type: 'text_image', position: 0, data: { content: 'Только текст' } },
  ]))

  assert.equal(block.type, 'text')
  assert.equal(block.data.html, 'Только текст')
  assert.equal(block.data.imageUrl, undefined)
})

test('уже переехавший текст не трогаем повторно', () => {
  const [block] = prepareBlocks(wishlist([
    { id: 't', type: 'text', position: 0, data: { html: '<p>Готово</p>', imagePosition: 'top' } },
  ]))

  assert.equal(block.data.html, '<p>Готово</p>')
  assert.equal(block.data.imagePosition, 'top', 'чужая раскладка не перетирается на side')
})

test('legacy-конвертация не меняет исходный вишлист', () => {
  const source = [{ id: 'ti', type: 'text_image', position: 0, data: { content: 'Текст', imageUrl: 'u' } }]
  prepareBlocks(wishlist(source))
  assert.equal(source[0].type, 'text_image', 'источник остаётся нетронутым')
})

const { addBlockAfter } = load('shared/editor-model.ts')

test('новый блок встаёт сразу за текущим, а позиции пересчитываются', () => {
  const blocks = [
    { id: 'a', type: 'text', position: 0, data: {} },
    { id: 'b', type: 'text', position: 1, data: {} },
  ]

  const next = addBlockAfter(blocks, 'a', 'text')

  assert.equal(next.length, 3)
  assert.deepEqual(next.map(b => b.position), [0, 1, 2])
  assert.equal(next[0].id, 'a')
  assert.equal(next[2].id, 'b')
  assert.ok(next[1].id && next[1].id !== 'a' && next[1].id !== 'b', 'у нового блока своя идентичность')
  assert.equal(next[1].type, 'text')
})

test('добавление не трогает исходный массив', () => {
  const blocks = [{ id: 'a', type: 'text', position: 0, data: {} }]
  addBlockAfter(blocks, 'a', 'text')
  assert.equal(blocks.length, 1)
})

test('неизвестный блок — список остаётся прежним', () => {
  const blocks = [{ id: 'a', type: 'text', position: 0, data: {} }]
  assert.equal(addBlockAfter(blocks, 'нет-такого', 'text').length, 1)
})
