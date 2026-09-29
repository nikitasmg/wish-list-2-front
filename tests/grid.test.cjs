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

const { compactRows, moveBlockByRow } = load('shared/grid.ts')

test('пустые строки схлопываются, расстановка по колонкам цела', () => {
  const next = compactRows([half('a', 0, 1), half('b', 4, 0), full('c', 9)])
  const byId = Object.fromEntries(next.map(b => [b.id, b]))
  assert.deepEqual([byId.a.row, byId.a.col], [0, 1], 'колонка не съехала')
  assert.equal(byId.b.row, 1)
  assert.equal(byId.c.row, 2)
})

test('сжатие не трогает строку, где стоят два блока', () => {
  const next = compactRows([half('a', 3, 0), half('b', 3, 1)])
  assert.deepEqual(next.map(b => b.row), [0, 0], 'соседи остались в одной строке')
})

test('«выше» меняет блоки местами, а не затирает', () => {
  const next = moveBlockByRow([full('a', 0), full('b', 1)], 'b', -1)
  const byId = Object.fromEntries(next.map(b => [b.id, b]))
  assert.equal(next.length, 2)
  assert.equal(byId.b.row, 0)
  assert.equal(byId.a.row, 1)
})

test('«выше» у самого верхнего блока ничего не делает', () => {
  const blocks = [full('a', 0), full('b', 1)]
  assert.deepEqual(moveBlockByRow(blocks, 'a', -1), blocks)
})

test('многократное «вниз-вверх» не раздувает номера строк', () => {
  let blocks = [full('a', 0), full('b', 1), full('c', 2)]
  for (let i = 0; i < 5; i++) {
    blocks = moveBlockByRow(blocks, 'a', 1)
    blocks = moveBlockByRow(blocks, 'a', -1)
  }
  const rows = blocks.map(b => b.row).sort((x, y) => x - y)
  assert.deepEqual(rows, [0, 1, 2], 'сетка осталась из трёх строк')
})

const { appendLibraryBlock, BLOCK_LIBRARY } = load('shared/editor-model.ts')

test('блок из библиотеки приходит с видом и заготовкой содержимого', () => {
  const stoplist = BLOCK_LIBRARY.find(i => i.id === 'stoplist')
  const [block] = appendLibraryBlock([], stoplist)

  assert.equal(block.type, 'list')
  assert.equal(block.view, 'tags')
  assert.equal(block.caption, 'Не дарите')
  assert.equal(block.data.strike, true)
  assert.ok(block.data.items.length, 'пустой блок объяснять некому — items заполнены')
  assert.ok(block.id, 'у блока своя идентичность')
})

test('заготовка библиотеки не расшаривается между блоками', () => {
  const sizes = BLOCK_LIBRARY.find(i => i.id === 'sizes')
  const [first] = appendLibraryBlock([], sizes)
  first.data.items[0].v = 'XXL'
  const [second] = appendLibraryBlock([], sizes)
  assert.notEqual(second.data.items[0].v, 'XXL', 'второй блок не унаследовал правку первого')
})

test('блок из библиотеки встаёт в первую свободную ячейку', () => {
  const [, added] = appendLibraryBlock([half('a', 0, 0)], BLOCK_LIBRARY.find(i => i.id === 'quote'))
  assert.deepEqual([added.row, added.col], [0, 1], 'рядом, а не строкой ниже')
})
