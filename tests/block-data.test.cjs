const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load.cjs')
const D = load('shared/block-data.ts')

test('цвета дресс-кода: старые строки и новые объекты', () => {
  assert.deepEqual(D.dressColors({ colors: ['#FFD166', { hex: '#3B6FD8', name: 'Синий' }] }), [
    { hex: '#FFD166', name: '' },
    { hex: '#3B6FD8', name: 'Синий' },
  ])
  assert.deepEqual(D.dressColors({ colors: [{ hex: 'red; }' }] }), [], 'не цвет — выбрасываем: значение уходит в CSS')
  assert.deepEqual(D.dressColors({}), [])
})

test('точки места: старые поля — первая точка, points — остальные', () => {
  const points = D.locationPoints({ name: 'Дворец', address: 'Малышева, 44', points: [{ name: 'Сосны', address: 'загородный клуб' }] })
  assert.deepEqual(points.map(p => p.name), ['Дворец', 'Сосны'])
  assert.deepEqual(D.locationPoints({}), [])
})

test('маршрут: своя ссылка важнее адреса, две точки — маршрут через обе', () => {
  assert.equal(D.routeUrl([{ name: '', address: 'Ленина 24', link: 'https://2gis.ru/x' }]), 'https://2gis.ru/x')
  assert.match(D.routeUrl([{ name: '', address: 'Ленина 24' }]), /yandex\.ru\/maps\/\?text=/)
  assert.match(D.routeUrl([{ name: '', address: 'А' }, { name: '', address: 'Б' }]), /rtext=%D0%90~%D0%91/)
})

test('контакты: старые поля — первый человек', () => {
  const people = D.contactPeople({ name: 'Катя', role: 'мама', people: [{ name: 'Лена', telegram: '@lena' }] })
  assert.deepEqual(people.map(p => p.name), ['Катя', 'Лена'])
})

test('«Написать»: телеграм, иначе телефон', () => {
  assert.equal(D.contactLink({ name: '', telegram: '@lena' }), 'https://t.me/lena')
  assert.equal(D.contactLink({ name: '', phone: '+7 999 123-45-67' }), 'tel:+79991234567')
  assert.equal(D.contactLink({ name: '' }), undefined)
})

test('настройки голосования по умолчанию', () => {
  const s = D.pollSettings({ question: 'Торт?', options: ['Да', 'Нет'] })
  assert.equal(s.multiple, false)
  assert.equal(s.results, 'all')
  assert.deepEqual(s.options.map(o => o.id), ['0', '1'])
})

test('настройки ответа гостя: дедлайн до конца дня', () => {
  const s = D.rsvpSettings({ deadline: '2026-10-10', fields: ['kids'] })
  assert.equal(s.fields.includes('kids'), true)
  assert.equal(D.rsvpClosed(s, new Date('2026-10-10T20:00:00Z')), false, 'весь день 10-го ещё можно')
  assert.equal(D.rsvpClosed(s, new Date('2026-10-11T12:00:00Z')), true)
})
