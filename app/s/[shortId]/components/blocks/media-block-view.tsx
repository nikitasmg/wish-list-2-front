import { CardCover } from '@/components/card-cover'
import { Block } from '@/shared/types'
export function MediaBlockView({ block }: { block: Block }) {
  const images = (Array.isArray(block.data.images) ? block.data.images : []) as string[]
  const captions = (Array.isArray(block.data.captions) ? block.data.captions : []) as string[]
  const visible = block.view === 'row' ? images.slice(0, 3) : images.slice(0, 1)
  if (!visible.length) return <CardCover cover="" className="h-52" />
  return <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))` }}>{visible.map((url, i) => <figure key={i} className="min-w-0"><CardCover cover={url} title={captions[i] ?? ''} className="h-52" />{captions[i] && <figcaption className="mt-2 text-sm text-muted-foreground">{captions[i]}</figcaption>}</figure>)}</div>
}
