/**
 * История правок для «Отменить / Повторить».
 *
 * Хранит снимки целиком: раскладка и настройки небольшие, а снимок нельзя
 * применить неправильно — в отличие от обратных операций.
 *
 * Правки с одним ключом подряд склеиваются в шаг: иначе каждая буква в тексте
 * была бы отдельной отменой. Пауза дольше GROUP_MS начинает новый шаг.
 */
const GROUP_MS = 1000

export class History<T> {
  private past: T[] = []
  private future: T[] = []
  private lastKey: string | undefined
  private lastAt = 0

  constructor(private readonly limit = 100) {}

  get canUndo() { return this.past.length > 0 }
  get canRedo() { return this.future.length > 0 }

  /** previous — состояние до правки; key — что правят (поле, операция). */
  record(previous: T, key?: string, now = Date.now()) {
    const merge = key !== undefined && key === this.lastKey && now - this.lastAt < GROUP_MS
    this.lastKey = key
    this.lastAt = now
    this.future = []
    if (merge) return
    this.past.push(previous)
    if (this.past.length > this.limit) this.past.shift()
  }

  undo(current: T): T | undefined {
    const previous = this.past.pop()
    if (previous === undefined) return undefined
    this.future.push(current)
    this.lastKey = undefined
    return previous
  }

  redo(current: T): T | undefined {
    const next = this.future.pop()
    if (next === undefined) return undefined
    this.past.push(current)
    this.lastKey = undefined
    return next
  }
}
