'use client'

import { blockIcon, viewIcon } from '@/app/wishlist/components/constructor/block-icons'
import { Field, Segmented, Toggle, ViewTiles } from '@/app/wishlist/components/constructor/controls'
import { Input } from '@/components/ui/input'
import { BLOCK_CATALOG, localDateTime } from '@/shared/editor-model'
import { Block } from '@/shared/types'
import { BlockFields } from './block-fields'

export function BlockInspector({ block, onChange }: { block?: Block; onChange: (block: Block) => void }) {
  if (!block) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Выберите блок на странице или добавьте новый из библиотеки слева.
      </p>
    )
  }

  const info = BLOCK_CATALOG.find(item => item.type === block.type)
  const change = (patch: Partial<Block>) => onChange({ ...block, ...patch })
  const Icon = blockIcon(block.type)

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary">
          <Icon size={17} aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="font-bold leading-tight">{info?.label ?? 'Старый блок'}</div>
          {block.caption && (
            <div className="truncate text-xs text-muted-foreground">добавлен как «{block.caption}»</div>
          )}
        </div>
      </div>

      <Field label="Подпись">
        <Input value={block.caption ?? ''} onChange={e => change({ caption: e.target.value })} />
      </Field>
      <Field label="Заголовок">
        <Input value={block.title ?? ''} onChange={e => change({ title: e.target.value })} />
      </Field>

      {info?.views && (
        <Field label="Вид">
          <ViewTiles
            value={block.view ?? info.views[0][0]}
            options={info.views}
            onChange={view => change({ view })}
            icon={viewIcon}
          />
        </Field>
      )}

      <Field label="Ширина">
        <Segmented
          label="Ширина блока"
          value={block.colSpan === 2 ? 'full' : 'half'}
          options={[['half', 'Половина'], ['full', 'На всю']] as const}
          onChange={width => change({ colSpan: width === 'full' ? 2 : 1 })}
        />
      </Field>

      <BlockFields key={block.id} block={block} onChange={data => change({ data })} />

      <div className="space-y-4 border-t pt-4">
        <Toggle
          label="Показывать на странице"
          checked={!block.hidden}
          onChange={visible => change({ hidden: !visible })}
        />
        <Field label="Секрет до даты" hint="Пока дата не наступила, гость видит только обратный отсчёт.">
          <Input
            type="datetime-local"
            value={localDateTime(block.revealAt)}
            onChange={e => change({ revealAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
          />
        </Field>
      </div>
    </div>
  )
}
