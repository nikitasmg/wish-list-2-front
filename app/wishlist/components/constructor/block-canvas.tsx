'use client'

import { BlockContent } from '@/app/s/[shortId]/components/blocks/block-renderer'
import { BlockPickerModal } from '@/app/wishlist/components/constructor/block-picker-modal'
import { EmptyCell } from '@/app/wishlist/components/constructor/empty-cell'
import { useHaptic } from '@/hooks/use-haptic'
import { cn } from '@/lib/utils'
import { BLOCK_CATALOG, addBlockAfter, duplicateBlock, makeBlock } from '@/shared/editor-model'
import {
  buildCellMap,
  compactRows,
  getGridRowCount,
  isCellOccupied,
  mobileOrder,
  moveBlock,
  moveBlockByRow,
} from '@/shared/grid'
import { convertBlock } from '@/shared/slash-menu'
import { Block, BlockType, Present, Wishlist } from '@/shared/types'
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { ArrowDown, ArrowUp, Copy, GripVertical, Trash2 } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { InlineTextEditor } from './inline-text-editor'

type Props = {
  wishlist: Wishlist
  presents: Present[]
  selected?: string
  mobile: boolean
  onSelect: (id?: string) => void
  onChange: (blocks: Block[]) => void
}

/**
 * Холст конструктора.
 *
 * Показывает страницу, а не форму: блок выглядит так, как его увидит гость, а
 * управление появляется только у выделенного. Раньше у каждого блока висела
 * шапка с шестью кнопками, и за ними не было видно самой страницы.
 *
 * Координаты живут в блоках, а не выводятся из порядка массива: «два блока в
 * ряд, а дальше одна широкая строка» так и остаётся после правки соседей.
 */
export function BlockCanvas({ wishlist, presents, selected, mobile, onSelect, onChange }: Props) {
  const blocks = useMemo(() => wishlist.blocks ?? [], [wishlist.blocks])
  const [isDragActive, setIsDragActive] = useState(false)
  const [pickerTarget, setPickerTarget] = useState<{ row: number; col: 0 | 1 } | null>(null)
  const haptic = useHaptic()

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    // На телефоне перенос начинается с удержания, иначе страница перестала бы
    // прокручиваться пальцем.
    useSensor(TouchSensor, { activationConstraint: { delay: 500, tolerance: 8 } }),
  )

  const rowCount = useMemo(() => getGridRowCount(blocks), [blocks])
  const cellMap = useMemo(() => buildCellMap(blocks), [blocks])

  const emptyCells = useMemo(() => {
    const cells: { row: number; col: 0 | 1 }[] = []
    for (let r = 0; r < rowCount; r++) {
      if (!cellMap.has(`${r},0`)) cells.push({ row: r, col: 0 })
      if (!cellMap.has(`${r},1`)) cells.push({ row: r, col: 1 })
    }
    return cells
  }, [rowCount, cellMap])

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragActive(false)
    document.body.style.overflow = ''

    const { active, over } = event
    if (!over) return
    const target = over.data.current as { row: number; col: 0 | 1 } | undefined
    if (!target) return

    const index = blocks.findIndex(b => b.id === active.id)
    if (index < 0) return
    const moving = blocks[index]
    if (moving.row === target.row && moving.col === target.col) return

    onChange(compactRows(moveBlock(blocks, index, target.row, target.col)))
    haptic(15)
  }

  const addAt = (type: BlockType, row: number, col: 0 | 1) => {
    if (isCellOccupied(blocks, row, col)) return
    const block = makeBlock(type, row, col, 1)
    onChange([...blocks, block])
    onSelect(block.id)
  }

  const item = (block: Block) => (
    <CanvasItem
      key={block.id}
      block={block}
      total={blocks.length}
      mobile={mobile}
      selected={selected === block.id}
      onSelect={() => onSelect(block.id)}
      onMove={direction => onChange(moveBlockByRow(blocks, block.id, direction))}
      onDuplicate={() => onChange(duplicateBlock(blocks, block.id))}
      onDelete={() => {
        if (!window.confirm('Удалить блок? Ответы гостей для него больше не будут видны на странице.')) return
        onChange(compactRows(blocks.filter(b => b.id !== block.id)))
        onSelect(undefined)
      }}
    >
      <BlockBody
        block={block}
        blocks={blocks}
        wishlist={wishlist}
        presents={presents}
        onChange={onChange}
        onSelect={onSelect}
      />
    </CanvasItem>
  )

  // Лист страницы на подложке, со скруглением сверху — как в макете.
  const sheet = 'min-h-full rounded-t-2xl border border-b-0 bg-background px-5 py-7 shadow-2xl'

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-muted/40 px-4 pt-6">
      {mobile ? (
        // На узкой ширине сетки нет: блоки идут в порядке чтения, переносить
        // там нечего — расстановку задают координаты.
        <div className={cn(sheet, 'mx-auto w-[390px] max-w-full space-y-6')}>
          {mobileOrder(blocks).map(item)}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={args => {
            const hits = pointerWithin(args)
            return hits.length > 0 ? hits : closestCenter(args)
          }}
          onDragStart={() => { setIsDragActive(true); haptic(25); document.body.style.overflow = 'hidden' }}
          onDragEnd={handleDragEnd}
          onDragCancel={() => { setIsDragActive(false); document.body.style.overflow = '' }}
        >
          <div
            className={cn(sheet, 'mx-auto grid w-full max-w-[720px] grid-cols-2 items-start gap-x-4 gap-y-8')}
            style={{ gridAutoRows: 'minmax(72px, auto)' }}
          >
            {blocks.map(item)}

            {emptyCells.map(({ row, col }) => (
              <EmptyCell
                key={`empty-${row}-${col}`}
                row={row}
                col={col}
                isDragActive={isDragActive}
                onAdd={() => setPickerTarget({ row, col })}
              />
            ))}
          </div>
        </DndContext>
      )}

      <BlockPickerModal
        open={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelect={type => {
          if (!pickerTarget) return
          addAt(type, pickerTarget.row, pickerTarget.col)
          setPickerTarget(null)
        }}
      />
    </div>
  )
}

