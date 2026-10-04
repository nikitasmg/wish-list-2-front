const { test } = require('node:test')
const assert = require('node:assert/strict')
const { audit, RULES } = require('./token-audit.cjs')

// Весь код на токенах (docs/design-system.md): нарушение роняет прогон.
const TODO = false

for (const rule of Object.keys(RULES)) {
  test(`дизайн-система: ${rule}`, { todo: TODO }, () => {
    const found = audit().filter(f => f.rule === rule)
    assert.deepEqual(found.map(f => `${f.file}:${f.line} ${f.match}`), [])
  })
}

const hits = sample => Object.entries(RULES).filter(([, re]) => new RegExp(re.source).test(sample)).map(([r]) => r)

test('сторож ловит нарушения', () => {
  const found = hits('text-[13px] text-sm rounded-lg rounded rounded-[10px] shadow-md shadow-[0_1px] p-[3px] px-11 leading-[1.05] transition-all duration-200 #fff rgba(0,0,0,.5) text-amber-500')
  for (const rule of Object.keys(RULES)) assert.ok(found.includes(rule), rule)
})

test('сторож не трогает токены', () => {
  assert.deepEqual(hits('text-body text-primary text-white rounded-control rounded-t-sheet rounded-full rounded-block rounded-tag rounded-none shadow-float shadow-none p-0.5 px-3.5 gap-18 duration-base transition-colors'), [])
})

test('сторож не путает HTML-сущности и id с цветом', () => {
  assert.deepEqual(hits('&#8203; href="#gifts" #main'), [])
})
