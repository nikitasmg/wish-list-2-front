import { MessageCircle, Star } from 'lucide-react'

/** Картинка героя: как выглядит конверт участника. Вымышленные данные, без действий. */
export function SampleEnvelope() {
  return (
    <figure className="relative mx-auto w-full max-w-sm" aria-label="Пример: так участник увидит своего подопечного">
      <div aria-hidden className="absolute inset-0 -rotate-6 rounded-sheet border border-border bg-card" />
      <div aria-hidden className="relative flex rotate-2 flex-col gap-5 rounded-sheet border border-border bg-background p-7 shadow-overlay">
        <div className="flex items-center justify-between">
          <span className="text-eyebrow uppercase text-muted-foreground">Новый год в отделе</span>
          <Star className="size-5 text-tone-gold" fill="currentColor" />
        </div>
        <div>
          <p className="text-body text-muted-foreground">Вы — Тайный Санта для</p>
          <p className="mt-1 text-display-sm">Маши К.</p>
        </div>
        <p className="rounded-control-lg bg-card p-4 text-body">
          «Люблю зелёный чай, настолки и всё для рисования. Размер свитера — M»
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="flex h-control-sm items-center rounded-tag bg-tone-pink/15 px-3 text-label font-semibold text-tone-pink">до 3 000 ₽</span>
          <span className="flex h-control-sm items-center rounded-tag bg-tone-gold/15 px-3 text-label font-semibold text-tone-gold">обмен 27 декабря</span>
        </div>
        <span className="flex h-control-lg items-center justify-center gap-2 rounded-control-lg border border-border bg-card text-body font-semibold">
          <MessageCircle className="size-4" />
          Спросить анонимно
        </span>
      </div>
    </figure>
  )
}
