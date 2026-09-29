import { normalizeScheme } from '@/shared/constants'

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
  cardRounded: 'rounded-2xl',
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
  midnight:  { ...defaultConfig, heroOverlay: 'from-background via-background/70 to-transparent', decorativeEmoji: '🚀', cardRounded: 'rounded-2xl' },
  graphite:  { ...defaultConfig, heroOverlay: 'from-background via-background/75 to-transparent', decorativeEmoji: '🥃', cardRounded: 'rounded-lg' },
  lavender:  { ...defaultConfig, heroOverlay: 'from-background via-background/70 to-transparent', decorativeEmoji: '🪻', cardRounded: 'rounded-3xl' },
  malachite: { ...defaultConfig, heroOverlay: 'from-background via-background/75 to-transparent', decorativeEmoji: '🌿', cardRounded: 'rounded-xl' },
  lagoon:    { ...defaultConfig, heroOverlay: 'from-background via-background/70 to-transparent', decorativeEmoji: '🌊' },
  // светлые
  powder:    { ...defaultConfig, decorativeEmoji: '🌸', cardRounded: 'rounded-3xl' },
  linen:     { ...defaultConfig, decorativeEmoji: '🕊️', cardRounded: 'rounded-md' },
  pastel:    { ...defaultConfig, decorativeEmoji: '🎈' },
}

/** Старые значения colorScheme сначала переводятся в новые (normalizeScheme). */
export const getSchemeConfig = (scheme: string): SchemeConfig =>
  schemeConfigs[normalizeScheme(scheme)] ?? defaultConfig
