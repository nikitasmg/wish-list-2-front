const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const postcss = require('postcss')
const tailwind = require('tailwindcss')
const jiti = require('jiti')(path.join(__dirname, 'tailwind-tokens.test.cjs'))

// Собирает CSS для перечисленных классов из настоящего tailwind.config.ts:
// токен, который не породил правило, Tailwind молча выкидывает.
async function css(classes) {
  const config = { ...jiti('../tailwind.config.ts').default, content: [{ raw: classes.join(' ') }] }
  const result = await postcss([tailwind(config)]).process('@tailwind utilities;', { from: undefined })
  return result.css
}

const rule = (out, cls) => {
  const escaped = cls.replace(/[/.]/g, m => '\\\\' + m)
  return out.match(new RegExp(`\\.${escaped} \\{([^}]*)\\}`))?.[1].replace(/\s+/g, ' ').trim()
}

test('смысловые токены порождают CSS', async () => {
  const want = {
    'text-label': 'font-size: 0.8125rem',
    'text-caption': 'letter-spacing: 0',
    'text-display-md': 'font-size: 3.5rem',
    'text-body-lg': 'font-size: 1.25rem',
    'text-title': 'letter-spacing: -0.02em',
    'text-eyebrow': 'letter-spacing: 0.08em',
    'rounded-control': 'border-radius: 10px',
    'rounded-t-sheet': 'border-top-left-radius: 24px',
    'rounded-block-sm': 'calc(var(--radius) - 4px)',
    'h-control': 'height: 2.5rem',
    'size-control-lg': 'width: 3rem',
    'shadow-float': 'var(--shadow-alpha)',
    'duration-base': 'transition-duration: 200ms',
    'ease-out-soft': 'cubic-bezier(.22, 1, .36, 1)',
    'bg-brand': 'linear-gradient(90deg, #17B6D6, #7B5CF0)',
    'bg-overlay': 'var(--overlay)',
    'text-success': 'var(--success)',
    'bg-warning/15': 'var(--warning) / 0.15',
  }
  const out = await css(Object.keys(want))
  for (const [cls, fragment] of Object.entries(want)) {
    const body = rule(out, cls)
    assert.ok(body, `нет правила для ${cls}`)
    assert.ok(body.includes(fragment), `${cls}: ждали «${fragment}», получили «${body}»`)
  }
})
