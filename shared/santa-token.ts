/**
 * Секрет участника без аккаунта — из ответа на вступление или из личной
 * ссылки ?t=. Живёт в localStorage этого браузера; на другом устройстве
 * человек входит по личной ссылке.
 */
const key = (slug: string) => `santa:${slug}`

export function getSantaToken(slug: string): string | null {
  try {
    return localStorage.getItem(key(slug))
  } catch {
    return null
  }
}

export function setSantaToken(slug: string, token: string): void {
  try {
    localStorage.setItem(key(slug), token)
  } catch {
    // Без хранилища участник останется в комнате до перезагрузки страницы.
  }
}

export function clearSantaToken(slug: string): void {
  try {
    localStorage.removeItem(key(slug))
  } catch {
    // нечего стирать
  }
}

export function santaHeaders(slug: string): Record<string, string> {
  const token = getSantaToken(slug)
  return token ? { 'X-Santa-Token': token } : {}
}
