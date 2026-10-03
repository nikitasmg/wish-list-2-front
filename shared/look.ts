import type { CSSProperties } from 'react'
import { CUSTOM_SCHEME, normalizeScheme } from './constants'
import { deriveSchemeStyle } from './derive-scheme'
import type { BackgroundPattern, HeadingFont, Wishlist } from './types'

/**
 * «Оформление» страницы: схема, шрифт заголовков, узор фона.
 *
 * Одна функция на конструктор и страницу гостя — иначе холст рано или поздно
 * разошёлся бы с тем, что увидят гости.
 */

export const HEADING_FONTS: { value: HeadingFont; name: string; family: string }[] = [
  { value: 'accent', name: 'Акцидент', family: 'var(--font-unbounded)' },
  { value: 'strict', name: 'Строгий', family: 'var(--font-manrope)' },
  { value: 'soft', name: 'Мягкий', family: 'var(--font-comfortaa)' },
  { value: 'poster', name: 'Плакат', family: 'var(--font-oswald)' },
  { value: 'elegant', name: 'Изящный', family: 'var(--font-cormorant)' },
  { value: 'classic', name: 'Классика', family: 'var(--font-playfair)' },
]

export const PATTERNS: { value: BackgroundPattern; name: string }[] = [
  { value: 'none', name: 'Нет' },
  { value: 'stars', name: 'Звёзды' },
  { value: 'confetti', name: 'Конфетти' },
  { value: 'lines', name: 'Линии' },
]

/** Пустое значение у вишлистов до «Оформления» — строгий, как было всегда. */
export function headingFont(settings: Wishlist['settings']): HeadingFont {
  return settings.headingFont || 'strict'
}

export function backgroundPattern(settings: Wishlist['settings']): BackgroundPattern {
  return settings.pattern || 'none'
}

/** Класс и стиль страницы вишлиста: схема, шрифт, узор. */
export function pageLook(settings: Wishlist['settings']): { className: string; style?: CSSProperties } {
  const scheme = normalizeScheme(settings.colorScheme)
  const classes = [
    'wishlist-page',
    scheme !== CUSTOM_SCHEME ? scheme : '',
    `look-font-${headingFont(settings)}`,
    `look-pattern-${backgroundPattern(settings)}`,
  ]
  return {
    className: classes.filter(Boolean).join(' '),
    style: scheme === CUSTOM_SCHEME ? deriveSchemeStyle(settings.customScheme) : undefined,
  }
}

/** Только цвета схемы — для поповеров, которые рендерятся вне страницы. */
export function schemeLook(settings: Wishlist['settings']): { className: string; style?: CSSProperties } {
  const scheme = normalizeScheme(settings.colorScheme)
  return {
    className: scheme !== CUSTOM_SCHEME ? scheme : '',
    style: scheme === CUSTOM_SCHEME ? deriveSchemeStyle(settings.customScheme) : undefined,
  }
}
