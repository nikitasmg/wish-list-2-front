const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load.cjs')

const { santaHref, resolveSantaRoute, needsLogin, safeNext, loginUrl } = load('shared/santa-route.ts')

const ORIGIN = 'https://santa.prosto-namekni.ru'

test('ссылка внутри Санты: на поддомене без префикса, в разработке с /santa', () => {
  assert.equal(santaHref('/', ''), '/')
  assert.equal(santaHref('/rooms', ''), '/rooms')
  assert.equal(santaHref('/', '/santa'), '/santa')
  assert.equal(santaHref('/r/AbCd2345', '/santa'), '/santa/r/AbCd2345')
})

test('поддомен переписывается на /santa', () => {
  assert.deepEqual(resolveSantaRoute('santa.prosto-namekni.ru', '/', ORIGIN), { type: 'rewrite', pathname: '/santa' })
  assert.deepEqual(resolveSantaRoute('santa.prosto-namekni.ru', '/rooms/1', ORIGIN), { type: 'rewrite', pathname: '/santa/rooms/1' })
})

test('префикс на поддомене не удваивается', () => {
  assert.deepEqual(resolveSantaRoute('santa.prosto-namekni.ru', '/santa/rooms', ORIGIN), { type: 'redirect', url: `${ORIGIN}/rooms` })
})

test('/santa на основном домене уводит на поддомен, если он настроен', () => {
  assert.deepEqual(resolveSantaRoute('prosto-namekni.ru', '/santa', ORIGIN), { type: 'redirect', url: `${ORIGIN}/` })
  assert.deepEqual(resolveSantaRoute('prosto-namekni.ru', '/santa/r/x', ORIGIN), { type: 'redirect', url: `${ORIGIN}/r/x` })
  assert.deepEqual(resolveSantaRoute('localhost:3000', '/santa/rooms', ''), { type: 'next' })
  assert.deepEqual(resolveSantaRoute('prosto-namekni.ru', '/santaclaus', ORIGIN), { type: 'next' })
  assert.deepEqual(resolveSantaRoute('prosto-namekni.ru', '/wishlist', ORIGIN), { type: 'next' })
})

test('вход нужен кабинету вишлистов и комнатам организатора', () => {
  assert.equal(needsLogin('/wishlist'), true)
  assert.equal(needsLogin('/wishlist/1'), true)
  assert.equal(needsLogin('/santa/rooms'), true)
  assert.equal(needsLogin('/santa/rooms/new'), true)
  assert.equal(needsLogin('/santa'), false)
  assert.equal(needsLogin('/santa/r/AbCd2345'), false)
})

test('после входа ведём только к себе', () => {
  const allowed = ['https://prosto-namekni.ru', ORIGIN]
  assert.equal(safeNext('/wishlist', allowed), '/wishlist')
  assert.equal(safeNext(`${ORIGIN}/rooms/new`, allowed), `${ORIGIN}/rooms/new`)
  assert.equal(safeNext('//evil.com', allowed), null)
  assert.equal(safeNext('/\\evil.com', allowed), null)
  assert.equal(safeNext('https://evil.com/x', allowed), null)
  assert.equal(safeNext('javascript:alert(1)', allowed), null)
  assert.equal(safeNext('', allowed), null)
  assert.equal(safeNext(null, allowed), null)
})

test('ссылка на вход несёт адрес возврата', () => {
  assert.equal(
    loginUrl(`${ORIGIN}/rooms?a=1`, 'https://prosto-namekni.ru'),
    'https://prosto-namekni.ru/login?next=https%3A%2F%2Fsanta.prosto-namekni.ru%2Frooms%3Fa%3D1',
  )
})
