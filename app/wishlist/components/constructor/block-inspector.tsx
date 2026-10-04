'use client'

import { blockIcon, viewIcon } from '@/app/wishlist/components/constructor/block-icons'
import { Field, Segmented, Toggle, ViewTiles } from '@/app/wishlist/components/constructor/controls'
import { Input } from '@/components/ui/input'
import { BLOCK_CATALOG, localDateTime } from '@/shared/editor-model'
import { Block, Wishlist } from '@/shared/types'
import * as React from 'react'
import { BlockFields } from './block-fields'

type Props = {
  block?: Block
  /** Блок один в своём ряду — тогда у него есть ширина «узкий / на всю». */
  alone: boolean
  wishlist: Wishlist
  onChange: (block: Block, key?: string) => void
  onWishlist: (patch: Partial<Wishlist>, key?: string) => void
}

/**
 * Вкладка «Блок». Правило одно для всех блоков: то, что видит гость, правится
 * прямо на странице или в полях выше, поведение блока — ниже. Секрет до даты —
 * в самом низу, у любого блока.
 */
export function BlockInspector({ block, alone, wishlist, onChange, onWishlist }: Props) {
  if (!block) {
    return (
      <p className="p-6 text-body-sm text-muted-foreground">
        Выберите блок на странице или добавьте новый: «+» между блоками или панель слева.
      </p>
    )
  }

  const info = BLOCK_CATALOG.find(item => item.type === block.type)
  const change = (patch: Partial<Block>, key?: string) => onChange({ ...block, ...patch }, key)
  const Icon = blockIcon(block.type)

  return (
    <div className="space-y-5 p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-control bg-muted text-primary">
          <Icon size={17} aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="font-bold leading-tight">{info?.label ?? 'Старый блок'}</div>
          {block.caption && <div className="truncate text-caption text-muted-foreground">добавлен как «{block.caption}»</div>}
        </div>
      </div>

      {block.type !== 'cover' && (
        <>
          <Field label="Подпись">
            <Input value={block.caption ?? ''} onChange={e => change({ caption: e.target.value }, `caption:${block.id}`)} placeholder={info?.label} />
          </Field>
          <Field label="Заголовок">
            <Input value={block.title ?? ''} onChange={e => change({ title: e.target.value }, `title:${block.id}`)} />
          </Field>
        </>
      )}

      {block.type === 'cover' && (
        <>
          <Field label="Название" hint="Его же видно в кабинете и в ссылке на страницу">
            <Input
              value={block.title ?? wishlist.title}
              onChange={e => {
                // Название обложки и вишлиста — одно и то же: человек правит
                // заголовок на странице, а в кабинете остаётся прежний.
                onChange({ ...block, title: e.target.value }, `cover-title:${block.id}`)
                onWishlist({ title: e.target.value }, `cover-title:${block.id}`)
              }}
            />
          </Field>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Field label="Дата праздника">
              <Input
                type="datetime-local"
                value={localDateTime(wishlist.eventDate)}
                onChange={e => onWishlist({ eventDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
            </Field>
          </div>
          <Field label="Повод" hint="Пишется над названием: «день рождения · 14 ноября»">
            <Input value={wishlist.occasion ?? ''} onChange={e => onWishlist({ occasion: e.target.value }, 'occasion')} placeholder="День рождения" />
          </Field>
        </>
      )}

      {info?.views && (
        <Field label={block.type === 'color_scheme' ? 'Форма' : 'Вид'}>
          <ViewTiles
            value={block.view || info.views[0][0]}
            options={info.views}
            onChange={view => change({ view })}
            icon={viewIcon}
          />
        </Field>
      )}

      {alone && (
        <Field label="Ширина">
          <Segmented
            label="Ширина блока"
            value={block.width === 'narrow' ? 'narrow' : 'full'}
            options={[['narrow', 'Узкий'], ['full', 'На всю ширину']] as const}
            onChange={width => change({ width })}
          />
        </Field>
      )}

      <BlockFields key={block.id} block={block} wishlist={wishlist} onChange={(data, key) => change({ data }, key)} />

      <div className="space-y-4 border-t pt-4">
        <Toggle label="Показывать на странице" checked={!block.hidden} onChange={visible => change({ hidden: !visible })} />
        <SecretSettings block={block} onChange={change} />
      </div>
    </div>
  )
}

/** «Секрет до даты» — не отдельный блок, а настройка любого блока. */
function SecretSettings({ block, onChange }: { block: Block; onChange: (patch: Partial<Block>, key?: string) => void }) {
  const enabled = Boolean(block.revealAt)
  const local = localDateTime(block.revealAt)
  const [date, time] = local ? local.split('T') : ['', '']
  const setDateTime = (nextDate: string, nextTime: string) => {
    if (!nextDate) return
    onChange({ revealAt: new Date(`${nextDate}T${nextTime || '00:00'}`).toISOString() })
  }

  return (
    <div className="space-y-3">
      <Toggle
        label="Секрет до даты"
        checked={enabled}
        onChange={on => onChange(on
          ? { revealAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(), secretMode: block.secretMode || 'timer' }
          : { revealAt: null })}
      />
      {enabled && (
        <>
          <Field label="Откроется">
            <div className="grid grid-cols-[1fr_96px] gap-1.5">
              <Input type="date" aria-label="Дата раскрытия" value={date} onChange={e => setDateTime(e.target.value, time)} />
              <Input type="time" aria-label="Время раскрытия" value={time} onChange={e => setDateTime(date, e.target.value)} />
            </div>
          </Field>
          <Field label="До этого гости видят">
            <div role="group" aria-label="До этого гости видят" className="flex flex-col gap-0.5 rounded-control border p-0.5">
              {([['timer', 'Замок и таймер'], ['lock', 'Только замок'], ['hidden', 'Ничего — блок скрыт']] as const).map(([value, name]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={(block.secretMode || 'timer') === value}
                  onClick={() => onChange({ secretMode: value })}
                  className={(block.secretMode || 'timer') === value
                    ? 'h-control-sm rounded-tag bg-accent text-label font-semibold text-foreground'
                    : 'h-control-sm rounded-tag text-label font-semibold text-muted-foreground hover:text-foreground'}
                >
                  {name}
                </button>
              ))}
            </div>
          </Field>
          {block.secretMode !== 'hidden' && (
            <Field label="Текст на замке">
              <Input
                maxLength={120}
                value={block.secretText ?? ''}
                placeholder="Секрет откроется на празднике"
                onChange={e => onChange({ secretText: e.target.value }, `secret:${block.id}`)}
              />
            </Field>
          )}
          <p className="text-caption text-muted-foreground">В конструкторе блок видно всегда, с пометкой «скрыт до».</p>
        </>
      )}
    </div>
  )
}
