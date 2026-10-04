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
const { quizSteps, titleSuggestions, eventDateTime, parseAge, yearsWord, personName } = load('shared/create-quiz.ts')

test('у «Просто списка» нет ни имени, ни даты, ни места, ни шаблона', () => {
  assert.deepEqual(quizSteps('list'), ['occasion', 'title'])
  assert.deepEqual(quizSteps('bday'), ['occasion', 'who', 'title', 'when', 'where', 'look'])
  assert.deepEqual(quizSteps(null), ['occasion', 'who', 'title', 'when', 'where', 'look'])
})

test('названия-подсказки — в именительном падеже, без склонения имени', () => {
  assert.deepEqual(
    titleSuggestions('bday', { name: ' Маша ', name2: '', age: 30 }),
    ['Маша, 30!', 'Маша · 30 лет', 'Мой день рождения'],
  )
  assert.deepEqual(titleSuggestions('kids', { name: 'Тёма', name2: '', age: 1 })[1], 'Тёма · 1 год')
  assert.deepEqual(titleSuggestions('wedding', { name: 'Аня', name2: 'Лев' }), ['Аня и Лев', 'Наша свадьба'])
  assert.deepEqual(titleSuggestions('party', { name: 'Саша', name2: '' }), ['Вечеринка · Саша', 'Вечеринка'])
})

test('без имени остаются только общие подсказки', () => {
  assert.deepEqual(titleSuggestions('bday', { name: '', name2: '', age: 30 }), ['Мой день рождения'])
  assert.ok(titleSuggestions('list', { name: '', name2: '' }).length >= 2)
})

test('пара — два имени через «и», одно имя — как есть', () => {
  assert.equal(personName('wedding', { name: 'Аня ', name2: ' Лев' }), 'Аня и Лев')
  assert.equal(personName('wedding', { name: 'Аня', name2: '' }), 'Аня')
  assert.equal(personName('bday', { name: 'Маша', name2: 'лишнее' }), 'Маша')
})

test('дата со временем — местное время, без времени — полдень', () => {
  const withTime = new Date(eventDateTime('2026-11-14', '19:30'))
  assert.equal(withTime.getFullYear(), 2026)
  assert.equal(withTime.getMonth(), 10)
  assert.equal(withTime.getDate(), 14)
  assert.equal(withTime.getHours(), 19)
  assert.equal(withTime.getMinutes(), 30)

  assert.equal(new Date(eventDateTime('2026-11-14', '')).getHours(), 12)
  assert.equal(eventDateTime('', '19:00'), undefined)
  assert.equal(eventDateTime('14.11.2026', ''), undefined)
})

test('возраст — целое от 1 до 150, иначе не указан', () => {
  assert.equal(parseAge('30'), 30)
  assert.equal(parseAge(' 7 '), 7)
  assert.equal(parseAge(''), undefined)
  assert.equal(parseAge('0'), undefined)
  assert.equal(parseAge('151'), undefined)
  assert.equal(parseAge('3а'), undefined)
})

test('склонение «год/года/лет» помнит про 11–14', () => {
  assert.equal(yearsWord(1), 'год')
  assert.equal(yearsWord(3), 'года')
  assert.equal(yearsWord(11), 'лет')
  assert.equal(yearsWord(21), 'год')
  assert.equal(yearsWord(64), 'года')
})
