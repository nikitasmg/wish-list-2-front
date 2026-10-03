const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load.cjs')

const L = load('shared/layout.ts')

const b = (id, row = 0, col = 0, colSpan = 1, extra = {}) => ({ id, type: 'text', row, col, colSpan, data: {}, ...extra })
// Раскладка как видит её человек: ряды, в каждом — ячейки по колонкам.
const shape = layout => L.layoutRows(layout).map(r => r.cells.map(c => (c ? c.id : '_')).join(','))

test('v2: широкий блок — ряд из одной колонки, пара — ряд из двух', () => {
  const layout = L.normalizeLayout([b('a', 0, 0, 2), b('l', 1, 0), b('r', 1, 1)])
  assert.deepEqual(shape(layout), ['a', 'l,r'])
  assert.deepEqual(layout.rows.map(r => r.columns), [1, 2])
  assert.ok(layout.blocks.every(x => x.colSpan === 1), 'в v3 блок всегда в одной колонке')
})

test('v2: одинокий узкий блок становится узким блоком во всю строку', () => {
  const layout = L.normalizeLayout([b('a', 0, 1)])
  assert.deepEqual(shape(layout), ['a'])
  assert.equal(layout.blocks[0].width, 'narrow')
})

test('дыры в номерах рядов схлопываются, порядок сохраняется', () => {
  const layout = L.normalizeLayout([b('c', 9, 0, 2), b('a', 0, 0, 2), b('b', 4, 0, 2)])
  assert.deepEqual(shape(layout), ['a', 'b', 'c'])
  assert.deepEqual(layout.blocks.map(x => [x.id, x.row]).sort(), [['a', 0], ['b', 1], ['c', 2]])
})

test('явные настройки ряда сохраняются вместе с пустой колонкой', () => {
  const layout = L.normalizeLayout([b('a', 0, 1)], [{ columns: 3, ratio: '1:1:1', gap: 'l' }])
  assert.deepEqual(shape(layout), ['_,a,_'])
  assert.equal(layout.rows[0].gap, 'l')
})

test('пропорция, не подходящая числу колонок, сбрасывается', () => {
  const layout = L.normalizeLayout([b('a'), b('b', 0, 1)], [{ columns: 2, ratio: '1:1:1' }])
  assert.equal(layout.rows[0].ratio, '')
})

test('нормализация идемпотентна', () => {
  const once = L.normalizeLayout([b('a', 0, 0, 2), b('l', 1, 0), b('r', 1, 1), b('z', 3, 1)])
  const twice = L.normalizeLayout(once.blocks, once.rows)
  assert.deepEqual(twice, once)
})

const base = () => L.normalizeLayout([b('a', 0, 0, 2), b('l', 1, 0), b('r', 1, 1), b('z', 2, 0, 2)])

test('вставка блока отдельным рядом между рядами', () => {
  const next = L.insertRow(base(), 1, b('new'))
  assert.deepEqual(shape(next), ['a', 'new', 'l,r', 'z'])
})

test('перенос между рядами: блок уходит из пары, оставшийся растягивается', () => {
  const next = L.moveToRow(base(), 'r', 0)
  assert.deepEqual(shape(next), ['r', 'a', 'l', 'z'])
  assert.equal(next.rows[2].columns, 1)
})

test('перенос в самый низ', () => {
  const next = L.moveToRow(base(), 'a', 3)
  assert.deepEqual(shape(next), ['l,r', 'z', 'a'])
})

test('«поставить рядом» собирает ряд, справа и слева', () => {
  assert.deepEqual(shape(L.placeBeside(base(), 'z', 'a', 'right')), ['a,z', 'l,r'])
  assert.deepEqual(shape(L.placeBeside(base(), 'z', 'a', 'left')), ['z,a', 'l,r'])
})

test('«поставить рядом» сбрасывает пропорцию: прежняя к новому числу колонок не подходит', () => {
  const layout = L.updateRow(base(), 1, { ratio: '2:1' })
  const next = L.placeBeside(layout, 'z', 'l', 'right')
  assert.deepEqual(shape(next), ['a', 'l,z,r'])
  assert.equal(next.rows[1].ratio, '')
})

test('в ряд больше трёх блоков не встаёт', () => {
  let layout = L.placeBeside(base(), 'z', 'r', 'right')
  layout = L.insertRow(layout, 2, b('q'))
  assert.deepEqual(shape(L.placeBeside(layout, 'q', 'l', 'left')), shape(layout))
})

test('«поставить рядом» внутри своего ряда меняет порядок', () => {
  assert.deepEqual(shape(L.placeBeside(base(), 'r', 'l', 'left')), ['a', 'r,l', 'z'])
})

