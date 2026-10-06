/**
 * Где живёт Тайный Санта. На проде — поддомен santa.prosto-namekni.ru и пути
 * без префикса (NEXT_PUBLIC_SANTA_BASE=''). В разработке — /santa на основном
 * адресе: кука входа с localhost не доходит до santa.localhost.
 */
export const SANTA_BASE = process.env.NEXT_PUBLIC_SANTA_BASE ?? '/santa'
export const SANTA_ORIGIN = process.env.NEXT_PUBLIC_SANTA_ORIGIN ?? ''
export const MAIN_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ||'https://prosto-namekni.ru'

/** Путь страницы Санты с учётом того, где он живёт. */
export function santaHref(path: string, base: string = SANTA_BASE): string {
  if (!base) return path
  return path === '/' ? base : `${base}${path}`
}

export type SantaRoute =
  | { type: 'next' }
  | { type: 'rewrite'; pathname: string }
  | { type: 'redirect'; url: string }

const PREFIX = '/santa'

function isSantaPath(pathname: string): boolean {
  return pathname === PREFIX || pathname.startsWith(`${PREFIX}/`)
}

/** Что сделать с запросом: переписать поддомен на /santa, увести на поддомен или пропустить. */
export function resolveSantaRoute(host: string, pathname: string, santaOrigin: string): SantaRoute {
  if (host.startsWith('santa.')) {
    // Старая ссылка с префиксом на поддомене — убрать префикс, а не удвоить.
    if (isSantaPath(pathname)) return { type: 'redirect', url: `${santaOrigin}${pathname.slice(PREFIX.length) || '/'}` }
    return { type: 'rewrite', pathname: pathname === '/' ? PREFIX : `${PREFIX}${pathname}` }
  }
  if (santaOrigin && isSantaPath(pathname)) {
    return { type: 'redirect', url: `${santaOrigin}${pathname.slice(PREFIX.length) || '/'}` }
  }
  return { type: 'next' }
}

export function needsLogin(pathname: string): boolean {
  return pathname.startsWith('/wishlist') || pathname === '/santa/rooms' || pathname.startsWith('/santa/rooms/')
}

/** Адрес возврата после входа — только свой: иначе ссылка на вход стала бы открытым редиректом. */
export function safeNext(raw: string | null | undefined, allowedOrigins: string[]): string | null {
  if (!raw) return null
  // «//evil.com» и «/\evil.com» браузер читает как адрес другого сайта.
  // Управляющие символы и обратный слэш: парсер URL выкидывает табы и переводы строк,
  // так что «/<TAB>/evil.com» превращается в «//evil.com».
  if (/[\u0000-\u001F\u007F\\]/.test(raw)) return null
  if (raw.startsWith('/')) {
    if (raw.startsWith('//')) return null
    const base = allowedOrigins[0] ?? MAIN_ORIGIN
    try {
      const url = new URL(raw, base)
      return url.origin === new URL(base).origin ? `${url.pathname}${url.search}${url.hash}` : null
    } catch {
      return null
    }
  }
  try {
    const url = new URL(raw)
    return allowedOrigins.includes(url.origin) ? url.toString() : null
  } catch {
    return null
  }
}

export function loginUrl(returnTo: string, mainOrigin: string = MAIN_ORIGIN): string {
  return `${mainOrigin}/login?next=${encodeURIComponent(returnTo)}`
}
