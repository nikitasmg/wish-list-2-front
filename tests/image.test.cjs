const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load.cjs')
const I = load('shared/image.ts')

test('проверка файла: формат и размер', () => {
  assert.equal(I.checkImageFile({ name: 'a.jpg', type: 'image/jpeg', size: 1000 }), null)
  assert.equal(I.checkImageFile({ name: 'IMG_1.HEIC', type: '', size: 1000 }), null, 'HEIC с телефона приходит без type')
  assert.match(I.checkImageFile({ name: 'a.png', type: 'image/png', size: 14.2 * 1024 * 1024 }), /больше 10 МБ/)
  assert.match(I.checkImageFile({ name: 'a.pdf', type: 'application/pdf', size: 10 }), /JPG, PNG, WEBP или HEIC/)
})

test('HEIC узнаётся по типу или расширению', () => {
  assert.equal(I.isHeic({ name: 'x.heic', type: '' }), true)
  assert.equal(I.isHeic({ name: 'x.jpg', type: 'image/heif' }), true)
  assert.equal(I.isHeic({ name: 'x.jpg', type: 'image/jpeg' }), false)
})

test('мегабайты по-русски', () => {
  assert.equal(I.formatMb(2.4 * 1024 * 1024), '2,4')
  assert.equal(I.formatMb(14.2 * 1024 * 1024), '14,2')
})

test('обрезка по центру под пропорцию', () => {
  assert.deepEqual(I.centerCrop(4000, 3000, 1), { x: 500, y: 0, width: 3000, height: 3000 })
  assert.deepEqual(I.centerCrop(1600, 900, 16 / 9), { x: 0, y: 0, width: 1600, height: 900 })
  assert.deepEqual(I.centerCrop(1000, 1000, 16 / 9), { x: 0, y: 219, width: 1000, height: 563 })
})

test('сдвиг и масштаб рамки не выходят за картинку', () => {
  const r = I.cropRect(4000, 3000, 1, 2, 1, 1)
  assert.deepEqual(r, { x: 2500, y: 1500, width: 1500, height: 1500 }, 'зум ×2, рамка прижата к правому нижнему углу')
  const c = I.cropRect(4000, 3000, 1, 1, 0.5, 0.5)
  assert.deepEqual(c, { x: 500, y: 0, width: 3000, height: 3000 })
})
