const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load.cjs')
const { History } = load('shared/history.ts')

test('отменить и повторить возвращают снимки по порядку', () => {
  const h = new History()
  h.record('a', 'move', 0)
  h.record('b', 'move', 5000)
  assert.equal(h.undo('c'), 'b')
  assert.equal(h.undo('b'), 'a')
  assert.equal(h.undo('a'), undefined, 'дальше отменять нечего')
  assert.equal(h.redo('a'), 'b')
  assert.equal(h.redo('b'), 'c')
  assert.equal(h.redo('c'), undefined)
})

test('набор текста подряд — один шаг отмены', () => {
  const h = new History()
  h.record('', 'text:a', 0)
  h.record('п', 'text:a', 300)
  h.record('пр', 'text:a', 600)
  assert.equal(h.undo('при'), '', 'отмена возвращает к началу правки, а не на одну букву')
})

test('пауза или другое поле начинают новый шаг', () => {
  const h = new History()
  h.record('1', 'text:a', 0)
  h.record('2', 'text:a', 5000)
  h.record('3', 'text:b', 5100)
  assert.equal(h.undo('4'), '3')
  assert.equal(h.undo('3'), '2')
})

test('новое действие после отмены стирает «повторить»', () => {
  const h = new History()
  h.record('a', 'x', 0)
  h.undo('b')
  h.record('a', 'y', 9000)
  assert.equal(h.canRedo, false)
})

test('история ограничена', () => {
  const h = new History(3)
  for (let i = 0; i < 10; i++) h.record(String(i), 'k' + i, i * 10000)
  assert.equal(h.undo('x'), '9')
  assert.equal(h.undo('9'), '8')
  assert.equal(h.undo('8'), '7')
  assert.equal(h.undo('7'), undefined)
})
