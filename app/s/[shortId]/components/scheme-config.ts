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

const schemeConfigs: Record<string, SchemeConfig> = {
  main:         { ...defaultConfig, decorativeEmoji: '🎉' },
  dark:         { ...defaultConfig, heroOverlay: 'from-background via-background/70 to-transparent', decorativeEmoji: '✨' },
  pink:         { ...defaultConfig, decorativeEmoji: '🌸', cardRounded: 'rounded-3xl' },
  green:        { ...defaultConfig, decorativeEmoji: '🌿' },
  blue:         { ...defaultConfig, decorativeEmoji: '💙' },
  'dark-blue':  { ...defaultConfig, heroOverlay: 'from-background via-background/70 to-transparent', decorativeEmoji: '🌊' },
  monochrome:   { ...defaultConfig, cardRounded: 'rounded-none', decorativeEmoji: '◼' },
  'dark-brown': { ...defaultConfig, heroOverlay: 'from-background via-background/75 to-transparent', decorativeEmoji: '☕' },
  rainbow:      { ...defaultConfig, decorativeEmoji: '🌈', cardRounded: 'rounded-3xl' },
  'dark-rainbow': { ...defaultConfig, heroOverlay: 'from-background via-background/70 to-transparent', decorativeEmoji: '🌈' },
}

export const getSchemeConfig = (scheme: string): SchemeConfig =>
  schemeConfigs[scheme] ?? defaultConfig
