'use client'

import { BlockContent } from '@/app/s/[shortId]/components/blocks/block-renderer'
import { blockIcon } from '@/app/wishlist/components/constructor/block-icons'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { BLOCK_LIBRARY, LibraryItem, libraryBlock } from '@/shared/editor-model'
import { Present, Wishlist } from '@/shared/types'
import { Plus, Search } from 'lucide-react'
import * as React from 'react'
import { useMemo, useState } from 'react'

/** Поиск по библиотеке: по названию, подсказке и группе — «гости» показывает всю группу. */
export function filterLibrary(query: string): LibraryItem[] {
  const q = query.trim().toLocaleLowerCase('ru')
  if (!q) return BLOCK_LIBRARY
  return BLOCK_LIBRARY.filter(item =>
    `${item.label} ${item.hint ?? ''} ${item.group}`.toLocaleLowerCase('ru').includes(q))
}

/**
 * Список блоков с поиском и группами. Наведение показывает превью — как блок
 * будет выглядеть на этой странице, в её схеме.
 */
export function LibraryList({ onPick, onHover, compact, autoFocus }: {
  onPick: (item: LibraryItem) => void
  onHover?: (item: LibraryItem | null) => void
  compact?: boolean
  autoFocus?: boolean
}) {
  const [query, setQuery] = useState('')
  const items = useMemo(() => filterLibrary(query), [query])
  const groups = Array.from(new Set(items.map(i => i.group)))

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <label className="flex h-control shrink-0 items-center gap-2 rounded-control border px-2.5 text-muted-foreground focus-within:ring-2 focus-within:ring-ring">
        <Search size={15} aria-hidden />
        <input
          autoFocus={autoFocus}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && items[0]) onPick(items[0]) }}
          placeholder="Найти блок…"
          aria-label="Найти блок"
          className="w-full bg-transparent text-label text-foreground outline-none placeholder:text-muted-foreground"
        />
      </label>
      <div className="-mr-1 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {groups.map(group => (
          <div key={group}>
            <p className="px-2.5 pb-1 text-micro font-bold uppercase tracking-wide text-muted-foreground">{group}</p>
            {items.filter(i => i.group === group).map(item => {
              const Icon = blockIcon(item.type, item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onPick(item)}
                  onMouseEnter={() => onHover?.(item)}
                  onFocus={() => onHover?.(item)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-control-lg px-2.5 text-left text-label font-medium',
                    compact ? 'h-control-sm' : 'h-control',
                    'text-foreground/80 hover:bg-accent hover:text-foreground focus-visible:bg-accent focus-visible:outline-none',
                  )}
                >
                  <Icon size={16} className="shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate">{item.label}</span>
                  {item.hint && <span className="ml-auto shrink-0 text-micro font-semibold text-muted-foreground">{item.hint}</span>}
                </button>
              )
            })}
          </div>
        ))}
        {!items.length && <p className="px-2.5 py-6 text-body-sm text-muted-foreground">Ничего не найдено</p>}
      </div>
    </div>
  )
}

/** Превью пресета в схеме страницы. */
export function LibraryPreview({ item, wishlist, presents }: { item: LibraryItem; wishlist: Wishlist; presents: Present[] }) {
  const block = useMemo(() => libraryBlock(item), [item])
  return (
    <div className="space-y-2">
      <p className="text-caption font-semibold text-muted-foreground">{item.label} — так будет выглядеть</p>
      <div className="pointer-events-none max-h-[320px] select-none overflow-hidden rounded-control-lg border bg-background p-4 text-foreground" inert>
        <div className="origin-top-left scale-[0.8] [width:125%]">
          <BlockContent block={block} wishlist={wishlist} presents={presents.slice(0, 2)} preview />
        </div>
      </div>
    </div>
  )
}

/**
 * «+» между рядами: появляется при наведении, по клику — меню блоков с
 * поиском и превью. Подпись снизу говорит, куда именно блок встанет.
 */
export function InsertButton({ hint, wishlist, presents, schemeClass, schemeStyle, onInsert, className, label = 'Вставить блок' }: {
  hint: string
  wishlist: Wishlist
  presents: Present[]
  schemeClass?: string
  schemeStyle?: React.CSSProperties
  onInsert: (item: LibraryItem) => void
  className?: string
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState<LibraryItem | null>(null)
  return (
    <Popover open={open} onOpenChange={value => { setOpen(value); if (!value) setHover(null) }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full border bg-background text-primary',
            'hover:scale-110 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            className,
          )}
        >
          <Plus size={15} aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" sideOffset={8} className="flex w-auto gap-4 p-3">
        <div className="flex h-[380px] w-[240px] flex-col">
          <LibraryList
            compact
            autoFocus
            onHover={setHover}
            onPick={item => { setOpen(false); setHover(null); onInsert(item) }}
          />
          <p className="mt-2 shrink-0 border-t pt-2 text-micro text-muted-foreground">
            В тексте можно набрать «/»
          </p>
        </div>
        <div className={cn('hidden w-[320px] flex-col justify-between md:flex', schemeClass)} style={schemeStyle}>
          {hover
            ? <LibraryPreview item={hover} wishlist={wishlist} presents={presents} />
            : <p className="pt-10 text-center text-body-sm text-muted-foreground">Наведите на блок, чтобы увидеть превью</p>}
          <p className="pt-3 text-caption text-muted-foreground">{hint}</p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
