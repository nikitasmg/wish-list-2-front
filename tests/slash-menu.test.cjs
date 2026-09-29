const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

// Загрузчик с поддержкой относительных импортов: slash-menu тянет каталог
// блоков и makeBlock из соседнего модуля, а простой require из tests/ искал
// бы './editor-model' рядом с тестом.
const cache = new Map()
function load(file) {
  const key = path.resolve(file)
  if (cache.has(key)) return cache.get(key)

  const source = fs.existsSync(key) ? fs.readFileSync(key, 'utf8') : ''
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const loaded = { exports: {} }
  cache.set(key, loaded.exports)

  const localRequire = id => id.startsWith('.')
    ? load(path.join(path.dirname(key), `${id}.ts`))
    : require(id)

  new Function('exports', 'require', 'module', output)(loaded.exports, localRequire, loaded)
  return loaded.exports
}
globalThis.crypto ??= require('node:crypto').webcrypto
const { slashQuery, slashMatches, convertBlock } = load('shared/slash-menu.ts')
const { BLOCK_CATALOG } = load('shared/editor-model.ts')

test('меню открывается только когда «/» — это всё содержимое блока', () => {
  assert.equal(slashQuery('/'), '')
  assert.equal(slashQuery('/мес'), 'мес')
  // Теги от contenteditable не должны мешать распознать команду
  assert.equal(slashQuery('<p>/список</p>'), 'список')
  assert.equal(slashQuery('<p>/</p><br>'), '')
})

test('«/» в середине текста — это просто символ, а не команда', () => {
  assert.equal(slashQuery('Адрес: ул. Мира 7/2'), null)
  assert.equal(slashQuery('Пишите /мне'), null)
  assert.equal(slashQuery(''), null)
  assert.equal(slashQuery('<p><br></p>'), null)
})

test('пустой запрос показывает весь каталог, кроме обложки', () => {
  const matches = slashMatches(BLOCK_CATALOG, '')
  assert.ok(matches.length > 5)
  // Обложка на странице одна и стоит первой — предлагать её посреди текста
  // значит предлагать сломать страницу.
  assert.equal(matches.some(item => item.type === 'cover'), false)
})

test('поиск идёт по названию и не зависит от регистра', () => {
  assert.deepEqual(slashMatches(BLOCK_CATALOG, 'мес').map(i => i.type), ['location'])
  assert.deepEqual(slashMatches(BLOCK_CATALOG, 'МЕСТО').map(i => i.type), ['location'])
  assert.deepEqual(slashMatches(BLOCK_CATALOG, 'голос').map(i => i.type), ['poll'])
})

test('поиск понимает и группу: «гости» показывает всю группу', () => {
  const types = slashMatches(BLOCK_CATALOG, 'гости').map(i => i.type)
  assert.deepEqual(types, ['rsvp', 'poll', 'playlist', 'guestbook'])
})

test('ничего не найдено — пустой список, а не весь каталог', () => {
  assert.deepEqual(slashMatches(BLOCK_CATALOG, 'зззз'), [])
})

test('превращение сохраняет id и позицию, но меняет тип и данные', () => {
  const blocks = [
    { id: 'a', type: 'text', position: 0, colSpan: 2, rowSpan: 1, data: { html: '/мес' } },
    { id: 'b', type: 'text', position: 1, colSpan: 2, rowSpan: 1, data: {} },
  ]

  const next = convertBlock(blocks, 'a', 'location')

  assert.equal(next[0].id, 'a', 'идентичность держит ответы гостей — её нельзя терять')
  assert.equal(next[0].position, 0)
  assert.equal(next[0].type, 'location')
  assert.equal(next[0].data.html, undefined, 'текст команды не утекает в новый блок')
  assert.equal(next[1].id, 'b', 'соседи не трогаются')
})

test('превращение не меняет исходный массив', () => {
  const blocks = [{ id: 'a', type: 'text', position: 0, data: { html: '/' } }]
  convertBlock(blocks, 'a', 'poll')
  assert.equal(blocks[0].type, 'text')
})
