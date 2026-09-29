const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load.cjs')

const {
  findFirstEmptyCell,
  isCellOccupied,
  mobileOrder,
  moveBlock,
  pushBlocksDown,
  resizeBlock,
} = load('shared/grid.ts')

const half = (id, row, col) => ({ id, type: 'text', row, col, colSpan: 1, data: {} })
const full = (id, row) => ({ id, type: 'text', row, col: 0, colSpan: 2, data: {} })

test('широкий блок занимает обе колонки строки', () => {
  const blocks = [full('a', 0)]
  assert.equal(isCellOccupied(blocks, 0, 0), true)
  assert.equal(isCellOccupied(blocks, 0, 1), true, 'правая половина тоже занята')
  assert.equal(isCellOccupied(blocks, 1, 0), false)
})

test('первая свободная ячейка — справа от одинокого блока, а не строкой ниже', () => {
  assert.deepEqual(findFirstEmptyCell([half('a', 0, 0)]), { row: 0, col: 1 })
  assert.deepEqual(findFirstEmptyCell([full('a', 0)]), { row: 1, col: 0 })
  assert.deepEqual(findFirstEmptyCell([]), { row: 0, col: 0 })
})

test('перенос в свободную ячейку никого не двигает', () => {
  const blocks = [half('a', 0, 0), half('b', 1, 0)]
  const next = moveBlock(blocks, 0, 1, 1)
  const byId = Object.fromEntries(next.map(b => [b.id, b]))
  assert.deepEqual([byId.a.row, byId.a.col], [1, 1])
  assert.equal(byId.b.row, 1, 'сосед остался на месте')
})

test('перенос в занятую ячейку сдвигает строку вниз, а не затирает блок', () => {
  const blocks = [half('a', 2, 0), half('b', 0, 0)]
  const next = moveBlock(blocks, 0, 0, 0)
  const byId = Object.fromEntries(next.map(b => [b.id, b]))
  assert.equal(next.length, 2, 'ничего не потерялось')
  assert.deepEqual([byId.a.row, byId.a.col], [0, 0])
  assert.equal(byId.b.row, 1, 'прежний жилец уехал на строку вниз')
})

test('широкий блок при переносе занимает всю строку и встаёт в левую колонку', () => {
  const blocks = [full('wide', 3), half('b', 0, 1)]
  const next = moveBlock(blocks, 0, 0, 1)
  const byId = Object.fromEntries(next.map(b => [b.id, b]))
  assert.deepEqual([byId.wide.row, byId.wide.col], [0, 0], 'широкий блок не живёт в правой колонке')
  assert.equal(byId.b.row, 1)
})

test('растягивание на две колонки освобождает строку', () => {
  const blocks = [half('a', 0, 0), half('b', 0, 1)]
  const next = resizeBlock(blocks, 'a', 2)
  const byId = Object.fromEntries(next.map(b => [b.id, b]))
  assert.equal(byId.a.colSpan, 2)
  assert.equal(byId.a.col, 0)
  assert.equal(byId.b.row, 1, 'сосед по строке уехал вниз, а не пропал')
})

test('сужение до одной колонки никого не трогает', () => {
  const blocks = [full('a', 0), half('b', 1, 0)]
  const next = resizeBlock(blocks, 'a', 1)
  const byId = Object.fromEntries(next.map(b => [b.id, b]))
  assert.equal(byId.a.colSpan, 1)
  assert.equal(byId.b.row, 1)
})

test('сдвиг вниз двигает только то, что на строке и ниже', () => {
  const next = pushBlocksDown([half('a', 0, 0), half('b', 2, 0)], 2)
  const byId = Object.fromEntries(next.map(b => [b.id, b]))
  assert.equal(byId.a.row, 0)
  assert.equal(byId.b.row, 3)
})

test('порядок на телефоне — сверху вниз, слева направо', () => {
  const blocks = [half('right', 0, 1), half('left', 0, 0), full('below', 1)]
  assert.deepEqual(mobileOrder(blocks).map(b => b.id), ['left', 'right', 'below'])
})

test('mobileOrder не трогает исходный массив', () => {
  const blocks = [half('right', 0, 1), half('left', 0, 0)]
  mobileOrder(blocks)
  assert.equal(blocks[0].id, 'right')
})
