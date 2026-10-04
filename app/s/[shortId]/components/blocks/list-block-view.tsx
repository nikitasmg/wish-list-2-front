import { Block } from '@/shared/types'
import { cn } from '@/lib/utils'
export type ListItem = { k?: string; t?: string; v: string }
export function ListBlockView({ block }: { block: Block }) {
  const items = (Array.isArray(block.data.items) ? block.data.items : []) as ListItem[]
  const view = block.view ?? 'tags'
  return <div className={cn(view === 'tags' ? 'flex flex-wrap gap-2' : view === 'tiles' ? 'grid grid-cols-2 gap-3' : 'space-y-0')}>
    {items.map((item, i) => <div key={i} className={cn(view === 'tags' && 'rounded-full border px-4 py-2 text-body-sm', view === 'tiles' && 'rounded-block border bg-card p-5', ['pairs', 'schedule'].includes(view) && 'flex justify-between gap-6 border-b py-4', view === 'timeline' && 'relative border-l-2 border-primary pl-6 pb-6')}>
      {(item.k || item.t) && <p className="text-body-sm text-muted-foreground">{view === 'schedule' || view === 'timeline' ? item.t || item.k : item.k || item.t}</p>}
      <p className={cn('whitespace-pre-wrap break-words', block.data.strike === true && 'line-through text-muted-foreground', view === 'tiles' && 'mt-1 text-title font-bold')}>{item.v}</p>
    </div>)}
  </div>
}
