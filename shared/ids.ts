/**
 * Идентификатор блока.
 *
 * crypto.randomUUID доступен только в защищённом контексте: по http с
 * LAN-адреса — а именно так редактор и открывают, когда проверяют его на
 * телефоне, — он бросает TypeError и роняет весь конструктор, а не одно
 * действие. Запасной вариант уникален в пределах страницы, и этого хватает:
 * дальше id всё равно уезжает на сервер вместе с остальными блоками.
 */
export function newBlockId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