/**
 * Содержимое блока. Текст правится прямо здесь: открывать панель ради одной
 * опечатки — лишний шаг, а текстовых блоков на странице больше всех остальных
 * вместе взятых.
 */
function BlockBody({ block, blocks, wishlist, presents, onChange, onSelect }: {
  block: Block
  blocks: Block[]
  wishlist: Wishlist
  presents: Present[]
  onChange: (blocks: Block[]) => void
  onSelect: (id?: string) => void
}) {
  if (block.type !== 'text') {
    return <BlockContent block={{ ...block, hidden: false, revealAt: null }} wishlist={wishlist} presents={presents} preview />
  }

  return (
    <InlineTextEditor
      html={String(block.data.html ?? block.data.content ?? '')}
      onChange={html => onChange(blocks.map(b => b.id === block.id ? { ...b, data: { ...b.data, html } } : b))}
      onSplit={() => {
        const next = addBlockAfter(blocks, block.id, 'text')
        onChange(next)
        onSelect(next[next.length - 1].id)
      }}
      onConvert={type => { onChange(convertBlock(blocks, block.id, type)); onSelect(block.id) }}
    />
  )
}

function CanvasItem({
  block, total, mobile, selected, onSelect, onMove, onDuplicate, onDelete, children,
}: {
  block: Block
  total: number
  mobile: boolean
  selected: boolean
  onSelect: () => void
  onMove: (direction: -1 | 1) => void
  onDuplicate: () => void
  onDelete: () => void
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: block.id,
    disabled: mobile,
  })
  // Блок — ещё и цель переноса: бросив один на другой, их меняют местами.
  const { setNodeRef: setDropRef } = useDroppable({
    id: `block-${block.id}`,
    data: { row: block.row, col: block.col },
    disabled: mobile,
  })

  const setRef = (node: HTMLElement | null) => { setDragRef(node); setDropRef(node) }
  const info = BLOCK_CATALOG.find(b => b.type === block.type)
  const viewName = info?.views?.find(([value]) => value === block.view)?.[1]
  // Текст правится на месте, поэтому inert-обёртку к нему применять нельзя:
  // она вынесла бы contentEditable из дерева фокуса.
  const interactive = block.type === 'text'

  return (
    <article
      ref={setRef}
      style={{
        transform: CSS.Translate.toString(transform),
        ...(mobile ? {} : { gridRow: block.row + 1, gridColumn: `${block.col + 1} / span ${block.colSpan ?? 1}` }),
      }}
      className={cn(
        'relative min-w-0 rounded-xl',
        selected ? 'outline outline-2 outline-primary' : 'outline outline-1 outline-transparent hover:outline-border',
        block.hidden && 'opacity-50',
        isDragging && 'opacity-40',
      )}
    >
      {selected && (
        <>
          <span className="absolute -top-2.5 left-3 z-10 rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
            {info?.label ?? 'Старый блок'}{viewName && ` · ${viewName}`}
            {block.hidden && ' · скрыт'}
            {block.revealAt && ' · секрет'}
          </span>

          <div className="absolute -top-4 right-3 z-10 flex gap-0.5 rounded-lg border bg-popover p-1 shadow-lg">
            {!mobile && (
              <button
                type="button"
                {...attributes}
                {...listeners}
                aria-label="Перетащить блок"
                className="flex h-6 w-6 cursor-grab touch-none items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <GripVertical size={14} aria-hidden />
              </button>
            )}
            <ToolbarButton label="Выше" onClick={() => onMove(-1)} disabled={block.row === 0}>
              <ArrowUp size={14} aria-hidden />
            </ToolbarButton>
            <ToolbarButton label="Ниже" onClick={() => onMove(1)} disabled={total < 2}>
              <ArrowDown size={14} aria-hidden />
            </ToolbarButton>
            <ToolbarButton label="Дублировать блок" onClick={onDuplicate}>
              <Copy size={14} aria-hidden />
            </ToolbarButton>
            <ToolbarButton label="Удалить блок" onClick={onDelete} destructive>
              <Trash2 size={14} aria-hidden />
            </ToolbarButton>
          </div>
        </>
      )}

      {/* Превью нельзя трогать мышью: клик по нему выбирает блок, а не уходит
          внутрь. Редактируемый блок — наоборот. */}
      {interactive ? (
        <div className="p-2" onFocusCapture={onSelect}>{children}</div>
      ) : (
        <div className="cursor-pointer p-2" onClick={onSelect}>
          <div className="pointer-events-none select-none" inert>{children}</div>
        </div>
      )}
    </article>
  )
}

function ToolbarButton({ label, onClick, disabled, destructive, children }: {
  label: string
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-6 w-6 items-center justify-center rounded text-muted-foreground',
        'hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent',
        destructive && 'hover:text-destructive',
      )}
    >
      {children}
    </button>
  )
}
