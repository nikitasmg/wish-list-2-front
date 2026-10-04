const fs = require('node:fs')
const path = require('node:path')

// Правила дизайн-системы (docs/design-system.md): только смысловые токены.
// Каждое правило — регулярка по строкам файла. Файлы-данные с палитрами
// исключены из правила цвета.
const SPACING = String.raw`-?(?:p[xytblrse]?|m[xytblrse]?|gap(?:-[xy])?|space-[xy])`
const RULES = {
  'стоковый кегль': /(?<![\w-])text-(?:xs|sm|base|lg|[2-9]?xl)(?![\w-])/g,
  // Только px/rem/em: text-[38cqmin] — масштаб от контейнера, а не кегль.
  'произвольный кегль': /(?<![\w-])text-\[\d[\d.]*(?:px|rem|em)\]/g,
  'стоковое скругление': /(?<![\w-])rounded(?:-(?:t|r|b|l|s|e|tl|tr|br|bl|ss|se|es|ee))?(?:-(?:sm|md|lg|xl|2xl|3xl))?(?![\w[-])/g,
  'произвольное скругление': /(?<![\w-])rounded(?:-[a-z]{1,2})?-\[/g,
  'стоковая тень': /(?<![\w-])shadow(?:-(?:sm|md|lg|xl|2xl|inner))?(?![\w[-])/g,
  'произвольная тень': /(?<![\w-])shadow-\[/g,
  'произвольный отступ': new RegExp(String.raw`(?<![\w-])${SPACING}-\[`, 'g'),
  'шаг отступа вне шкалы': new RegExp(String.raw`(?<![\w-])${SPACING}-(?:11|13|15|17|19|22|36|40|44|48|52|56|60|64|72|80|96)(?![\w.-])`, 'g'),
  'произвольный трекинг/интерлиньяж': /(?<![\w-])(?:tracking|leading)-\[/g,
  'transition-all': /(?<![\w-])transition-all(?![\w-])/g,
  'длительность числом': /(?<![\w-])duration-\d+(?![\w-])/g,
  'цвет в коде': /(?<![&\w])#[0-9a-fA-F]{3,8}(?![\w-])|rgba?\(/g,
}

// Палитры схем и заготовки цвета — это данные, а не оформление.
const DATA_FILES = new Set([
  'shared/constants.ts', 'shared/derive-scheme.ts', 'shared/look.ts',
  'app/wishlist/components/colors-select.tsx', 'app/layout.tsx', 'app/manifest.ts',
  // Цвета дресс-кода и конфетти — данные пользователя и частиц.
  'shared/create-quiz.ts', 'shared/editor-model.ts', 'app/s/[shortId]/components/confetti.ts',
])

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  if (fs.statSync(dir).isFile()) return [dir.split(path.sep).join('/')]
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.(tsx?|mdx)$/.test(e.name)) out.push(p.split(path.sep).join('/'))
  }
  return out
}

function audit(dirs = ['app', 'components', 'shared']) {
  const found = []
  for (const file of dirs.flatMap(d => walk(d))) {
    fs.readFileSync(file, 'utf8').split('\n').forEach((text, i) => {
      for (const [rule, re] of Object.entries(RULES)) {
        if (rule === 'цвет в коде' && DATA_FILES.has(file)) continue
        for (const m of text.matchAll(re)) found.push({ rule, file, line: i + 1, match: m[0] })
      }
    })
  }
  return found
}

module.exports = { audit, RULES }

// node tests/token-audit.cjs app/wishlist — нарушения по зоне
if (require.main === module) {
  const args = process.argv.slice(2)
  const quiet = args.includes('--summary')
  const found = audit(args.filter(a => a !== '--summary').length ? args.filter(a => a !== '--summary') : undefined)
  if (!quiet) for (const f of found) console.log(`${f.file}:${f.line}  ${f.rule}  ${f.match}`)
  const byRule = {}
  for (const f of found) byRule[f.rule] = (byRule[f.rule] || 0) + 1
  console.log(byRule, 'всего', found.length)
}
