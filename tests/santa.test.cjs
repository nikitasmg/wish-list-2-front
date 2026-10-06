const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load.cjs')

const {
  formatBudget, formatDay, participantsLabel, toRoomInput, roomToFormValues,
  roomSchema, profileSchema, apiErrorMessage, EMPTY_ROOM_FORM,
} = load('shared/santa.ts')

test('бюджет: рубли с неразрывным пробелом или «без лимита»', () => {
  assert.equal(formatBudget(3000), 'до 3 000 ₽')
  assert.equal(formatBudget(500), 'до 500 ₽')
  assert.equal(formatBudget(null), 'без лимита')
})

test('день обмена читается из даты бэка без сдвига пояса', () => {
  assert.equal(formatDay('2026-12-27T00:00:00Z'), '27 декабря')
  assert.equal(formatDay('2026-01-01'), '1 января')
  assert.equal(formatDay(null), null)
  assert.equal(formatDay('мусор'), null)
})

test('участники склоняются', () => {
  assert.equal(participantsLabel(1), '1 участник')
  assert.equal(participantsLabel(3), '3 участника')
  assert.equal(participantsLabel(11), '11 участников')
})

test('форма комнаты → запрос', () => {
  assert.deepEqual(toRoomInput({
    ...EMPTY_ROOM_FORM, title: '  Офис ', budget: '3000', exchangeDate: '2026-12-27', organizerName: ' Никита ',
  }), {
    title: 'Офис', budget: 3000, exchangeDate: '2026-12-27', message: '',
    organizerJoins: true, organizerName: 'Никита', organizerWishes: '',
  })
  assert.equal(toRoomInput({ ...EMPTY_ROOM_FORM, title: 'А', budget: '' }).budget, null)
  assert.equal(toRoomInput({ ...EMPTY_ROOM_FORM, title: 'А', exchangeDate: '' }).exchangeDate, null)
})

test('комната → форма правки', () => {
  const values = roomToFormValues({
    id: '1', ownerId: '2', slug: 's', title: 'Офис', budget: null, exchangeDate: '2026-12-27T00:00:00Z',
    drawAt: null, message: 'Привет', status: 'open', drawnAt: null, createdAt: '', updatedAt: '',
  })
  assert.equal(values.budget, '')
  assert.equal(values.exchangeDate, '2026-12-27')
  assert.equal(values.organizerJoins, false)
})

test('организатору-участнику нужно имя', () => {
  assert.equal(roomSchema.safeParse({ ...EMPTY_ROOM_FORM, title: 'Офис', organizerName: '' }).success, false)
  assert.equal(roomSchema.safeParse({ ...EMPTY_ROOM_FORM, title: 'Офис', organizerJoins: false, organizerName: '' }).success, true)
  assert.equal(roomSchema.safeParse({ ...EMPTY_ROOM_FORM, title: 'Офис', organizerName: 'Н', budget: '3 000' }).success, false)
})

test('бюджет: граница 1 000 000', () => {
  assert.equal(roomSchema.safeParse({ ...EMPTY_ROOM_FORM, title: 'Офис', organizerJoins: false, budget: '1000000' }).success, true)
  assert.equal(roomSchema.safeParse({ ...EMPTY_ROOM_FORM, title: 'Офис', organizerJoins: false, budget: '1000001' }).success, false)
  assert.equal(roomSchema.safeParse({ ...EMPTY_ROOM_FORM, title: 'Офис', organizerJoins: false, budget: '' }).success, true)
})

test('ссылка на вишлист — только http(s)', () => {
  const base = { name: 'Маша', wishes: '' }
  assert.equal(profileSchema.safeParse({ ...base, wishlistUrl: '' }).success, true)
  assert.equal(profileSchema.safeParse({ ...base, wishlistUrl: 'https://prosto-namekni.ru/s/abc' }).success, true)
  assert.equal(profileSchema.safeParse({ ...base, wishlistUrl: 'javascript:alert(1)' }).success, false)
  assert.equal(profileSchema.safeParse({ ...base, name: '   ', wishlistUrl: '' }).success, false)
})

test('текст ошибки берётся из ответа API', () => {
  assert.equal(apiErrorMessage({ response: { data: { error: 'жеребьёвка уже прошла' } } }), 'жеребьёвка уже прошла')
  assert.equal(apiErrorMessage(new Error('x')), 'Что-то пошло не так. Попробуйте ещё раз.')
})
