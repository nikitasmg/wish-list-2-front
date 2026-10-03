const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load.cjs')
const G = load('shared/gifts.ts')

const p = (id, extra = {}) => ({ id, title: id, reserved: false, createdAt: '2026-01-01T00:00:00Z', ...extra })

test('статус подарка глазами гостя', () => {
  assert.equal(G.giftStatus(p('a')), 'free')
  assert.equal(G.giftStatus(p('a', { reserved: true, reservedByMe: true })), 'mine')
  assert.equal(G.giftStatus(p('a', { reserved: true })), 'taken')
  assert.equal(G.giftStatus(p('a', { reserved: true, gifted: true })), 'gifted', 'подарено важнее брони')
})

test('главная мечта первой, дальше порядок владельца', () => {
  const sorted = G.sortGifts([p('c', { sortOrder: 2 }), p('a', { sortOrder: 0 }), p('m', { sortOrder: 5, isMain: true }), p('b', { sortOrder: 1 })])
  assert.deepEqual(sorted.map(x => x.id), ['m', 'a', 'b', 'c'])
})

test('счётчики фильтров: «Заняты» — и свои, и чужие брони', () => {
  const list = [p('a'), p('b', { reserved: true }), p('c', { reserved: true, reservedByMe: true }), p('d', { gifted: true })]
  assert.deepEqual(G.giftCounts(list), { all: 4, free: 1, taken: 2, gifted: 1 })
  assert.deepEqual(G.filterGifts(list, 'taken').map(x => x.id), ['b', 'c'])
  assert.deepEqual(G.filterGifts(list, 'gifted').map(x => x.id), ['d'])
})

test('подпись чужой брони', () => {
  assert.equal(G.takenLabel(p('a', { reserved: true, reservedByName: 'Аня' })), 'Дарит Аня')
  assert.equal(G.takenLabel(p('a', { reserved: true })), 'Уже дарят')
})

test('магазин — по хосту ссылки, без www', () => {
  assert.equal(G.shopName('https://www.ozon.ru/product/1'), 'ozon.ru')
  assert.equal(G.shopName('мусор'), '—')
})
