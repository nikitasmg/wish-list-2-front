'use client'

import { useState } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Copy, Trash2 } from 'lucide-react'
import { Block, Present, Wishlist } from '@/shared/types'
import { BLOCK_CATALOG, addBlockAfter, duplicateBlock, makeBlock } from '@/shared/editor-model'
import { BlockContent } from '@/app/s/[shortId]/components/blocks/block-renderer'
import { InlineTextEditor } from './inline-text-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Props = { wishlist: Wishlist; presents: Present[]; selected?: string; onSelect: (id: string) => void; onChange: (blocks: Block[]) => void }
export function BlockCanvas({ wishlist, presents, selected, onSelect, onChange }: Props) {
  const [search, setSearch] = useState('')
  const [mobile, setMobile] = useState(false)
  const blocks = wishlist.blocks ?? []
  const display = mobile ? [...blocks].sort((a,b) => (a.mobilePosition ?? a.position) - (b.mobilePosition ?? b.position)) : blocks
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const sync = (next: Block[]) => onChange(next.map((b, position) => ({ ...b, position })))
  const catalog = BLOCK_CATALOG.filter(b => b.label.toLocaleLowerCase('ru').includes(search.toLocaleLowerCase('ru')))
  return <div className="min-w-0 space-y-5">
    <details className="rounded-xl border p-4" open={blocks.length === 0}>
      <summary className="cursor-pointer font-semibold">Добавить блок</summary>
      <Input className="mt-3" aria-label="Поиск блоков" placeholder="Поиск блоков" value={search} onChange={e => setSearch(e.target.value)} />
      {Array.from(new Set(catalog.map(b => b.group))).map(group => <div key={group} className="mt-4 space-y-2"><p className="text-xs uppercase tracking-wide text-muted-foreground">{group}</p><div className="flex flex-wrap gap-2">{catalog.filter(b => b.group === group).map(item => <Button key={item.type} variant="outline" size="sm" onClick={() => { const block = makeBlock(item.type, blocks.length); sync([...blocks, block]); onSelect(block.id) }}>{item.label}</Button>)}</div></div>)}
      {!catalog.length && <p className="py-4 text-sm text-muted-foreground">Ничего не найдено</p>}
    </details>
    <div className="flex justify-end gap-2"><Button size="sm" variant={!mobile ? 'default' : 'outline'} onClick={() => setMobile(false)}>Десктоп</Button><Button size="sm" variant={mobile ? 'default' : 'outline'} onClick={() => setMobile(true)}>Телефон</Button></div>
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
      if (!over || active.id === over.id) return
      const from = display.findIndex(b => b.id === active.id), to = display.findIndex(b => b.id === over.id)
      if (from < 0 || to < 0) return
      const next = arrayMove(display, from, to)
      sync(mobile ? blocks.map(b => ({ ...b, mobilePosition: next.findIndex(item => item.id === b.id) })) : next)
    }}>
      <SortableContext items={display.map(b => b.id)} strategy={rectSortingStrategy}>
        <div className={cn('grid gap-4 items-start', mobile ? 'max-w-[390px] mx-auto' : 'grid-cols-1 md:grid-cols-2')}>
          {display.map(block => <CanvasItem key={block.id} block={block} mobile={mobile} selected={selected === block.id} onSelect={() => onSelect(block.id)}
            onDuplicate={() => { const next = duplicateBlock(blocks, block.id); sync(next); onSelect(next[blocks.findIndex(b => b.id === block.id) + 1].id) }}
            onDelete={() => { if (window.confirm('Удалить блок? Ответы гостей для него больше не будут видны на странице.')) sync(blocks.filter(b => b.id !== block.id)) }}
            onResize={() => sync(blocks.map(b => b.id === block.id ? { ...b, colSpan: b.colSpan === 1 ? 2 : 1 } : b))}
          >{block.type === 'text'
            // Текст правится прямо на холсте: открывать панель ради одной
            // опечатки — лишний шаг, а текстовых блоков на странице больше
            // всех остальных вместе взятых.
            ? <InlineTextEditor
                html={String(block.data.html ?? block.data.content ?? '')}
                onChange={html => sync(blocks.map(b => b.id === block.id ? { ...b, data: { ...b.data, html } } : b))}
                onSplit={() => { const next = addBlockAfter(blocks, block.id, 'text'); sync(next); onSelect(next[next.findIndex(b => b.id === block.id) + 1].id) }}
              />
            : <BlockContent block={{ ...block, hidden: false, revealAt: null }} wishlist={wishlist} presents={presents} preview />
          }</CanvasItem>)}
        </div>
      </SortableContext>
    </DndContext>
  </div>
}

function CanvasItem({ block, mobile, selected, onSelect, onDuplicate, onDelete, onResize, children }: {
  block: Block; mobile: boolean; selected: boolean; onSelect: () => void; onDuplicate: () => void; onDelete: () => void; onResize: () => void; children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id })
  return <article ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn('min-w-0 rounded-2xl border bg-card p-3', !mobile && block.colSpan !== 1 && 'md:col-span-2', selected && 'ring-2 ring-primary', block.hidden && 'opacity-60')}>
    <div className="mb-3 flex flex-wrap items-center gap-1 border-b pb-2">
      <button type="button" {...attributes} {...listeners} aria-label="Переместить блок" className="touch-none cursor-grab rounded p-2"><GripVertical size={16} /></button>
      <button type="button" onClick={onSelect} className="flex-1 text-left text-sm font-semibold">{BLOCK_CATALOG.find(b => b.type === block.type)?.label ?? 'Старый блок'}{block.hidden && ' · скрыт'}{block.revealAt && ' · секрет'}</button>
      {!mobile && <Button size="sm" variant="ghost" onClick={onResize}>{block.colSpan === 1 ? '½' : '1/1'}</Button>}
      <Button size="sm" variant="ghost" aria-label="Дублировать блок" onClick={onDuplicate}><Copy size={14} /></Button>
      <Button size="sm" variant="ghost" aria-label="Удалить блок" onClick={onDelete}><Trash2 size={14} /></Button>
    </div>
    <div onClick={onSelect} className="cursor-pointer"><div className="pointer-events-none select-none" inert>{children}</div></div>
    <Button size="sm" variant="ghost" className="mt-3 w-full" onClick={onSelect}>Настроить блок</Button>
  </article>
}
