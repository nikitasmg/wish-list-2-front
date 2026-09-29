const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
function load(file) {
  const source = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const loaded = { exports: {} }
  new Function('exports', 'require', 'module', output)(loaded.exports, require, loaded)
  return loaded.exports
}
const { pluralRu, eventTiming, formatEventDate, searchWishlists } = load('shared/event-date.ts')

// Даты строим в местном времени: «завтра» и «14 ноября» человек видит по
// своему календарю, поэтому проверки с суффиксом Z зависели бы от того, в
// каком поясе запущены тесты.
const local = (year, month, day, hour = 12) => new Date(year, month - 1, day, hour)
const iso = (...args) => local(...args).toISOString()

const now = local(2026, 9, 29)

test('русское склонение считается по последним цифрам, а не по одной', () => {
  const days = ['день', 'дня', 'дней']
  assert.equal(pluralRu(1, days), 'день')
  assert.equal(pluralRu(2, days), 'дня')
  assert.equal(pluralRu(5, days), 'дней')
  // 11–14 — исключение: «одиннадцать дней», а не «день»
  assert.equal(pluralRu(11, days), 'дней')
  assert.equal(pluralRu(12, days), 'дней')
  assert.equal(pluralRu(14, days), 'дней')
  assert.equal(pluralRu(21, days), 'день')
  assert.equal(pluralRu(22, days), 'дня')
  assert.equal(pluralRu(25, days), 'дней')
  assert.equal(pluralRu(0, days), 'дней')
})

test('до праздника считаются календарные дни, а не сутки', () => {
  // Разница меньше суток, но дата завтрашняя — значит «завтра», а не «сегодня».
  assert.deepEqual(eventTiming(iso(2026, 9, 30, 9), now), { label: 'завтра', past: false })
  assert.deepEqual(eventTiming(iso(2026, 9, 29, 23), now), { label: 'сегодня', past: false })
  assert.deepEqual(eventTiming(iso(2026, 11, 17), now), { label: 'через 49 дней', past: false })
  assert.deepEqual(eventTiming(iso(2026, 10, 1), now), { label: 'через 2 дня', past: false })
})

test('прошедший праздник помечается, а не показывает отрицательные дни', () => {
  assert.deepEqual(eventTiming(iso(2026, 9, 28), now), { label: 'прошёл', past: true })
  assert.deepEqual(eventTiming(iso(2025, 1, 1), now), { label: 'прошёл', past: true })
})

test('без даты и с мусором вместо даты timing пустой', () => {
  assert.equal(eventTiming(null, now), null)
  assert.equal(eventTiming(undefined, now), null)
  assert.equal(eventTiming('', now), null)
  assert.equal(eventTiming('не дата', now), null)
})

test('год показывается только когда он не текущий', () => {
  assert.equal(formatEventDate(iso(2026, 11, 14, 19), now), '14 ноября')
  assert.equal(formatEventDate(iso(2027, 6, 6, 15), now), '6 июня 2027')
  assert.equal(formatEventDate(null, now), '')
})

test('поиск не зависит от регистра и лишних пробелов', () => {
  const lists = [
    { id: '1', title: 'Маше — 30!', occasion: 'День рождения' },
    { id: '2', title: 'Новый год у Смирновых', occasion: 'Новый год' },
    { id: '3', title: 'Аня и Лев', occasion: 'Свадьба' },
  ]
  assert.deepEqual(searchWishlists(lists, '  маше ').map(w => w.id), ['1'])
  assert.deepEqual(searchWishlists(lists, 'НОВЫЙ').map(w => w.id), ['2'])
  // Повод тоже ищется: человек помнит «свадьба», а не «Аня и Лев»
  assert.deepEqual(searchWishlists(lists, 'свадьб').map(w => w.id), ['3'])
  assert.equal(searchWishlists(lists, '').length, 3)
  assert.equal(searchWishlists(lists, '   ').length, 3)
  assert.equal(searchWishlists(lists, 'ничего').length, 0)
})

const { localNoon } = load('shared/event-date.ts')

test('дата из поля «дата» остаётся местной, а не уезжает в UTC', () => {
  const iso = localNoon('2026-11-14')
  const back = new Date(iso)
  // Именно 14-е по местному календарю: new Date('2026-11-14') дал бы
  // полночь UTC, и западнее Гринвича праздник съехал бы на 13-е.
  assert.equal(back.getFullYear(), 2026)
  assert.equal(back.getMonth(), 10)
  assert.equal(back.getDate(), 14)
})

test('пустая и битая дата не превращаются в мусор', () => {
  assert.equal(localNoon(''), undefined)
  assert.equal(localNoon('не дата'), undefined)
  assert.equal(localNoon(undefined), undefined)
})
