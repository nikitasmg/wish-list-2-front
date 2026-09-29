import { CustomScheme } from '@/shared/types'
import type { CSSProperties } from 'react'

/**
 * «Своя схема»: из базы и одного акцента выводятся остальные токены.
 *
 * Функция одна на весь проект и вызывается и из конструктора, и со страницы
 * гостя. Если бы превью считало цвета само, оно бы рано или поздно разошлось
 * с настоящей страницей — а именно по превью человек и выбирает акцент.
 *
 * Готовые схемы живут CSS-классами в globals.css; своя — единственная, где
 * значения приходят из данных, поэтому она отдаётся инлайновыми переменными.
 */

type HSL = { h: number; s: number; l: number }

export function hexToHsl(hex: string): HSL | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) return null

  const int = parseInt(match[1], 16)
  const r = ((int >> 16) & 255) / 255
  const g = ((int >> 8) & 255) / 255
  const b = (int & 255) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) return { h: 0, s: 0, l: l * 100 }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h: number
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6

  return { h: h * 360, s: s * 100, l: l * 100 }
}

const hsl = ({ h, s, l }: HSL) => `${round(h)} ${round(s)}% ${round(l)}%`
const round = (n: number) => Math.round(n * 10) / 10
const clamp = (n: number) => Math.min(100, Math.max(0, n))

/**
 * Токены своей схемы в виде инлайновых CSS-переменных.
 *
 * Фон и карточки берут тон акцента на минимальной насыщенности: чистый серый
 * рядом с цветным акцентом выглядит случайным, а подкрашенный — выбранным.
 */
export function deriveSchemeStyle(scheme: CustomScheme | undefined): CSSProperties | undefined {
  if (!scheme) return undefined

  const accent = hexToHsl(scheme.accent)
  if (!accent) return undefined

  const dark = scheme.base !== 'light'

  // Акцент — единственное, что задаёт человек, поэтому вокруг него всё и
  // строится; текст на акценте подбираем по его светлоте, иначе на светло-
  // жёлтой кнопке окажется белая надпись.
  const onAccent: HSL = accent.l > 60
    ? { h: accent.h, s: Math.min(accent.s, 60), l: 12 }
    : { h: 0, s: 0, l: 100 }

  const tokens: Record<string, HSL> = dark
    ? {
        background: { h: accent.h, s: 18, l: 8 },
        foreground: { h: accent.h, s: 14, l: 95 },
        card: { h: accent.h, s: 16, l: 12 },
        'card-foreground': { h: accent.h, s: 14, l: 95 },
        popover: { h: accent.h, s: 16, l: 12 },
        'popover-foreground': { h: accent.h, s: 14, l: 95 },
        primary: accent,
        'primary-foreground': onAccent,
        secondary: { h: accent.h, s: 14, l: 19 },
        'secondary-foreground': { h: accent.h, s: 14, l: 95 },
        muted: { h: accent.h, s: 14, l: 18 },
        'muted-foreground': { h: accent.h, s: 10, l: 62 },
        accent,
        'accent-foreground': onAccent,
        border: { h: accent.h, s: 14, l: 20 },
        input: { h: accent.h, s: 14, l: 20 },
        ring: accent,
      }
    : {
        background: { h: accent.h, s: 24, l: 97 },
        foreground: { h: accent.h, s: 18, l: 14 },
        card: { h: 0, s: 0, l: 100 },
        'card-foreground': { h: accent.h, s: 18, l: 14 },
        popover: { h: 0, s: 0, l: 100 },
        'popover-foreground': { h: accent.h, s: 18, l: 14 },
        primary: accent,
        'primary-foreground': onAccent,
        secondary: { h: accent.h, s: 22, l: 93 },
        'secondary-foreground': { h: accent.h, s: 18, l: 14 },
        muted: { h: accent.h, s: 22, l: 94 },
        'muted-foreground': { h: accent.h, s: 10, l: 42 },
        accent,
        'accent-foreground': onAccent,
        border: { h: accent.h, s: 20, l: 89 },
        input: { h: accent.h, s: 20, l: 89 },
        ring: accent,
      }

  const style: Record<string, string> = {}
  for (const [name, value] of Object.entries(tokens)) {
    style[`--${name}`] = hsl({ ...value, l: clamp(value.l) })
  }
  // destructive не выводим из акцента: красный должен оставаться красным,
  // даже если человек выбрал мятный.
  style['--destructive'] = dark ? '0 63% 45%' : '0 72% 51%'
  style['--destructive-foreground'] = dark ? '0 0% 96%' : '0 0% 100%'
  style['--radius'] = '0.875rem'

  return style as CSSProperties
}
