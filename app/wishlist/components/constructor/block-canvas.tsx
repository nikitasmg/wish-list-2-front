'use client'

import { BlockContent } from '@/app/s/[shortId]/components/blocks/block-renderer'
import { BlockPickerModal } from '@/app/wishlist/components/constructor/block-picker-modal'
import { EmptyCell } from '@/app/wishlist/components/constructor/empty-cell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useHaptic } from '@/hooks/use-haptic'
import { cn } from '@/lib/utils'
import {
  BLOCK_CATALOG,
  addBlockAfter,
  appendBlock,
  duplicateBlock,
  makeBlock,
} from '@/shared/editor-model'
import {
  buildCellMap,
  getGridRowCount,
  isCellOccupied,
  mobileOrder,
  moveBlock,
  resizeBlock,
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
import { Copy, GripVertical, Trash2 } from 'lucide-react'
import { InlineTextEditor } from './inline-text-editor'
import React, { useMemo, useState } from 'react'

type Props = {
  wishlist: Wishlist
  presents: Present[]
  selected?: string
  onSelect: (id: string) => void
  onChange: (blocks: Block[]) => void
}

/**
 * Холст конструктора.
 *
 * Страница — сетка из двух колонок, и блок держится за свои координаты, а не
 * за место в массиве: «два блока в ряд, а следующая строка одна широкая» так
 * и останется после любой правки соседей.
 */
export function BlockCanvas({ wishlist, presents, selected, onSelect, onChange }: Props) {
  const blocks = useMemo(() => wishlist.blocks ?? [], [wishlist.blocks])
  const [isDragActive, setIsDragActive] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [pickerTarget, setPickerTarget] = useState<{ row: number; col: 0 | 1 } | null>(null)
  const haptic = useHaptic()

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    // На телефоне перетаскивание должно начинаться с удержания, иначе
    // страница перестала бы прокручиваться пальцем.
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

    onChange(moveBlock(blocks, index, target.row, target.col))
    haptic(15)
  }

  const addAt = (type: BlockType, row: number, col: 0 | 1) => {
    if (isCellOccupied(blocks, row, col)) return
    const block = makeBlock(type, row, col, 1)
    onChange([...blocks, block])
    onSelect(block.id)
  }

  const shown = mobile ? mobileOrder(blocks) : blocks

  return (
    <div className="min-w-0 space-y-5">
      <BlockLibrary
        onAdd={type => {
          const next = appendBlock(blocks, type)
          onChange(next)
          onSelect(next[next.length - 1].id)
        }}
        open={blocks.length === 0}
      />

      <div className="flex justify-end gap-2">
        <Button size="sm" variant={!mobile ? 'default' : 'outline'} onClick={() => setMobile(false)}>Десктоп</Button>
        <Button size="sm" variant={mobile ? 'default' : 'outline'} onClick={() => setMobile(true)}>Телефон</Button>
      </div>

      {mobile ? (
        // На телефоне сетки нет: блоки идут сверху вниз в порядке чтения,
        // и перетаскивать там нечего — порядок задаётся координатами.
        <div className="mx-auto grid max-w-[390px] gap-4">
          {shown.map(block => (
            <CanvasItem
              key={block.id}
              block={block}
              mobile
              selected={selected === block.id}
              onSelect={() => onSelect(block.id)}
              onDuplicate={() => onChange(duplicateBlock(blocks, block.id))}
              onDelete={() => handleDelete(blocks, block.id, onChange)}
              onResize={() => onChange(resizeBlock(blocks, block.id, block.colSpan === 1 ? 2 : 1))}
              interactive={block.type === 'text'}
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
          ))}
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
          <div className="grid grid-cols-2 gap-3 items-start" style={{ gridAutoRows: 'minmax(80px, auto)' }}>
            {blocks.map(block => (
              <CanvasItem
                key={block.id}
                block={block}
                mobile={false}
                selected={selected === block.id}
                onSelect={() => onSelect(block.id)}
                onDuplicate={() => onChange(duplicateBlock(blocks, block.id))}
                onDelete={() => handleDelete(blocks, block.id, onChange)}
                onResize={() => onChange(resizeBlock(blocks, block.id, block.colSpan === 1 ? 2 : 1))}
                interactive={block.type === 'text'}
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
            ))}

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

function handleDelete(blocks: Block[], id: string, onChange: (blocks: Block[]) => void) {
  if (!window.confirm('Удалить блок? Ответы гостей для него больше не будут видны на странице.')) return
  onChange(blocks.filter(b => b.id !== id))
}

/**
 * Содержимое блока на холсте. Текст правится прямо здесь: открывать панель
 * ради одной опечатки — лишний шаг, а текстовых блоков на странице больше
 * всех остальных вместе взятых.
 */
function BlockBody({ block, blocks, wishlist, presents, onChange, onSelect }: {
  block: Block
  blocks: Block[]
  wishlist: Wishlist
  presents: Present[]
  onChange: (blocks: Block[]) => void
  onSelect: (id: string) => void
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

/** Библиотека блоков: добавляет в первую свободную ячейку. */
function BlockLibrary({ onAdd, open }: { onAdd: (type: BlockType) => void; open: boolean }) {
  const [search, setSearch] = useState('')
  const catalog = BLOCK_CATALOG.filter(b =>
    b.label.toLocaleLowerCase('ru').includes(search.toLocaleLowerCase('ru')),
  )

  return (
    <details className="rounded-xl border p-4" open={open}>
      <summary className="cursor-pointer font-semibold">Добавить блок</summary>
      <Input
        className="mt-3"
        aria-label="Поиск блоков"
        placeholder="Поиск блоков"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {Array.from(new Set(catalog.map(b => b.group))).map(group => (
        <div key={group} className="mt-4 space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{group}</p>
          <div className="flex flex-wrap gap-2">
            {catalog.filter(b => b.group === group).map(item => (
              <Button key={item.type} variant="outline" size="sm" onClick={() => onAdd(item.type)}>
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      ))}
      {!catalog.length && <p className="py-4 text-sm text-muted-foreground">Ничего не найдено</p>}
    </details>
  )
}

function CanvasItem({ block, mobile, selected, onSelect, onDuplicate, onDelete, onResize, interactive = false, children }: {
  block: Block
  mobile: boolean
  selected: boolean
  onSelect: () => void
  onDuplicate: () => void
  onDelete: () => void
  onResize: () => void
  /** Блок правится прямо на холсте — превью-обёртку к нему применять нельзя. */
  interactive?: boolean
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

  return (
    <article
      ref={setRef}
      style={{
        transform: CSS.Translate.toString(transform),
        ...(mobile ? {} : { gridRow: block.row + 1, gridColumn: `${block.col + 1} / span ${block.colSpan ?? 1}` }),
      }}
      className={cn(
        'min-w-0 rounded-2xl border bg-card p-3',
        selected && 'ring-2 ring-primary',
        block.hidden && 'opacity-60',
        isDragging && 'opacity-40',
      )}
    >
      <div className="mb-3 flex flex-wrap items-center gap-1 border-b pb-2">
        {!mobile && (
          <button type="button" {...attributes} {...listeners} aria-label="Переместить блок" className="touch-none cursor-grab rounded p-2">
            <GripVertical size={16} />
          </button>
        )}
        <button type="button" onClick={onSelect} className="flex-1 text-left text-sm font-semibold">
          {BLOCK_CATALOG.find(b => b.type === block.type)?.label ?? 'Старый блок'}
          {block.hidden && ' · скрыт'}
          {block.revealAt && ' · секрет'}
        </button>
        {!mobile && <Button size="sm" variant="ghost" onClick={onResize}>{block.colSpan === 1 ? '½' : '1/1'}</Button>}
        <Button size="sm" variant="ghost" aria-label="Дублировать блок" onClick={onDuplicate}><Copy size={14} /></Button>
        <Button size="sm" variant="ghost" aria-label="Удалить блок" onClick={onDelete}><Trash2 size={14} /></Button>
      </div>
      {/* Превью нельзя трогать мышью: клик по нему выбирает блок, а не уходит
          внутрь. Редактируемый блок — наоборот: inert убрал бы его из дерева
          фокуса, и курсор в поле было бы не поставить. */}
      {interactive
        ? <div onFocusCapture={onSelect}>{children}</div>
        : <div onClick={onSelect} className="cursor-pointer"><div className="pointer-events-none select-none" inert>{children}</div></div>}
      <Button size="sm" variant="ghost" className="mt-3 w-full" onClick={onSelect}>Настроить блок</Button>
    </article>
  )
}