test('«выше/ниже» одиночного блока меняет ряды местами, настройки едут с рядом', () => {
  const layout = L.updateRow(base(), 1, { gap: 's' })
  const next = L.nudge(layout, 'z', -1)
  assert.deepEqual(shape(next), ['a', 'z', 'l,r'])
  assert.equal(next.rows[2].gap, 's')
})

test('«выше» блока из пары выносит его отдельным рядом над парой', () => {
  assert.deepEqual(shape(L.nudge(base(), 'r', -1)), ['a', 'r', 'l', 'z'])
  assert.deepEqual(shape(L.nudge(base(), 'l', 1)), ['a', 'r', 'l', 'z'])
})

test('«выше» у самого верхнего ничего не делает', () => {
  assert.deepEqual(shape(L.nudge(base(), 'a', -1)), shape(base()))
  assert.deepEqual(shape(L.nudge(base(), 'z', 1)), shape(base()))
})

test('меньше колонок, чем блоков, — лишние уходят рядами ниже', () => {
  let layout = L.placeBeside(base(), 'z', 'r', 'right')
  layout = L.updateRow(layout, 1, { columns: 1 })
  assert.deepEqual(shape(layout), ['a', 'l', 'r', 'z'])
})

test('больше колонок — появляется пустая ячейка, в неё можно добавить', () => {
  let layout = L.updateRow(base(), 0, { columns: 2 })
  assert.deepEqual(shape(layout)[0], 'a,_')
  layout = L.addToCell(layout, 0, 1, b('x'))
  assert.deepEqual(shape(layout)[0], 'a,x')
})

test('«Разделить ряд на блоки»', () => {
  assert.deepEqual(shape(L.splitRow(base(), 1)), ['a', 'l', 'r', 'z'])
})

test('удаление блока из пары растягивает соседа', () => {
  const next = L.removeBlock(base(), 'l')
  assert.deepEqual(shape(next), ['a', 'r', 'z'])
  assert.equal(next.rows[1].columns, 1)
})

test('копия встаёт отдельным рядом сразу под оригиналом, с новым id и своими данными', () => {
  const layout = L.normalizeLayout([b('a', 0, 0, 2, { data: { items: [1] } }), b('z', 1, 0, 2)])
  const next = L.duplicateBlock(layout, 'a')
  const copy = next.blocks.find(x => x.id !== 'a' && x.id !== 'z')
  assert.deepEqual(shape(next), ['a', copy.id, 'z'])
  copy.data.items.push(2)
  assert.deepEqual(layout.blocks[0].data.items, [1], 'данные не общие')
})

test('операции не мутируют исходную раскладку', () => {
  const layout = base()
  const snapshot = JSON.stringify(layout)
  L.moveToRow(layout, 'r', 0)
  L.placeBeside(layout, 'z', 'a', 'right')
  L.updateRow(layout, 1, { columns: 3 })
  L.removeBlock(layout, 'a')
  assert.equal(JSON.stringify(layout), snapshot)
})

test('порядок чтения — сверху вниз, слева направо, «правая — первой» переворачивает ряд', () => {
  assert.deepEqual(L.readingOrder(base()).map(x => x.id), ['a', 'l', 'r', 'z'])
  const reversed = L.updateRow(base(), 1, { mobileReverse: true })
  assert.deepEqual(L.readingOrder(reversed).map(x => x.id), ['a', 'r', 'l', 'z'])
})

test('шаблон колонок по пропорции', () => {
  assert.equal(L.columnTemplate({ columns: 2, ratio: '2:1' }), 'minmax(0,2fr) minmax(0,1fr)')
  assert.equal(L.columnTemplate({ columns: 3, ratio: '' }), 'repeat(3,minmax(0,1fr))')
  assert.equal(L.columnTemplate({ columns: 1 }), 'minmax(0,1fr)')
})

test('ближайшая пропорция для разделителя', () => {
  assert.equal(L.snapRatio(0.3), '1:2')
  assert.equal(L.snapRatio(0.52), '1:1')
  assert.equal(L.snapRatio(0.7), '2:1')
})

test('перенос в пустую ячейку другого ряда', () => {
  const layout = L.updateRow(base(), 0, { columns: 2 })
  const next = L.moveToCell(layout, 'z', 0, 1)
  assert.deepEqual(shape(next), ['a,z', 'l,r'])
})

test('перенос в пустую ячейку своего ряда меняет колонку', () => {
  const layout = L.normalizeLayout([b('a', 0, 0)], [{ columns: 3 }])
  assert.deepEqual(shape(L.moveToCell(layout, 'a', 0, 2)), ['_,_,a'])
})

test('занятая ячейка — блок встаёт рядом отдельным рядом ниже', () => {
  const next = L.moveToCell(base(), 'a', 1, 0)
  assert.deepEqual(shape(next), ['l,r', 'a', 'z'])
})
