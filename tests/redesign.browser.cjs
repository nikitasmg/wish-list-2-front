// Run with a local dev server on :3112. All backend requests are intercepted;
// no user accounts or production data are read or modified.
const assert = require('node:assert/strict')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.addCookies([{ name: 'token', value: 'local-ui-fixture', domain: 'localhost', path: '/' }])
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  let version = 1, writes = 0, metaWrites = 0, conflict = false
  const bumpVersion = () => `2026-01-01T00:00:${String(++version).padStart(2, '0')}Z`
  // Значение поля из multipart-тела: разбирать форму целиком ради одного
  // заголовка незачем.
  const field = (body, name) => (body.match(new RegExp(`name="${name}"\\r?\\n\\r?\\n([\\s\\S]*?)\\r?\\n--`)) || [])[1]
  let wishlist = { id: '00000000-0000-0000-0000-000000000001', title: 'Тестовый праздник', description: '', cover: '', shortId: 'demo', userId: 'owner', blocksVersion: 2, presentsCount: 0, reservedCount: 0, viewsCount: 0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:01Z', location: { name: '' }, settings: { colorScheme: 'linen', showGiftAvailability: false }, blocks: [
    { id: 'cover', type: 'cover', position: 0, colSpan: 2, view: 'center', title: 'Праздник начинается', data: { subtitle: 'Ждём друзей' } },
    { id: 'list', type: 'list', position: 1, colSpan: 2, view: 'tags', data: { items: [{ v: 'Улыбки' }, { v: 'Танцы' }] } },
    { id: 'gifts', type: 'wishlist', position: 2, colSpan: 2, title: 'Мои подарки', view: 'cards', data: {} },
    { id: 'poll', type: 'poll', position: 3, colSpan: 2, data: { question: 'Будет весело?', options: ['Да', 'Конечно'] } },
    { id: 'secret', type: 'text', position: 4, colSpan: 2, revealAt: '2030-01-01T00:00:00Z', data: {} },
    { id: 'hidden', type: 'text', position: 5, hidden: true, data: { html: '<p>Скрытый текст</p>' } },
  ] }
  await page.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname
    if (['fetch', 'xhr'].includes(request.resourceType()) && !path.startsWith('/_next/') && !request.headers()['rsc']) {
      let data = null
      if (path.endsWith('/auth/me')) return route.fulfill({ json: { user: { id: 'owner', username: 'Тест' } } })
      if (path.endsWith('/blocks') && request.method() === 'PUT') {
        writes++
        // Главная проверка версионирования: после сохранения настроек здесь
        // должна прийти та версия, которую вернул PUT настроек, а не та, что
        // была у клиента до него.
        assert.equal(request.headers()['if-match'], wishlist.updatedAt)
        if (conflict) return route.fulfill({ status: 409, json: { error: 'conflict', data: wishlist } })
        wishlist = { ...wishlist, blocks: request.postDataJSON(), updatedAt: bumpVersion() }
        data = wishlist
      } else if (/\/wishlists\/[^/]+$/.test(path) && request.method() === 'PUT') {
        // Настройки: отдельный запрос, который не трогает блоки и возвращает
        // собственную сохранённую версию.
        metaWrites++
        assert.equal(request.headers()['if-match'], wishlist.updatedAt)
        wishlist = { ...wishlist, title: field(request.postData() || '', 'title') ?? wishlist.title, updatedAt: bumpVersion() }
        data = wishlist
      } else if (path.endsWith('/presents')) data = []
      else if (path.endsWith('/poll')) data = { votes: [1, 0], total: 1, myVote: null }
      else if (path.endsWith('/wishlists')) data = [wishlist]
      else if (path.includes('/wishlists/')) data = wishlist
      return route.fulfill({ json: { data } })
    }
    if (url.hostname !== 'localhost') return route.abort()
    return route.continue()
  })
  try {
    await page.goto(`http://localhost:3112/wishlist/edit/${wishlist.id}`)
    await page.getByRole('heading', { name: 'Тестовый праздник' }).waitFor()
    await page.getByRole('button', { name: 'Настроить блок' }).first().click()
    await page.getByLabel('Заголовок', { exact: true }).fill('Обновлённая обложка')
    await page.getByRole('status').filter({ hasText: 'Сохранено' }).waitFor()
    assert.equal(wishlist.blocks[0].title, 'Обновлённая обложка')
    await page.getByRole('button', { name: 'Дублировать блок' }).nth(1).click()
    await page.getByRole('status').filter({ hasText: 'Сохранено' }).waitFor()
    assert.equal(new Set(wishlist.blocks.map(b => b.id)).size, wishlist.blocks.length)
    assert.equal(wishlist.blocks.length, 7)
    await page.getByRole('navigation', { name: 'Настройки страницы' }).getByRole('button', { name: 'Страница', exact: true }).click()
    const beforeMetadata = writes
    await page.getByLabel('Название', { exact: true }).fill('Локальная тема')
    await page.getByRole('status').filter({ hasText: 'Сохранено' }).waitFor()
    assert.equal(wishlist.title, 'Локальная тема', 'настройки сохраняются')
    assert.equal(metaWrites, 1)
    assert.ok(writes > beforeMetadata, 'блоки уходят следом, уже с новой версией')
    await page.getByRole('button', { name: 'Предпросмотр', exact: true }).click()
    assert.equal(await page.getByText('Скрытый текст', { exact: true }).count(), 0)
    assert.equal(await page.getByText('Мои подарки', { exact: true }).count(), 1)
    await page.getByText('Пока это секрет', { exact: true }).waitFor()
    if (process.env.QA_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.QA_SCREENSHOT_DIR}/redesign-desktop.png`, fullPage: true })
    const before = writes
    await page.getByRole('button', { name: 'Страница', exact: true }).first().click()
    await page.getByRole('button', { name: 'Настроить блок' }).first().click()
    conflict = true
    await page.getByLabel('Заголовок', { exact: true }).fill('Локальный черновик')
    await page.getByRole('status').filter({ hasText: 'Конфликт' }).waitFor()
    assert.equal(writes, before + 1)
    assert.equal(await page.getByLabel('Заголовок', { exact: true }).inputValue(), 'Локальный черновик')
    // Public page on a phone, no real API requests.
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('http://localhost:3112/s/demo')
    await page.getByRole('heading', { name: 'Обновлённая обложка' }).waitFor()
    await page.getByText('Будет весело?', { exact: true }).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
    if (process.env.QA_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.QA_SCREENSHOT_DIR}/redesign-mobile.png`, fullPage: true })
    assert.deepEqual(errors, [])
    console.log('PASS: editor autosave, stable duplicate IDs, metadata safety gate, preview, hidden/secret blocks, 409 draft preservation, mobile public rendering')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
