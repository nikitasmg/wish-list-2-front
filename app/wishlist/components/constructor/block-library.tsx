'use client'

import { blockIcon } from '@/app/wishlist/components/constructor/block-icons'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { BLOCK_LIBRARY, LibraryItem } from '@/shared/editor-model'
import { Search } from 'lucide-react'
import * as React from 'react'
import { useMemo, useState } from 'react'

/**
 * Библиотека блоков — постоянная колонка слева.
 *
 * Раньше это был свёрнутый «Добавить блок» над холстом: чтобы поставить блок,
 * человек сначала вспоминал, что список вообще есть. Открытый список сам
 * показывает, из чего собирается страница.
 */
export function BlockLibrary({ onAdd }: { onAdd: (item: LibraryItem) => void }) {
  const [query, setQuery] = useState('')

  const items = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('ru')
    if (!q) return BLOCK_LIBRARY
    // Ищем и по группе: «гости» должно показывать всю группу целиком.
    return BLOCK_LIBRARY.filter(item =>
      item.label.toLocaleLowerCase('ru').includes(q) ||
      item.group.toLocaleLowerCase('ru').includes(q) ||
      (item.hint ?? '').toLocaleLowerCase('ru').includes(q),
    )
  }, [query])

  const groups = useMemo(() => Array.from(new Set(items.map(i => i.group))), [items])

  return (
    <aside
      data-tour="block-palette"
      className="flex h-full min-h-0 flex-col gap-3 border-r bg-background p-3"
    >
      <label className="flex h-9 items-center gap-2 rounded-xl border px-2.5 text-muted-foreground focus-within:ring-2 focus-within:ring-ring">
        <Search size={15} aria-hidden />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Найти блок"
          aria-label="Найти блок"
          className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
        />
      </label>

      <div className="-mr-1 flex-1 space-y-4 overflow-y-auto pr-1">
        {groups.map(group => (
          <div key={group}>
            <p className="px-2.5 pb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              {group}
            </p>
            {items.filter(i => i.group === group).map(item => {
              const Icon = blockIcon(item.type, item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onAdd(item)}
                  className={cn(
                    'flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] font-medium',
                    'text-foreground/80 hover:bg-accent hover:text-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                >
                  <Icon size={16} className="shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate">{item.label}</span>
                  {item.hint && (
                    <span className="ml-auto shrink-0 text-[10px] font-semibold text-muted-foreground">
                      {item.hint}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}

        {!items.length && (
          <p className="px-2.5 py-6 text-sm text-muted-foreground">Ничего не найдено</p>
        )}
      </div>
    </aside>
  )
}
