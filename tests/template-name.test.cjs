const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load.cjs')

const T = load('shared/template-name.ts')

const tpl = (blocks, sampleName) => ({ id: 't', name: 'Тест', category: 'bday', colorScheme: 'midnight', sampleTitle: 'Диме 35', occasion: '', sampleName, blocks })
const note = t => t.blocks[0].data.note

test('usesName: шаблон с {name} в текстах', () => {
  assert.equal(T.usesName(tpl([{ type: 'location', data: { note: 'На имя: {name}.' } }], 'Дима')), true)
  assert.equal(T.usesName(tpl([{ type: 'location', data: { note: 'Лифт до 31 этажа.' } }])), false)
})

test('withName: подставляет введённое имя во все тексты', () => {
  const t = tpl([{ type: 'location', title: 'Где {name}', data: { note: 'На имя: {name}.' } }], 'Дима')
  const filled = T.withName(t, '  Петя ')
  assert.equal(note(filled), 'На имя: Петя.')
  assert.equal(filled.blocks[0].title, 'Где Петя')
  assert.equal(note(t), 'На имя: {name}.', 'исходный шаблон не меняется')
})

test('withName: без имени — имя-пример', () => {
  assert.equal(note(T.withName(tpl([{ type: 'location', data: { note: 'На имя: {name}.' } }], 'Дима'))), 'На имя: Дима.')
})

test('withName: кавычки и слэши в имени не ломают данные', () => {
  assert.equal(note(T.withName(tpl([{ type: 'location', data: { note: '{name}' } }], 'Дима'), 'Саша "Бро" \ок')), 'Саша "Бро" \ок')
})
