const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load.cjs')

const {
  formatBudget, formatDay, participantsLabel, toRoomInput, roomToFormValues,
  roomSchema, profileSchema, apiErrorMessage, EMPTY_ROOM_FORM, isValidSantaSlug, isValidRoomId,
  emailSchema, codeSchema, canRemind, remindAvailableAt, readyCount, channelLabel, telegramActive, remindResultToast,
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

test('адрес комнаты: ровно 8 латинских букв и цифр', () => {
  assert.equal(isValidSantaSlug('AbCd2345'), true)
  for (const bad of ['', 'abc', 'AbCd23456', '..%2Frooms', '../rooms/x', 'AbCd234?', 'АбВгДеЁж', 'AbCd 345', 'AbCd234\n']) {
    assert.equal(isValidSantaSlug(bad), false, bad)
  }
})

test('id комнаты: только UUID', () => {
  assert.equal(isValidRoomId('3f2b8c1e-9d4a-4e7b-8a61-0c5d2e9f1a77'), true)
  assert.equal(isValidRoomId('3F2B8C1E-9D4A-4E7B-8A61-0C5D2E9F1A77'), true)
  for (const bad of ['', '123', '../x', '3f2b8c1e-9d4a-4e7b-8a61-0c5d2e9f1a7', '3f2b8c1e-9d4a-4e7b-8a61-0c5d2e9f1a77/draw', '3f2b8c1e9d4a4e7b8a610c5d2e9f1a77']) {
    assert.equal(isValidRoomId(bad), false, bad)
  }
})

test('почта и код: проверка формы', () => {
  assert.equal(emailSchema.safeParse({ email: 'anna@example.com' }).success, true)
  assert.equal(emailSchema.safeParse({ email: 'не адрес' }).success, false)
  assert.equal(emailSchema.safeParse({ email: '' }).success, false)
  assert.equal(codeSchema.safeParse({ code: '042137' }).success, true)
  assert.equal(codeSchema.safeParse({ code: ' 042137 ' }).success, true)
  assert.equal(codeSchema.safeParse({ code: '42137' }).success, false)
  assert.equal(codeSchema.safeParse({ code: 'abcdef' }).success, false)
})

test('напомнить можно раз в 12 часов', () => {
  const at = '2026-11-20T10:00:00Z'
  const base = Date.parse(at)
  assert.equal(canRemind(null), true)
  assert.equal(canRemind(at, base + 11 * 3600e3), false)
  assert.equal(canRemind(at, base + 12 * 3600e3), true)
  assert.equal(remindAvailableAt(null), null)
  assert.equal(remindAvailableAt(at).getTime(), base + 12 * 3600e3)
})

test('готовые к жеребьёвке и подпись канала', () => {
  assert.equal(readyCount([{ ready: true }, { ready: false }, { ready: true }]), 2)
  const base = { channel: '', email: '', emailVerified: false, emailPending: false, telegram: false, ready: false }
  assert.equal(channelLabel({ ...base, channel: 'telegram', telegram: true, ready: true }), 'в Telegram')
  assert.equal(channelLabel({ ...base, channel: 'email', email: 'a@b.ru', emailVerified: true, ready: true }), 'на почту a@b.ru')
  assert.equal(channelLabel(base), '')
})

test('Telegram подключён, только пока он текущий канал', () => {
  const base = { channel: '', email: '', emailVerified: false, emailPending: false, telegram: false, ready: false }
  assert.equal(telegramActive({ ...base, channel: 'telegram', telegram: true, ready: true }), true)
  // Перешли на почту — чат остался, но вернуться к Telegram можно.
  assert.equal(telegramActive({ ...base, channel: 'email', email: 'a@b.ru', emailVerified: true, telegram: true, ready: true }), false)
  assert.equal(telegramActive(base), false)
})

test('тост «Напомнить» зависит от того, кому ушло', () => {
  assert.deepEqual(remindResultToast(2, 0), { title: 'Напомнили: 2 участника', description: undefined })
  assert.deepEqual(remindResultToast(1, 3), { title: 'Напомнили: 1 участник', description: 'Ещё 3 участника без почты и Telegram.' })
  assert.equal(remindResultToast(0, 1).title, 'Напоминать пока некому: у 1 участника не подключён канал')
  assert.equal(remindResultToast(0, 5).title, 'Напоминать пока некому: у 5 участников не подключён канал')
  assert.deepEqual(remindResultToast(0, 0), { title: 'Всем уже есть что подарить' })
})
