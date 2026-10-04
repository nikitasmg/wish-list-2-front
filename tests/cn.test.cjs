const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load.cjs')
const { cn } = load('lib/utils.ts')

test('кегль-токен и цвет текста не вытесняют друг друга', () => {
  assert.equal(cn('text-body', 'text-primary'), 'text-body text-primary')
  assert.equal(cn('text-label text-muted-foreground'), 'text-label text-muted-foreground')
})

test('два кегля — побеждает последний', () => {
  assert.equal(cn('text-body', 'text-label'), 'text-label')
  assert.equal(cn('text-body-lg', 'text-primary'), 'text-body-lg text-primary')
  assert.equal(cn('text-sm', 'text-title'), 'text-title')
})

test('скругления, тени, высоты, длительности сливаются по группам', () => {
  assert.equal(cn('rounded-control', 'rounded-card'), 'rounded-card')
  assert.equal(cn('rounded-t-sheet', 'rounded-t-card'), 'rounded-t-card')
  assert.equal(cn('shadow-float', 'shadow-overlay'), 'shadow-overlay')
  assert.equal(cn('h-control', 'h-control-lg'), 'h-control-lg')
  assert.equal(cn('size-control', 'size-control-sm'), 'size-control-sm')
  assert.equal(cn('duration-fast', 'duration-slow'), 'duration-slow')
  assert.equal(cn('ease-out-soft', 'ease-in-out'), 'ease-in-out')
})

test('цвета success/warning/overlay — это цвета, а не размеры', () => {
  assert.equal(cn('text-body', 'text-success'), 'text-body text-success')
  assert.equal(cn('bg-overlay', 'bg-card'), 'bg-card')
})
