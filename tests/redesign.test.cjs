const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load.cjs')
const model = load('shared/editor-model.ts')
const { SaveQueue } = load('shared/save-queue.ts')
test('v2 pages do not resurrect gifts removed from the public blocks by the API', () => {
  assert.equal(model.isLegacyWishlist({ blocksVersion: 2 }), false)
  assert.equal(model.isLegacyWishlist({ blocksVersion: 1 }), true)
  assert.equal(model.isLegacyWishlist({}), true)
})
test('accepting a save response cannot adopt another writer blocks as our version', () => {
  assert.equal(model.matchesSavedBlocks([{ id: 'a', data: { html: 'mine' } }], [{ id: 'a', data: { html: 'theirs' } }]), false)
  assert.equal(model.matchesSavedBlocks([{ id: 'a', data: { html: 'mine' } }], [{ data: { html: 'mine' }, id: 'a' }]), true)
})
test('save queue serializes writes and coalesces intermediate drafts', async () => {
  const calls = [], resolvers = []
  const queue = new SaveQueue(value => new Promise(resolve => { calls.push(value); resolvers.push(resolve) }))
  const pending = queue.push('first')
  queue.push('second'); queue.push('latest')
  assert.deepEqual(calls, ['first'])
  resolvers.shift()(); await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(calls, ['first', 'latest'])
  resolvers.shift()(); await pending
  assert.equal(queue.dirty, false)
})
test('failed save retains latest draft and stops automatic writes until explicit retry', async () => {
  let fail = true
  const calls = []
  const queue = new SaveQueue(async value => { calls.push(value); if (fail) throw new Error('conflict') })
  await queue.push('draft')
  await queue.push('newer')
  assert.deepEqual(calls, ['draft'])
  assert.equal(queue.dirty, true)
  fail = false; await queue.retry()
  assert.deepEqual(calls, ['draft', 'newer'])
  assert.equal(queue.dirty, false)
})
test('migration keeps content and IDs, converts legacy blocks without mutating source', () => {
  assert.equal(typeof model.prepareLayout, 'function')
  const original = [{ id: 'a', type: 'agenda', row: 0, col: 0, colSpan: 2, data: { items: [{ time: '12:00', text: 'Сбор' }] } }, { id: 'b', type: 'image', row: 1, col: 0, colSpan: 2, data: { url: 'https://example.com/a.png' } }]
  const prepared = model.prepareLayout({ blocks: original, cover: '', title: 'Праздник' })
  const result = prepared.blocks
  assert.equal(result[0].id, 'a')
  assert.equal(result[0].type, 'list')
  assert.deepEqual(result[0].data.items, [{ t: '12:00', v: 'Сбор' }])
  assert.equal(result[1].type, 'media')
  assert.deepEqual(result[1].data.images, ['https://example.com/a.png'])
  assert.equal(original[0].type, 'agenda')
  assert.deepEqual(model.prepareLayout({ ...prepared, cover: '', title: 'Праздник' }), prepared, 'повторная подготовка ничего не меняет')
})
test('duplicate has new identity, independent data, and lands in the freed row', () => {
  const layout = load('shared/layout.ts')
  const blocks = [{ id: 'a', type: 'list', row: 0, col: 0, colSpan: 2, data: { items: [{ v: 'Один' }] } }, { id: 'b', type: 'text', row: 1, col: 0, colSpan: 2, data: {} }]
  const result = layout.duplicateBlock(layout.normalizeLayout(blocks), 'a').blocks
  const byId = Object.fromEntries(result.map(b => [b.id, b]))
  const copy = result.find(b => b.id !== 'a' && b.id !== 'b')
  assert.equal(result.length, 3)
  assert.ok(copy, 'у копии своя идентичность')
  assert.equal(byId.a.row, 0)
  assert.equal(copy.row, 1, 'копия встаёт сразу под оригиналом')
  assert.equal(byId.b.row, 2, 'нижний сосед сдвигается')
  copy.data.items[0].v = 'Два'
  assert.equal(blocks[0].data.items[0].v, 'Один')
})
test('metadata form preserves description, date, cover and custom scheme', () => {
  assert.equal(typeof model.wishlistForm, 'function')
  const data = model.wishlistForm({ title: 'Мой', description: 'Описание', cover: 'https://example.com/a.png', eventDate: '2027-01-01T10:00:00Z', occasion: 'ДР', location: { name: 'Дом', link: '', time: '' }, settings: { colorScheme: 'custom', customScheme: { base: 'light', accent: '#D2553A' }, showGiftAvailability: true, presentsLayout: 'grid2' } })
  assert.equal(data.get('description'), 'Описание')
  assert.equal(data.get('eventDate'), '2027-01-01T10:00:00Z')
  assert.equal(data.get('settings[customScheme][accent]'), '#D2553A')
  assert.equal(data.get('cover_url'), 'https://example.com/a.png')
})
