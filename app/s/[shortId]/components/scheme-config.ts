import { CUSTOM_SCHEME, normalizeScheme } from '@/shared/constants'
import { deriveSchemeStyle } from '@/shared/derive-scheme'
import type { Wishlist } from '@/shared/types'
import type { CSSProperties } from 'react'

export type SchemeConfig = {
  /** Tailwind gradient classes for hero overlay (bottom-to-top) */
  heroOverlay: string
  /** Whether to use bold/heavy title weight */
  titleBold: boolean
  /** Card border radius modifier */
  cardRounded: string
  /** Decorative emoji or symbol shown in hero */
  decorativeEmoji: string
}

const defaultConfig: SchemeConfig = {
  heroOverlay: 'from-background via-background/60 to-transparent',
  titleBold: true,
  cardRounded: 'rounded-block',
  decorativeEmoji: '🎁',
}

/**
 * Мелочи, которые не выражаются токенами: насколько плотная заливка у героя,
 * какой скругление у карточек, какой символ-украшение.
 *
 * Ключи совпадают с CSS-классами схем в globals.css.
 */
const schemeConfigs: Record<string, SchemeConfig> = {
  // тёмные
  space:     { ...defaultConfig, heroOverlay: 'from-background via-background/70 to-transparent', decorativeEmoji: '🌌' },
  midnight:  { ...defaultConfig, heroOverlay: 'from-background via-background/70 to-transparent', decorativeEmoji: '🚀', cardRounded: 'rounded-block' },
  graphite:  { ...defaultConfig, heroOverlay: 'from-background via-background/75 to-transparent', decorativeEmoji: '🥃', cardRounded: 'rounded-block' },
  lavender:  { ...defaultConfig, heroOverlay: 'from-background via-background/70 to-transparent', decorativeEmoji: '🪻', cardRounded: 'rounded-block' },
  malachite: { ...defaultConfig, heroOverlay: 'from-background via-background/75 to-transparent', decorativeEmoji: '🌿', cardRounded: 'rounded-block' },
  lagoon:    { ...defaultConfig, heroOverlay: 'from-background via-background/70 to-transparent', decorativeEmoji: '🌊' },
  // светлые
  powder:    { ...defaultConfig, decorativeEmoji: '🌸', cardRounded: 'rounded-block' },
  linen:     { ...defaultConfig, decorativeEmoji: '🕊️', cardRounded: 'rounded-block-sm' },
  pastel:    { ...defaultConfig, decorativeEmoji: '🎈' },
}

/** Старые значения colorScheme сначала переводятся в новые (normalizeScheme). */
export const getSchemeConfig = (scheme: string): SchemeConfig =>
  schemeConfigs[normalizeScheme(scheme)] ?? defaultConfig

/**
 * Класс и инлайновые переменные схемы для содержимого порталов.
 *
 * Диалоги Radix рендерятся в document.body, вне обёртки страницы, поэтому
 * тему им нужно передать явно. Одной строкой класса не обойтись: у «своей
 * схемы» класса нет вовсе — её цвета живут в CSS-переменных, — а у старых
 * вишлистов в colorScheme лежит имя, которого в globals.css уже нет.
 */
export type SchemeTheme = { className: string; style?: CSSProperties }

export function schemeTheme(settings: Wishlist['settings']): SchemeTheme {
  const scheme = normalizeScheme(settings.colorScheme)
  return scheme === CUSTOM_SCHEME
    ? { className: '', style: deriveSchemeStyle(settings.customScheme) }
    : { className: scheme }
}
