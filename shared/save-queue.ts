/** Only one request at a time. Errors pause the queue without discarding edits. */
export class SaveQueue<T> {
  private pending: { value: T } | undefined
  private running = false
  private stopped = false
  error: unknown = null
  constructor(private save: (value: T) => Promise<void>, private changed: () => void = () => {}) {}
  get dirty() { return this.running || Boolean(this.pending) }
  get saving() { return this.running }
  push(value: T) { this.pending = { value }; return this.drain() }
  retry() { this.error = null; return this.drain() }
  stop() { this.stopped = true }
  start() { this.stopped = false }
  private async drain() {
    if (this.running || this.error || this.stopped) return
    this.running = true; this.changed()
    try {
      while (this.pending && !this.stopped) {
        const current = this.pending
        this.pending = undefined
        try { await this.save(current.value) }
        catch (error) { this.pending ??= current; this.error = error; break }
      }
    } finally { this.running = false; this.changed() }
  }
}
