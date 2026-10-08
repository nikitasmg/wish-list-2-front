const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load.cjs')

const {
  formatBudget, formatDay, participantsLabel, toRoomInput, roomToFormValues,
  roomSchema, profileSchema, apiErrorMessage, EMPTY_ROOM_FORM, isValidSantaSlug, isValidRoomId,
  emailSchema, codeSchema, canRemind, remindAvailableAt, readyCount, channelLabel, telegramActive, remindResultToast,
  toLocalInput, fromLocalInput, formatDrawAt, chatSchema, chatTabLabel, withChatRead,
  santaPromoVisible, serviceWishlistShortId, wishlistOptions, guestWishlistHref, isFromSanta, giftsReadyLabel,
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
    title: 'Офис', budget: 3000, exchangeDate: '2026-12-27', drawAt: null, message: '',
    organizerJoins: true, organizerName: 'Никита', organizerWishes: '',
  })
  assert.equal(toRoomInput({ ...EMPTY_ROOM_FORM, title: 'А', budget: '' }).budget, null)
  assert.equal(toRoomInput({ ...EMPTY_ROOM_FORM, title: 'А', exchangeDate: '' }).exchangeDate, null)
})

test('комната → форма правки', () => {
  const values = roomToFormValues({
    id: '1', ownerId: '2', slug: 's', title: 'Офис', budget: null, exchangeDate: '2026-12-27T00:00:00Z',
    drawAt: null, message: 'Привет', status: 'open', drawnAt: null, drawFailedAt: null, lastRemindedAt: null, createdAt: '', updatedAt: '',
  })
  assert.equal(values.budget, '')
  assert.equal(values.drawAt, '')
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

test('время жеребьёвки: поле формы ↔ ISO без сдвига пояса', () => {
  const iso = new Date(2026, 11, 20, 18, 30).toISOString()
  assert.equal(toLocalInput(iso), '2026-12-20T18:30')
  assert.equal(fromLocalInput('2026-12-20T18:30'), iso)
  assert.equal(toLocalInput(null), '')
  assert.equal(toLocalInput('мусор'), '')
  assert.equal(fromLocalInput(''), null)
  assert.equal(fromLocalInput('мусор'), null)
})

test('время жеребьёвки уходит в запрос и возвращается в форму', () => {
  const iso = new Date(2026, 11, 20, 18, 30).toISOString()
  assert.equal(toRoomInput({ ...EMPTY_ROOM_FORM, title: 'А', drawAt: '2026-12-20T18:30' }).drawAt, iso)
  assert.equal(toRoomInput({ ...EMPTY_ROOM_FORM, title: 'А', drawAt: '' }).drawAt, null)
  const values = roomToFormValues({
    id: '1', ownerId: '2', slug: 's', title: 'Офис', budget: null, exchangeDate: null, drawAt: iso,
    message: '', status: 'open', drawnAt: null, drawFailedAt: null, lastRemindedAt: null, createdAt: '', updatedAt: '',
  })
  assert.equal(values.drawAt, '2026-12-20T18:30')
})

test('подпись времени жеребьёвки', () => {
  assert.equal(formatDrawAt(null), null)
  assert.equal(formatDrawAt('мусор'), null)
  const label = formatDrawAt(new Date(2026, 11, 20, 18, 30).toISOString())
  assert.ok(label.includes('20 декабря'), label)
  assert.ok(label.includes('18:30'), label)
})

test('сообщение чата: от 1 до 1000 символов', () => {
  assert.equal(chatSchema.safeParse({ body: 'Какой размер?' }).success, true)
  assert.equal(chatSchema.safeParse({ body: '   ' }).success, false)
  assert.equal(chatSchema.safeParse({ body: 'я'.repeat(1000) }).success, true)
  assert.equal(chatSchema.safeParse({ body: 'я'.repeat(1001) }).success, false)
})

test('подпись вкладки чата со счётчиком', () => {
  assert.equal(chatTabLabel('receiver', null), 'Подопечному')
  assert.equal(chatTabLabel('santa', { fromSanta: 0, fromReceiver: 3 }), 'Моему Санте')
  assert.equal(chatTabLabel('santa', { fromSanta: 2, fromReceiver: 0 }), 'Моему Санте · 2 новых')
  assert.equal(chatTabLabel('receiver', { fromSanta: 0, fromReceiver: 1 }), 'Подопечному · 1 новое')
})

test('открытая вкладка чата обнуляет только свой счётчик', () => {
  const me = { name: 'Аня', chat: { fromSanta: 2, fromReceiver: 1 } }
  assert.deepEqual(withChatRead(me, 'santa').chat, { fromSanta: 0, fromReceiver: 1 })
  assert.deepEqual(withChatRead(me, 'receiver').chat, { fromSanta: 2, fromReceiver: 0 })
  assert.equal(withChatRead({ name: 'Аня', chat: null }, 'santa').chat, null)
  assert.equal(me.chat.fromSanta, 2, 'исходный объект не меняется')
})

test('сезон карточки Санты: с 1 октября по 31 декабря', () => {
  assert.equal(santaPromoVisible(new Date(2026, 8, 30, 23, 59)), false)
  assert.equal(santaPromoVisible(new Date(2026, 9, 1, 0, 0)), true)
  assert.equal(santaPromoVisible(new Date(2026, 9, 31, 23, 59)), true)
  assert.equal(santaPromoVisible(new Date(2026, 10, 1, 0, 0)), true)
  assert.equal(santaPromoVisible(new Date(2026, 11, 31, 23, 59)), true)
  assert.equal(santaPromoVisible(new Date(2027, 0, 1, 0, 0)), false)
  assert.equal(santaPromoVisible(new Date(2027, 5, 15)), false)
})

test('короткий id вишлиста сервиса', () => {
  assert.equal(serviceWishlistShortId('https://prosto-namekni.ru/s/abc123'), 'abc123')
  assert.equal(serviceWishlistShortId('https://www.prosto-namekni.ru/s/abc123/'), 'abc123')
  assert.equal(serviceWishlistShortId('https://prosto-namekni.ru/s/abc123?x=1'), 'abc123')
  assert.equal(serviceWishlistShortId('http://prosto-namekni.ru/s/abc123'), 'abc123')
  assert.equal(serviceWishlistShortId('https://prosto-namekni.ru.evil.com/s/abc123'), null)
  assert.equal(serviceWishlistShortId('https://evil.com/s/abc123'), null)
  assert.equal(serviceWishlistShortId('https://prosto-namekni.ru/wishlist/abc'), null)
  assert.equal(serviceWishlistShortId('https://prosto-namekni.ru/s/'), null)
  assert.equal(serviceWishlistShortId('мусор'), null)
  assert.equal(serviceWishlistShortId(''), null)
})

test('свои вишлисты для выбора: только с коротким адресом', () => {
  assert.deepEqual(wishlistOptions([
    { title: 'День рождения', shortId: 'abc' },
    { title: 'Черновик' },
    { title: '  ', shortId: 'def' },
  ], 'https://prosto-namekni.ru'), [
    { title: 'День рождения', url: 'https://prosto-namekni.ru/s/abc' },
    { title: 'Без названия', url: 'https://prosto-namekni.ru/s/def' },
  ])
})

test('гостевая страница вишлиста из конверта', () => {
  assert.equal(guestWishlistHref('abc', 'https://prosto-namekni.ru'), 'https://prosto-namekni.ru/s/abc?from=santa')
  assert.equal(isFromSanta('?from=santa'), true)
  assert.equal(isFromSanta('?x=1&from=santa'), true)
  assert.equal(isFromSanta('?from=other'), false)
  assert.equal(isFromSanta(''), false)
})

test('счётчик готовых подарков', () => {
  assert.equal(giftsReadyLabel(0, 5), 'Подарки готовы у 0 из 5')
  assert.equal(giftsReadyLabel(5, 5), 'Подарки готовы у всех 5')
})
