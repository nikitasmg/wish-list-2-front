import { CardCover } from '@/components/card-cover'
import { Block } from '@/shared/types'
import { ImageIcon } from 'lucide-react'

/** «16:9» → «16 / 9» для CSS aspect-ratio. Мусор — пропорция по умолчанию. */
export function aspectRatio(value: unknown, fallback: string): string {
  const match = typeof value === 'string' ? /^(\d+):(\d+)$/.exec(value) : null
  return match ? `${match[1]} / ${match[2]}` : fallback
}

export function MediaBlockView({ block }: { block: Block }) {
  const images = (Array.isArray(block.data.images) ? block.data.images : []) as string[]
  const captions = (Array.isArray(block.data.captions) ? block.data.captions : []) as string[]
  const visible = block.view === 'row' ? images.slice(0, 3) : images.slice(0, 1)
  // Высоту фото задаёт ручка на холсте; без неё одно фото — 16:9, ряд — 4:5.
  const ratio = aspectRatio(block.data.aspect, block.view === 'row' ? '4 / 5' : '16 / 9')
  if (!visible.length) return <CardCover cover="" className="w-full rounded-2xl" style={{ aspectRatio: ratio }} />
  return <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))` }}>
    {visible.map((url, i) => <figure key={i} className="min-w-0">
      {url
        ? <CardCover cover={url} title={captions[i] ?? ''} className="h-auto w-full rounded-2xl" style={{ aspectRatio: ratio }} />
        // Пустое место под фото из шаблона — ещё не загружено, а не сломано.
        : <div className="flex w-full items-center justify-center rounded-2xl bg-muted text-muted-foreground" style={{ aspectRatio: ratio }}><ImageIcon size={28} strokeWidth={1.4} aria-hidden /></div>}
      {captions[i] && <figcaption className="mt-2 text-sm text-muted-foreground">{captions[i]}</figcaption>}
    </figure>)}
  </div>
}
