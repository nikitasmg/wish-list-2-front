import { MAIN_ORIGIN, SANTA_ORIGIN, safeNext } from './santa-route'

const KEY = 'auth:next'

function allowed(): string[] {
  return [MAIN_ORIGIN, SANTA_ORIGIN].filter(Boolean)
}

/**
 * Запомнить ?next= со страницы входа. Вход через Telegram уходит на /oauth
 * и параметр теряет — поэтому sessionStorage, а не только адресная строка.
 */
export function rememberNext(raw: string | null): void {
  const next = safeNext(raw, allowed())
  try {
    if (next) sessionStorage.setItem(KEY, next)
    else sessionStorage.removeItem(KEY)
  } catch {
    // Приватный режим без хранилища: вернём в кабинет.
  }
}

/** Куда вести после входа; запомненное стирается. */
export function takeNext(fallback = '/wishlist'): string {
  let raw: string | null = null
  try {
    raw = sessionStorage.getItem(KEY)
    sessionStorage.removeItem(KEY)
  } catch {
    raw = null
  }
  return safeNext(raw, allowed()) ?? fallback
}

/** Запомненный адрес возврата без стирания — чтобы не потерять его при ошибке входа. */
export function peekNext(): string | null {
  try {
    return safeNext(sessionStorage.getItem(KEY), allowed())
  } catch {
    return null
  }
}
