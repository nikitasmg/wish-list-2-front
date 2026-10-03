'use client'

import { blockIcon } from '@/app/wishlist/components/constructor/block-icons'
import { cn } from '@/lib/utils'
import { BLOCK_CATALOG } from '@/shared/editor-model'
import { Layout, layoutRows, replaceBlock } from '@/shared/layout'
import { Block } from '@/shared/types'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { Columns2, Eye, EyeOff, GripVertical, Lock } from 'lucide-react'
import * as React from 'react'
import type { DragData, DropData, Selection } from './block-canvas'

/**
 * «Структура»: страница списком. Ряды раскрываются в свои блоки, глаз прячет
 * блок, строку можно перетащить — промежутки между строками принимают блок так
 * же, как промежутки на холсте.
 */
export function StructurePanel({ layout, selection, onSelect, onLayout }: {
  layout: Layout
  selection: Selection
  onSelect: (selection: Selection) => void
  onLayout: (layout: Layout, key?: string) => void
}) {
  const rows = layoutRows(layout)
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.map(row => {
          const blocks = row.cells.filter((cell): cell is Block => Boolean(cell))
          const multi = (row.settings.columns ?? 1) > 1
          return (
            <React.Fragment key={row.index}>
              <StructureGap at={row.index} />
              {multi && (
                <button
                  type="button"
                  onClick={() => onSelect({ kind: 'row', index: row.index })}
                  className={cn(
                    'flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] font-semibold',
                    selection?.kind === 'row' && selection.index === row.index ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-accent',
                  )}
                >
                  <Columns2 size={15} aria-hidden />
                  Ряд · {row.settings.columns} колонки
                </button>
              )}
              {blocks.map(block => (
                <StructureItem
                  key={block.id}
                  block={block}
                  nested={multi}
                  selected={selection?.kind === 'block' && selection.id === block.id}
                  onSelect={() => onSelect({ kind: 'block', id: block.id })}
                  onToggle={() => onLayout(replaceBlock(layout, { ...block, hidden: !block.hidden }))}
                />
              ))}
            </React.Fragment>
          )
        })}
        <StructureGap at={rows.length} />
        {!rows.length && <p className="px-2 py-6 text-sm text-muted-foreground">Блоков пока нет.</p>}
      </div>
      <dl className="mt-3 shrink-0 space-y-2 border-t px-2 pt-3 text-xs text-muted-foreground">
        <Shortcut label="Переместить выделенный" keys="Alt + ↑ ↓" />
        <Shortcut label="Отменить перенос" keys="Esc" />
        <Shortcut label="Отменить правку" keys="Ctrl + Z" />
        <Shortcut label="Скрыть блок" keys="глаз в строке" />
      </dl>
    </div>
  )
}

function Shortcut({ label, keys }: { label: string; keys: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt>{label}</dt>
      <dd className="text-foreground/80">{keys}</dd>
    </div>
  )
}

function StructureGap({ at }: { at: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: `sgap-${at}`, data: { kind: 'gap', at } satisfies DropData })
  return (
    <div ref={setNodeRef} className="relative h-1.5">
      {isOver && <div className="absolute inset-x-1 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-primary" />}
    </div>
  )
}

function StructureItem({ block, nested, selected, onSelect, onToggle }: {
  block: Block
  nested: boolean
  selected: boolean
  onSelect: () => void
  onToggle: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `s:${block.id}`,
    data: { blockId: block.id } satisfies DragData,
  })
  const Icon = blockIcon(block.type)
  const label = block.caption || BLOCK_CATALOG.find(c => c.type === block.type)?.label || 'Блок'
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'group flex h-8 items-center gap-1.5 rounded-lg pr-1 text-[13px]',
        nested ? 'ml-5 pl-1' : 'pl-1',
        selected ? 'bg-primary/10 text-foreground shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.4)]' : 'hover:bg-accent',
        block.hidden && 'opacity-50',
        isDragging && 'border border-dashed border-primary/50 opacity-60',
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Перетащить «${label}»`}
        className="flex h-6 w-5 cursor-grab touch-none items-center justify-center text-muted-foreground/60 hover:text-foreground"
      >
        <GripVertical size={13} aria-hidden />
      </button>
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <Icon size={14} className="shrink-0 text-muted-foreground" aria-hidden />
        <span className="truncate">{label}</span>
      </button>
      {block.revealAt && <Lock size={13} className="shrink-0 text-muted-foreground" aria-label="Секрет до даты" />}
      <button
        type="button"
        onClick={onToggle}
        aria-label={block.hidden ? `Показать «${label}»` : `Скрыть «${label}»`}
        title={block.hidden ? 'Показать на странице' : 'Скрыть со страницы'}
        className={cn('flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground', !block.hidden && 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100')}
      >
        {block.hidden ? <EyeOff size={14} aria-hidden /> : <Eye size={14} aria-hidden />}
      </button>
    </div>
  )
}
