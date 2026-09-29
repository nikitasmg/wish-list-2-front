const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load.cjs')
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

test('превращение сохраняет id и место в сетке, но меняет тип и данные', () => {
  const blocks = [
    { id: 'a', type: 'text', row: 0, col: 1, colSpan: 1, data: { html: '/мес' } },
    { id: 'b', type: 'text', row: 1, col: 0, colSpan: 2, data: {} },
  ]

  const next = convertBlock(blocks, 'a', 'location')

  assert.equal(next[0].id, 'a', 'идентичность держит ответы гостей — её нельзя терять')
  assert.equal(next[0].row, 0)
  assert.equal(next[0].col, 1, 'блок не перескакивает в другую колонку')
  assert.equal(next[0].colSpan, 1, 'ширина остаётся прежней')
  assert.equal(next[0].type, 'location')
  assert.equal(next[0].data.html, undefined, 'текст команды не утекает в новый блок')
  assert.equal(next[1].id, 'b', 'соседи не трогаются')
})

test('превращение не меняет исходный массив', () => {
  const blocks = [{ id: 'a', type: 'text', row: 0, col: 0, colSpan: 2, data: { html: '/' } }]
  convertBlock(blocks, 'a', 'poll')
  assert.equal(blocks[0].type, 'text')
})
