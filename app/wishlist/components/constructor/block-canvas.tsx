'use client'

import { BlockContent } from '@/app/s/[shortId]/components/blocks/block-renderer'
import { blockIcon } from '@/app/wishlist/components/constructor/block-icons'
import { cn } from '@/lib/utils'
import { BLOCK_CATALOG, LibraryItem, addBlockAfter, libraryBlock } from '@/shared/editor-model'
import {
  Layout,
  RowView,
  addToCell,
  columnTemplate,
  duplicateBlock,
  insertRow,
  layoutRows,
  nudge,
  ratioShare,
  readingOrder,
  removeBlock,
  replaceBlock,
  snapRatio,
  updateRow,
} from '@/shared/layout'
import { convertBlock } from '@/shared/slash-menu'
import { Block, Present, RowRatio, Wishlist } from '@/shared/types'
import { useDraggable, useDroppable, useDndContext } from '@dnd-kit/core'
import { ArrowDown, ArrowUp, Columns2, Copy, Lock, Trash2 } from 'lucide-react'
import * as React from 'react'
import { useRef, useState } from 'react'
import { InlineTextEditor } from './inline-text-editor'
import { InsertButton } from './insert-menu'

export type Selection = { kind: 'block'; id: string } | { kind: 'row'; index: number } | null

/** Данные перетаскивания: что тянут и куда отпускают. */
export type DragData = { blockId: string }
export type DropData =
  | { kind: 'gap'; at: number }
  | { kind: 'side'; target: string; side: 'left' | 'right' }
  | { kind: 'cell'; row: number; col: number }

export const GAP_PX: Record<string, number> = { s: 16, m: 28, l: 44, '': 28 }

type Props = {
  wishlist: Wishlist
  layout: Layout
  presents: Present[]
  selection: Selection
  phone: boolean
  schemeClass?: string
  schemeStyle?: React.CSSProperties
  onSelect: (selection: Selection) => void
  onLayout: (layout: Layout, key?: string) => void
}

/**
 * Холст конструктора.
 *
 * Показывает страницу, а не форму: блок выглядит так, как его увидит гость, а
 * управление появляется только у выделенного. Между рядами — «+» для вставки,
 * блок тянется за любую точку: между рядами — встанет отдельным рядом, у
 * бокового края другого блока — соберёт с ним ряд.
 */
