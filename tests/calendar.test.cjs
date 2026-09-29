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
const { googleCalendarUrl, buildIcs, calendarEvent } = load('lib/calendar.ts')

const event = {
  title: 'Маше — 30!',
  description: 'Приходите, будет тепло',
  location: 'Лофт «Веранда», ул. Малышева, 51',
  start: '2026-11-14T16:00:00.000Z',
}

test('время уходит в UTC в базовом формате — иначе календари читают его как местное', () => {
  const ics = buildIcs(event)
  assert.match(ics, /DTSTART:20261114T160000Z/)
  // Конец по умолчанию — через три часа: без DTEND событие в части
  // календарей становится на весь день.
  assert.match(ics, /DTEND:20261114T190000Z/)
})

test('ics экранирует запятые, точки с запятой и переносы строк', () => {
  const ics = buildIcs({ ...event, description: 'Первая строка\nВторая; с точкой, и запятой\\слэш' })
  const line = ics.split('\r\n').find(l => l.startsWith('DESCRIPTION:'))
  assert.equal(line, 'DESCRIPTION:Первая строка\\nВторая\\; с точкой\\, и запятой\\\\слэш')
  // Адрес с запятой не должен разваливать поле на два
  assert.match(ics, /LOCATION:Лофт «Веранда»\\, ул. Малышева\\, 51/)
})

test('ics — это CRLF и обязательные границы календаря', () => {
  const ics = buildIcs(event)
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'))
  assert.ok(ics.trimEnd().endsWith('END:VCALENDAR'))
  assert.match(ics, /VERSION:2\.0/)
  assert.match(ics, /BEGIN:VEVENT/)
  assert.match(ics, /UID:/)
})

test('ссылка на google несёт диапазон дат и закодированный текст', () => {
  const url = new URL(googleCalendarUrl(event))
  assert.equal(url.origin + url.pathname, 'https://calendar.google.com/calendar/render')
  assert.equal(url.searchParams.get('action'), 'TEMPLATE')
  assert.equal(url.searchParams.get('text'), 'Маше — 30!')
  assert.equal(url.searchParams.get('dates'), '20261114T160000Z/20261114T190000Z')
  assert.equal(url.searchParams.get('location'), 'Лофт «Веранда», ул. Малышева, 51')
})

test('без даты события календарь не предлагается', () => {
  assert.equal(calendarEvent({ title: 'Без даты', eventDate: null, location: {} }), null)
  assert.equal(calendarEvent({ title: 'Мусор', eventDate: 'не дата', location: {} }), null)
})

test('дата берётся из eventDate, а место — из location', () => {
  const built = calendarEvent({
    title: 'Маше — 30!',
    description: 'Ждём',
    eventDate: '2026-11-14T16:00:00.000Z',
    location: { name: 'Лофт «Веранда»', time: '2020-01-01T00:00:00.000Z' },
  })
  assert.equal(built.start, '2026-11-14T16:00:00.000Z')
  assert.equal(built.location, 'Лофт «Веранда»')
  assert.equal(built.title, 'Маше — 30!')
})

test('когда eventDate пуст, дату подхватывает location.time', () => {
  const built = calendarEvent({
    title: 'Старый вишлист',
    eventDate: null,
    location: { name: 'Кафе', time: '2026-12-31T18:00:00.000Z' },
  })
  assert.equal(built.start, '2026-12-31T18:00:00.000Z')
})
