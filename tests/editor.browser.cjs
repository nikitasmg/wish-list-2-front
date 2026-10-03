// Сценарии конструктора в браузере: вставка через «+», «поставить рядом»,
// отмена, сохранение { blocks, rows }. Все запросы к API подменяются —
// реальные данные не читаются и не пишутся.
//
// Запуск: dev-сервер, затем
//   BASE=http://localhost:3000 PLAYWRIGHT_MODULE=playwright-core node tests/editor.browser.cjs
// Нужен установленный Microsoft Edge (channel msedge).
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const assert = require('node:assert/strict')
const base = process.env.BASE || 'http://localhost:3000'

const wishlist = {
  id: '00000000-0000-0000-0000-000000000001', title: 'Проверка', description: '', cover: '', shortId: 'demo', userId: 'owner',
  blocksVersion: 3, presentsCount: 0, reservedCount: 0, viewsCount: 0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:01Z',
  location: { name: '' }, settings: { colorScheme: 'linen', showGiftAvailability: true },
  rows: [{ columns: 1 }, { columns: 1 }, { columns: 1 }],
  blocks: [
    { id: 'cover', type: 'cover', row: 0, col: 0, colSpan: 1, view: 'center', title: 'Проверка', data: {} },
    { id: 'tags', type: 'list', row: 1, col: 0, colSpan: 1, view: 'tags', caption: 'Интересы', data: { items: [{ v: 'Книги' }] } },
    { id: 'place', type: 'location', row: 2, col: 0, colSpan: 1, caption: 'Место', data: { name: 'Кафе', address: 'ул. Мира, 1' } },
  ],
}

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.addInitScript(() => { try { localStorage.setItem('constructor_tour_seen', 'true') } catch {} })
  await context.addCookies([{ name: 'token', value: 'x', domain: 'localhost', path: '/' }])
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  const saves = []
  let version = 1
  await page.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url()), p = url.pathname
    if (p.includes('/api/v1/')) {
      if (p.endsWith('/auth/me')) return route.fulfill({ json: { user: { id: 'owner', username: 'Тест' } } })
      if (p.endsWith('/blocks') && request.method() === 'PUT') {
        const body = request.postDataJSON()
        saves.push(body)
        Object.assign(wishlist, { blocks: body.blocks, rows: body.rows, updatedAt: `2026-01-01T00:00:${String(++version).padStart(2, '0')}Z` })
        return route.fulfill({ json: { data: wishlist } })
      }
      if (p.endsWith('/presents')) return route.fulfill({ json: { data: [] } })
      return route.fulfill({ json: { data: wishlist } })
    }
    if (url.hostname !== 'localhost' && !url.hostname.endsWith('gstatic.com') && !url.hostname.endsWith('googleapis.com')) return route.abort()
    return route.continue()
  })

  await page.goto(`${base}/wishlist/edit/${wishlist.id}`, { waitUntil: 'load', timeout: 120000 })
  await page.getByRole('button', { name: 'Добавить блок' }).first().waitFor({ timeout: 60000 })

  // 1. Вставка через «+» между обложкой и «Интересами».
  const gap = page.locator('.group\\/gap').nth(1)
  await gap.hover()
  await gap.getByRole('button', { name: 'Вставить блок' }).click()
  await page.getByRole('textbox', { name: 'Найти блок' }).last().fill('цитата')
  await page.getByRole('button', { name: /^Цитата/ }).last().click()
  await page.waitForTimeout(1500)
  let last = saves.at(-1)
  assert.ok(last && Array.isArray(last.rows), 'сохраняется объект { blocks, rows }')
  const quote = last.blocks.find(b => b.type === 'quote')
  assert.equal(quote.row, 1, 'цитата встала между обложкой и интересами')
  console.log('ok вставка через «+»')

  // 2. Перенос «Места» к правому краю «Интересов» — собирается ряд.
  const source = page.locator('article[aria-label="Место"]')
  const target = page.locator('article[aria-label="Интересы"]')
  await source.scrollIntoViewIfNeeded()
  const s = await source.boundingBox()
  await page.mouse.move(s.x + s.width / 2, s.y + 40)
  await page.mouse.down()
  await page.mouse.move(s.x + s.width / 2, s.y + 20, { steps: 4 })
  const t = await target.boundingBox()
  await page.mouse.move(t.x + t.width - 6, t.y + t.height / 2, { steps: 12 })
  await page.waitForTimeout(200)
    await page.mouse.up()
  await page.waitForTimeout(1500)
  last = saves.at(-1)
  const tags = last.blocks.find(b => b.id === 'tags'), place = last.blocks.find(b => b.id === 'place')
  assert.equal(place.row, tags.row, 'место встало в один ряд с интересами')
  assert.equal(place.col, tags.col + 1, 'справа')
  assert.equal(last.rows[tags.row].columns, 2)
  console.log('ok перенос «поставить рядом»')

  // 3. Отмена возвращает раскладку.
  await page.locator('main, body').first().click({ position: { x: 5, y: 5 } }).catch(() => {})
  await page.keyboard.press('Control+z')
  await page.waitForTimeout(1500)
  last = saves.at(-1)
  assert.notEqual(last.blocks.find(b => b.id === 'place').row, last.blocks.find(b => b.id === 'tags').row, 'Ctrl+Z разобрал ряд обратно')
  console.log('ok отмена')

  if (errors.length) console.log('page errors:', errors.slice(0, 3))
  await browser.close()
}
main().catch(e => { console.error('FAIL', e.message); process.exit(1) })
