// Пружины дизайн-системы для motion (docs/design-system.md). По умолчанию —
// без отскока; отскок только там, где ему предшествовал жест с импульсом
// (шторку смахнули, карточку бросили).
export const spring = {
  default: { type: 'spring', bounce: 0, duration: 0.4 },
  sheet: { type: 'spring', bounce: 0.15, duration: 0.35 },
} as const
