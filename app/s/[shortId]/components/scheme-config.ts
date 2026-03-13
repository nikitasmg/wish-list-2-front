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
  aurora:   { ...defaultConfig, heroOverlay: 'from-background via-background/70 to-transparent', decorativeEmoji: '🌌' },
  cloud:    { ...defaultConfig, decorativeEmoji: '☁️' },
  cosmic:   { ...defaultConfig, heroOverlay: 'from-background via-background/70 to-transparent', decorativeEmoji: '💜' },
  lavender: { ...defaultConfig, decorativeEmoji: '🪻', cardRounded: 'rounded-3xl' },
  forest:   { ...defaultConfig, heroOverlay: 'from-background via-background/75 to-transparent', decorativeEmoji: '🌿' },
  mint:     { ...defaultConfig, decorativeEmoji: '🌱' },
  ember:    { ...defaultConfig, heroOverlay: 'from-background via-background/70 to-transparent', decorativeEmoji: '🔥' },
  sand:     { ...defaultConfig, decorativeEmoji: '🏜️' },
  crimson:  { ...defaultConfig, heroOverlay: 'from-background via-background/70 to-transparent', decorativeEmoji: '🌹' },
  blush:    { ...defaultConfig, decorativeEmoji: '🌸', cardRounded: 'rounded-3xl' },
}

export const getSchemeConfig = (scheme: string): SchemeConfig =>
  schemeConfigs[scheme] ?? defaultConfig
