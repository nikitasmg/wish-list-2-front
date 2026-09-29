'use client'
import { Block } from '@/shared/types'
import { BLOCK_CATALOG, localDateTime } from '@/shared/editor-model'
import { Input } from '@/components/ui/input'
import { BlockFields } from './block-fields'
export function BlockInspector({ block, onChange }: { block?: Block; onChange: (block: Block) => void }) {
  if (!block) return <p className="p-6 text-sm text-muted-foreground">Выберите блок на странице или добавьте новый из библиотеки.</p>
  const info = BLOCK_CATALOG.find(item => item.type === block.type)
  const change = (patch: Partial<Block>) => onChange({ ...block, ...patch })
  return <div className="space-y-5 p-4"><h2 className="font-bold">{info?.label ?? 'Старый блок'}</h2>
    <label className="block space-y-1 text-sm"><span>Подпись</span><Input value={block.caption ?? ''} onChange={e => change({ caption: e.target.value })} /></label>
    <label className="block space-y-1 text-sm"><span>Заголовок</span><Input value={block.title ?? ''} onChange={e => change({ title: e.target.value })} /></label>
    {info?.views && <label className="block space-y-1 text-sm"><span>Вид</span><select className="w-full rounded-lg border bg-background p-2" value={block.view ?? info.views[0][0]} onChange={e => change({ view: e.target.value })}>{info.views.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
    <BlockFields key={block.id} block={block} onChange={data => change({ data })} />
    <div className="border-t pt-4 space-y-3"><label className="flex gap-2 text-sm"><input type="checkbox" checked={!block.hidden} onChange={e => change({ hidden: !e.target.checked })} />Показывать на странице</label><label className="block space-y-1 text-sm"><span>Секрет до даты</span><Input type="datetime-local" value={localDateTime(block.revealAt)} onChange={e => change({ revealAt: e.target.value ? new Date(e.target.value).toISOString() : null })} /></label></div>
  </div>
}
