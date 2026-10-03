import type { SystemTemplate } from './types'

/**
 * Имя виновника праздника в текстах шаблона.
 *
 * Шаблоны пишут {name} только там, где имя стоит в именительном падеже
 * («Стол забронирован на имя: {name}»), поэтому подстановка не ломает
 * грамматику. Бэк подставляет то же самое при создании вишлиста — здесь
 * это нужно для превью, чтобы человек сразу видел свои тексты.
 */

const PLACEHOLDER = '{name}'

export function usesName(template: SystemTemplate): boolean {
  return JSON.stringify(template.blocks).includes(PLACEHOLDER)
}

/** Копия шаблона с подставленным именем; без имени — имя-пример. */
export function withName(template: SystemTemplate, name = ''): SystemTemplate {
  const value = name.trim() || template.sampleName || ''
  if (!value || !usesName(template)) return template
  // Имя вставляется внутрь JSON-строк — экранируем так же, как это сделал бы JSON.
  const escaped = JSON.stringify(value).slice(1, -1)
  const blocks = JSON.parse(JSON.stringify(template.blocks).split(PLACEHOLDER).join(escaped))
  return { ...template, blocks }
}