export function BlockCanvas(props: Props) {
  const { layout, phone, onLayout, onSelect } = props
  const rows = layoutRows(layout)
  const { active } = useDndContext()
  const dragging = Boolean(active)

  const label = (block?: Block | null) => block ? (block.caption || BLOCK_CATALOG.find(c => c.type === block.type)?.label || 'блок') : ''
  const gapHint = (at: number) => {
    const above = rows[at - 1]?.cells.find(Boolean)
    const below = rows[at]?.cells.find(Boolean)
    if (above && below) return `Вставится между «${label(above)}» и «${label(below)}»`
    if (above) return `Вставится в конец страницы, после «${label(above)}»`
    return below ? `Вставится в начало, перед «${label(below)}»` : 'Первый блок страницы'
  }

  const insert = (item: LibraryItem, at: number) => {
    const block = libraryBlock(item)
    onLayout(insertRow(layout, at, block))
    onSelect({ kind: 'block', id: block.id })
  }

  // Лист страницы на подложке, со скруглением сверху — как в макете.
  const sheet = cn(
    'wishlist-page min-h-full rounded-t-2xl border border-b-0 bg-background text-foreground shadow-2xl',
    phone ? 'mx-auto w-[390px] max-w-full px-4 py-6' : 'mx-auto w-full max-w-[880px] px-8 py-10',
  )

  return (
    <div
      data-tour="block-canvas"
      className="min-h-0 flex-1 overflow-y-auto bg-muted/50 px-4 pt-6"
      onClick={e => { if (e.target === e.currentTarget) onSelect(null) }}
    >
      <div className={cn(sheet, props.schemeClass)} style={props.schemeStyle}>
        {phone ? (
          // На телефоне ряды встают друг под другом, в порядке чтения.
          <div className="space-y-6">
            {readingOrder(layout).map(block => (
              <CanvasBlock key={block.id} {...props} block={block} draggable={false} />
            ))}
            {!layout.blocks.length && <EmptyPage {...props} onInsert={item => insert(item, 0)} />}
          </div>
        ) : (
          <div>
            {rows.map(row => (
              <React.Fragment key={row.index}>
                <Gap at={row.index} dragging={dragging} hint={gapHint(row.index)} {...props} onInsert={item => insert(item, row.index)} />
                <CanvasRow {...props} row={row} dragging={dragging} />
              </React.Fragment>
            ))}
            {rows.length > 0 && <Gap at={rows.length} dragging={dragging} hint={gapHint(rows.length)} {...props} onInsert={item => insert(item, rows.length)} last />}
            {!rows.length && <EmptyPage {...props} onInsert={item => insert(item, 0)} />}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyPage(props: Props & { onInsert: (item: LibraryItem) => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
      <p className="text-sm">Страница пустая. Добавьте первый блок.</p>
      <InsertButton hint="Первый блок страницы" {...props} onInsert={props.onInsert} />
    </div>
  )
}

/** Промежуток между рядами: «+» при наведении и цель для переноса. */
function Gap({ at, dragging, hint, last, onInsert, ...props }: Props & { at: number; dragging: boolean; hint: string; last?: boolean; onInsert: (item: LibraryItem) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `gap-${at}`, data: { kind: 'gap', at } satisfies DropData })
  return (
    <div
      ref={setNodeRef}
      className={cn('group/gap relative flex items-center justify-center', dragging ? 'h-10' : last ? 'h-14' : 'h-7')}
    >
      <div className={cn(
        'absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full transition-colors',
        isOver ? 'bg-primary' : 'bg-transparent',
      )} />
      {isOver && (
        <span className="absolute -top-1 rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
          Вставится сюда
        </span>
      )}
      {!dragging && (
        <div className={cn('relative transition-opacity', last ? 'opacity-60 hover:opacity-100' : 'opacity-0 group-hover/gap:opacity-100 focus-within:opacity-100')}>
          <InsertButton hint={hint} {...props} onInsert={onInsert} />
        </div>
      )}
    </div>
  )
}

function CanvasRow(props: Props & { row: RowView; dragging: boolean }) {
  const { row, layout, selection, onSelect, onLayout, dragging } = props
  const gridRef = useRef<HTMLDivElement>(null)
  const columns = row.settings.columns ?? 1
  const rowSelected = selection?.kind === 'row' && selection.index === row.index
  // У выделенного блока своя метка — метка ряда легла бы прямо на неё.
  const blockSelected = selection?.kind === 'block' && row.cells.some(cell => cell?.id === selection.id)
  const [liveRatio, setLiveRatio] = useState<RowRatio | null>(null)
  const settings = liveRatio ? { ...row.settings, ratio: liveRatio } : row.settings

  return (
    <div className={cn('group/row relative rounded-2xl', rowSelected && 'outline outline-2 outline-offset-8 outline-primary')}>
      {columns > 1 && !dragging && !blockSelected && (
        <button
          type="button"
          onClick={() => onSelect({ kind: 'row', index: row.index })}
          className={cn(
            'absolute -top-6 left-0 z-10 flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold transition-opacity',
            rowSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground opacity-0 group-hover/row:opacity-100',
          )}
        >
          <Columns2 size={12} aria-hidden />
          Ряд · {columns} {columns === 1 ? 'колонка' : 'колонки'}
        </button>
      )}
      <div
        ref={gridRef}
        className="relative grid"
        style={{
          gridTemplateColumns: columnTemplate(settings),
          columnGap: GAP_PX[row.settings.gap ?? ''],
          alignItems: row.settings.height === 'equal' ? 'stretch' : 'start',
        }}
      >
        {row.cells.map((block, col) => block
          ? <CanvasBlock key={block.id} {...props} block={block} draggable alone={columns === 1} equal={row.settings.height === 'equal'} />
          : <EmptyCell key={`empty-${col}`} {...props} rowIndex={row.index} col={col} />)}

        {columns === 2 && !dragging && (
          <Splitter
            gridRef={gridRef}
            ratio={settings.ratio}
            onLive={setLiveRatio}
            onCommit={ratio => { setLiveRatio(null); onLayout(updateRow(layout, row.index, { ratio })) }}
          />
        )}
      </div>
    </div>
  )
}

/**
 * Разделитель колонок: тянется мышью и прилипает к 1:2, 1:1, 2:1. Подпись с
 * пропорцией видна, пока тянешь.
 */
function Splitter({ gridRef, ratio, onLive, onCommit }: {
  gridRef: React.RefObject<HTMLDivElement | null>
  ratio?: RowRatio
  onLive: (ratio: RowRatio | null) => void
  onCommit: (ratio: RowRatio) => void
}) {
  const [active, setActive] = useState(false)
  const share = ratioShare(ratio)
  const shown = ratio && ratio !== '1:1:1' ? ratio : '1:1'

  const onPointerDown = (event: React.PointerEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const grid = gridRef.current
    if (!grid) return
    setActive(true)
    const rect = grid.getBoundingClientRect()
    let last: RowRatio = shown as RowRatio
    const move = (e: PointerEvent) => {
      last = snapRatio((e.clientX - rect.left) / rect.width)
      onLive(last)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setActive(false)
      onCommit(last)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Пропорции колонок"
      aria-valuetext={shown.replace(':', ' : ')}
      aria-valuenow={Math.round(share * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      onKeyDown={e => {
        const order: RowRatio[] = ['1:2', '1:1', '2:1']
        const index = order.indexOf(shown as RowRatio)
        if (e.key === 'ArrowLeft' && index > 0) onCommit(order[index - 1])
        if (e.key === 'ArrowRight' && index < 2) onCommit(order[index + 1])
      }}
      onPointerDown={onPointerDown}
      className="group/split absolute inset-y-0 z-20 flex w-4 -translate-x-1/2 cursor-col-resize items-center justify-center focus-visible:outline-none"
      style={{ left: `${share * 100}%` }}
    >
      <span className={cn(
        'h-full w-0.5 rounded-full transition-colors',
        active ? 'bg-primary' : 'bg-transparent group-hover/row:bg-primary/40 group-focus-visible/split:bg-primary',
      )} />
      {active && (
        <span className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-primary px-2 py-0.5 text-xs font-extrabold text-primary-foreground">
          {shown.replace(':', ' : ')}
        </span>
      )}
    </div>
  )
}

function EmptyCell(props: Props & { rowIndex: number; col: number }) {
  const { rowIndex, col, layout, onLayout, onSelect } = props
  const { setNodeRef, isOver } = useDroppable({ id: `cell-${rowIndex}-${col}`, data: { kind: 'cell', row: rowIndex, col } satisfies DropData })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed transition-colors',
        isOver ? 'border-primary bg-primary/5' : 'border-border',
      )}
    >
      <InsertButton
        hint="Встанет в пустую колонку"
        {...props}
        onInsert={item => {
          const block = libraryBlock(item)
          onLayout(addToCell(layout, rowIndex, col, block))
          onSelect({ kind: 'block', id: block.id })
        }}
      />
    </div>
  )
}

/** Боковая цель: отпустить у края блока — встать рядом с ним. */
function SideTarget({ block, side }: { block: Block; side: 'left' | 'right' }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `side-${block.id}-${side}`,
    data: { kind: 'side', target: block.id, side } satisfies DropData,
  })
  return (
    <div
      ref={setNodeRef}
      className={cn('absolute inset-y-0 z-20 w-12', side === 'left' ? '-left-3' : '-right-3')}
    >
      {isOver && (
        <>
          <div className={cn('absolute inset-y-2 w-1 rounded-full bg-primary', side === 'left' ? 'left-2' : 'right-2')} />
          <span className={cn(
            'absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground',
            side === 'left' ? 'left-4' : 'right-4',
          )}>
            Поставить рядом
          </span>
        </>
      )}
    </div>
  )
}

const ASPECTS: [string, number][] = [['21:9', 9 / 21], ['16:9', 9 / 16], ['4:3', 3 / 4], ['1:1', 1], ['3:4', 4 / 3]]

/** Пропорция по отношению высоты к ширине — ближайшая из списка. */
export function snapAspect(heightToWidth: number): string {
  return ASPECTS.reduce((best, a) => (Math.abs(a[1] - heightToWidth) < Math.abs(best[1] - heightToWidth) ? a : best))[0]
}

function CanvasBlock(props: Props & { block: Block; draggable: boolean; alone?: boolean; equal?: boolean }) {
  const { block, layout, selection, onSelect, onLayout, wishlist, presents, draggable, alone, equal } = props
  const selected = selection?.kind === 'block' && selection.id === block.id
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: block.id,
    data: { blockId: block.id } satisfies DragData,
    disabled: !draggable,
  })
  const { active } = useDndContext()
  const bodyRef = useRef<HTMLDivElement>(null)
  const [liveAspect, setLiveAspect] = useState<string | null>(null)

  const info = BLOCK_CATALOG.find(b => b.type === block.type)
  const viewName = info?.views?.find(([value]) => value === block.view)?.[1]
  const Icon = blockIcon(block.type)
  const interactive = block.type === 'text'
  const secretDate = block.revealAt ? new Date(block.revealAt) : null
  const resizable = (block.type === 'media' || (block.type === 'cover' && block.view === 'photo'))
  const aspect = liveAspect ?? (typeof block.data.aspect === 'string' ? block.data.aspect : '')

  // Перенос начинается с любой точки блока, кроме полей ввода и кнопок:
  // иначе нельзя было бы выделить текст мышью.
  const pointerDown = (event: React.PointerEvent) => {
    const target = event.target as Element
    if (target.closest('[contenteditable="true"], input, textarea, button, [role="slider"], a')) return
    listeners?.onPointerDown?.(event)
  }

  if (isDragging) {
    return (
      <div className="flex min-h-[96px] items-center justify-center rounded-2xl border-2 border-dashed border-primary/50 text-sm text-muted-foreground">
        Здесь был блок «{block.caption || info?.label}»
      </div>
    )
  }

  const startResize = (event: React.PointerEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const node = bodyRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    let last = aspect || '16:9'
    const move = (e: PointerEvent) => { last = snapAspect((e.clientY - rect.top) / rect.width); setLiveAspect(last) }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setLiveAspect(null)
      onLayout(replaceBlock(layout, { ...block, data: { ...block.data, aspect: last } }))
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const shown = aspect ? { ...block, data: { ...block.data, aspect } } : block

  return (
    <article
      ref={setNodeRef}
      {...attributes}
      onPointerDown={draggable ? pointerDown : undefined}
      tabIndex={-1}
      aria-roledescription="блок"
      aria-label={block.caption || info?.label}
      className={cn(
        'relative min-w-0 rounded-2xl',
        equal && 'h-full',
        draggable && 'cursor-grab active:cursor-grabbing',
        selected ? 'outline outline-2 outline-offset-4 outline-primary' : 'outline outline-1 outline-offset-4 outline-transparent hover:outline-border',
        block.hidden && 'opacity-50',
        alone && block.width === 'narrow' && 'mx-auto w-full max-w-[560px]',
      )}
    >
      {active && active.id !== block.id && draggable && (
        <>
          <SideTarget block={block} side="left" />
          <SideTarget block={block} side="right" />
        </>
      )}

      {selected && (
        <>
          <span className="absolute -top-3 left-3 z-10 flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
            <Icon size={11} aria-hidden />
            {info?.label ?? 'Старый блок'}{viewName && ` · ${viewName}`}
            {block.hidden && ' · скрыт'}
            {secretDate && ` · скрыт до ${secretDate.toLocaleDateString('ru', { day: '2-digit', month: '2-digit' })}`}
          </span>
          <div className="absolute -top-4 right-3 z-10 flex gap-0.5 rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg">
            {draggable && !alone && (
              <ToolbarButton label="Настроить ряд" onClick={() => onSelect({ kind: 'row', index: block.row })}><Columns2 size={14} aria-hidden /></ToolbarButton>
            )}
            <ToolbarButton label="Выше (Alt+↑)" onClick={() => onLayout(nudge(layout, block.id, -1))}><ArrowUp size={14} aria-hidden /></ToolbarButton>
            <ToolbarButton label="Ниже (Alt+↓)" onClick={() => onLayout(nudge(layout, block.id, 1))}><ArrowDown size={14} aria-hidden /></ToolbarButton>
            <ToolbarButton label="Дублировать блок" onClick={() => onLayout(duplicateBlock(layout, block.id))}><Copy size={14} aria-hidden /></ToolbarButton>
            <ToolbarButton
              label="Удалить блок"
              destructive
              onClick={() => {
                if (!window.confirm('Удалить блок? Ответы гостей для него больше не будут видны на странице.')) return
                onLayout(removeBlock(layout, block.id))
                onSelect(null)
              }}
            >
              <Trash2 size={14} aria-hidden />
            </ToolbarButton>
          </div>
        </>
      )}

      <div ref={bodyRef}>
        {interactive ? (
          <div onFocusCapture={() => onSelect({ kind: 'block', id: block.id })} onClick={() => onSelect({ kind: 'block', id: block.id })}>
            <InlineTextEditor
              html={String(block.data.html ?? block.data.content ?? '')}
              onChange={html => onLayout(replaceBlock(layout, { ...block, data: { ...block.data, html } }), `text:${block.id}`)}
              onSplit={() => {
                const next = addBlockAfter(layout, block.id, 'text')
                onLayout(next.layout)
                if (next.id) onSelect({ kind: 'block', id: next.id })
              }}
              onConvert={type => {
                onLayout({ ...layout, blocks: convertBlock(layout.blocks, block.id, type) })
                onSelect({ kind: 'block', id: block.id })
              }}
            />
          </div>
        ) : (
          <div onClick={() => onSelect({ kind: 'block', id: block.id })}>
            <div className="pointer-events-none select-none" inert>
              {block.revealAt && (
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Lock size={12} aria-hidden /> Гости увидят после {secretDate?.toLocaleString('ru', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              <BlockContent block={{ ...shown, hidden: false, revealAt: null }} wishlist={wishlist} presents={presents} preview />
            </div>
          </div>
        )}
      </div>

      {selected && resizable && (
        <div
          role="slider"
          tabIndex={0}
          aria-label="Высота блока"
          aria-valuetext={aspect || '16:9'}
          aria-valuenow={ASPECTS.findIndex(a => a[0] === (aspect || '16:9'))}
          aria-valuemin={0}
          aria-valuemax={ASPECTS.length - 1}
          onPointerDown={startResize}
          className="absolute -bottom-3 left-1/2 z-20 flex -translate-x-1/2 cursor-ns-resize flex-col items-center gap-1"
        >
          <span className="h-1.5 w-12 rounded-full bg-primary" />
          <span className="whitespace-nowrap rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
            Высота · {(aspect || '16:9').replace(':', ' : ')} — тяните вниз
          </span>
        </div>
      )}
    </article>
  )
}

function ToolbarButton({ label, onClick, destructive, children }: {
  label: string
  onClick: () => void
  destructive?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={e => { e.stopPropagation(); onClick() }}
      className={cn(
        'flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground',
        destructive && 'hover:text-destructive',
      )}
    >
      {children}
    </button>
  )
}
