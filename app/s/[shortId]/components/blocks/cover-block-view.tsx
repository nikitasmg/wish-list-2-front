import { CardCover } from '@/components/card-cover'
import { cn } from '@/lib/utils'
import { Block, Wishlist } from '@/shared/types'
export function CoverBlockView({ block, wishlist }: { block: Block; wishlist?: Wishlist }) {
  const image = String(block.data.imageUrl ?? '')
  const view = block.view ?? 'center'
  const title = block.title || wishlist?.title || 'Ваш праздник'
  return <div className={cn('relative isolate overflow-hidden rounded-3xl px-6 py-14', view === 'left' ? 'text-left' : 'text-center')}>
    {view === 'photo' && image && <><CardCover cover={image} className="absolute inset-0 h-full rounded-none" /><div className="absolute inset-0 bg-background/80" /></>}
    <div className="relative space-y-6">
      {image && view !== 'photo' && <CardCover cover={image} title={title} className={cn('mx-auto h-52 max-w-xs', view === 'circle' && 'size-44 rounded-full', view === 'arch' && 'h-72 rounded-t-[10rem]')} />}
      {block.caption && <p className="text-sm font-semibold text-primary">{block.caption}</p>}
      {view === 'number' && <div className="text-8xl font-extrabold tracking-tighter text-primary">{String(block.data.number ?? '')}</div>}
      <h1 className="text-4xl font-extrabold leading-tight tracking-tight [overflow-wrap:anywhere] lg:text-6xl">{title}</h1>
      {Boolean(block.data.subtitle) && <p className="mx-auto max-w-xl text-lg text-muted-foreground whitespace-pre-wrap">{String(block.data.subtitle)}</p>}
    </div>
  </div>
}
