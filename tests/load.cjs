const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

// Загрузчик TypeScript-модулей для тестов. Относительные импорты нужны потому,
// что shared-модули тянут друг друга ('./grid', './editor-model'), а простой
// require из tests/ искал бы их рядом с тестом.
const cache = new Map()

function load(file) {
  const key = path.resolve(file)
  if (cache.has(key)) return cache.get(key)

  const source = fs.existsSync(key) ? fs.readFileSync(key, 'utf8') : ''
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const loaded = { exports: {} }
  cache.set(key, loaded.exports)

  const localRequire = id => {
    if (id.startsWith('.')) return load(path.join(path.dirname(key), `${id}.ts`))
    // Алиас проекта: '@/shared/grid' — это shared/grid.ts от корня.
    if (id.startsWith('@/')) return load(path.join(process.cwd(), `${id.slice(2)}.ts`))
    return require(id)
  }

  new Function('exports', 'require', 'module', output)(loaded.exports, localRequire, loaded)
  return loaded.exports
}

globalThis.crypto ??= require('node:crypto').webcrypto

module.exports = { load }
