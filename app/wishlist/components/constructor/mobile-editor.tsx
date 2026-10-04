'use client'

import { PresentsManager } from '@/app/wishlist/components/presents-manager'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import type { useWishlistDraft } from '@/hooks/use-wishlist-draft'
import { cn } from '@/lib/utils'
import { BLOCK_CATALOG } from '@/shared/editor-model'
import { nudge, readingOrder, replaceBlock } from '@/shared/layout'
import { Block, Present, Wishlist } from '@/shared/types'
import { ArrowDown, ArrowLeft, ArrowUp, Eye, Laptop, Pencil, X } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { useState } from 'react'
import { blockIcon } from './block-icons'
import { Toggle } from './controls'
import { DesignPanel } from './design-panel'
import { InlineTextEditor } from './inline-text-editor'

type Draft = ReturnType<typeof useWishlistDraft>

/**
 * Правка с телефона. Конструктор здесь не открывается: перетаскивать блоки и
 * собирать ряды на маленьком экране неудобно. Зато можно поменять тексты,
 * порядок, видимость, тему и подарки — этого хватает для большинства правок.
 */
export function MobileEditor({ wishlist, draft, presents, onShare }: {
  wishlist: Wishlist
  draft: Draft
  presents: Present[]
  onShare: () => void
}) {
  const [tab, setTab] = useState<'page' | 'presents' | 'theme'>('page')
  const [open, setOpen] = useState<string | null>(null)
  const [blocked, setBlocked] = useState(false)
  const { layout, setLayout, change } = draft
  const blocks = readingOrder(layout)

  if (blocked) return <MobileBlocked wishlist={wishlist} onClose={() => setBlocked(false)} />

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-1 px-2">
        <Link href="/wishlist" aria-label="Назад" className="flex size-control-lg items-center justify-center rounded-control-lg">
          <ArrowLeft size={20} aria-hidden />
        </Link>
        <span className="min-w-0 flex-1 truncate text-title-xs font-bold">{draft.draft.title || 'Мой праздник'}</span>
        {wishlist.shortId && (
          <a href={`/s/${wishlist.shortId}`} target="_blank" rel="noopener noreferrer" aria-label="Предпросмотр" className="flex size-control-lg items-center justify-center rounded-control-lg">
            <Eye size={20} aria-hidden />
          </a>
        )}
      </header>

      <nav aria-label="Раздел" className="mx-4 flex shrink-0 gap-0.5 rounded-control-lg border p-0.5">
        {([['page', 'Страница'], ['presents', `Подарки · ${presents.length}`], ['theme', 'Тема']] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
            className={cn('h-control flex-1 rounded-control text-body-sm font-semibold transition-colors duration-fast', tab === value ? 'bg-accent text-foreground' : 'text-muted-foreground')}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {tab === 'page' && (
          <div className="space-y-2.5">
            {blocks.map((block, index) => (
              <MobileBlockCard
                key={block.id}
                block={block}
                open={open === block.id}
                first={index === 0}
                last={index === blocks.length - 1}
                onOpen={() => setOpen(open === block.id ? null : block.id)}
                onChange={(next, key) => setLayout(replaceBlock(layout, next), key)}
                onMove={direction => setLayout(nudge(layout, block.id, direction))}
              />
            ))}
            <button
              type="button"
              onClick={() => setBlocked(true)}
              className="flex w-full items-center gap-3 rounded-card border border-dashed p-4 text-left text-body-sm text-muted-foreground"
            >
              <Laptop size={20} className="shrink-0" aria-hidden />
              Новые блоки и свободная раскладка — в конструкторе на компьютере
            </button>
          </div>
        )}
        {tab === 'presents' && <PresentsManager wishlist={draft.draft} presents={presents} />}
        {tab === 'theme' && <div className="-mx-1"><DesignPanel settings={draft.draft.settings} onChange={(settings, key) => change({ settings }, key)} /></div>}
      </main>

      <footer className="flex shrink-0 items-center gap-3 border-t px-4 py-3">
        <span role="status" className={cn('flex-1 text-body-sm', draft.error ? 'text-destructive' : 'text-muted-foreground')}>{draft.status}</span>
        <button type="button" onClick={onShare} className="h-control-lg rounded-control-lg bg-brand px-7 text-lead font-bold text-white transition-transform duration-fast active:scale-[.97]">
          Поделиться
        </button>
      </footer>
    </div>
  )
}

function MobileBlockCard({ block, open, first, last, onOpen, onChange, onMove }: {
  block: Block
  open: boolean
  first: boolean
  last: boolean
  onOpen: () => void
  onChange: (block: Block, key?: string) => void
  onMove: (direction: -1 | 1) => void
}) {
  const info = BLOCK_CATALOG.find(c => c.type === block.type)
  const Icon = blockIcon(block.type)
  const subtitle = block.type === 'cover' ? block.title : block.title || (typeof block.data.name === 'string' ? block.data.name : '') || block.caption
  return (
    <article className={cn('rounded-card border bg-card', open && 'ring-2 ring-primary', block.hidden && !open && 'opacity-60')}>
      <div className="flex items-center gap-3 p-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-muted text-primary"><Icon size={17} aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <div className="text-caption text-muted-foreground">{block.caption || info?.label}{block.hidden && ' · скрыт'}</div>
          <div className="truncate text-body font-semibold">{subtitle || info?.label}</div>
        </div>
        {open ? (
          <>
            <button type="button" aria-label="Выше" disabled={first} onClick={() => onMove(-1)} className="flex h-11 w-9 items-center justify-center text-muted-foreground disabled:opacity-30"><ArrowUp size={18} aria-hidden /></button>
            <button type="button" aria-label="Ниже" disabled={last} onClick={() => onMove(1)} className="flex h-11 w-9 items-center justify-center text-muted-foreground disabled:opacity-30"><ArrowDown size={18} aria-hidden /></button>
          </>
        ) : (
          <button type="button" aria-label="Изменить" onClick={onOpen} className="flex size-control-lg items-center justify-center rounded-control-lg text-muted-foreground"><Pencil size={17} aria-hidden /></button>
        )}
      </div>
      {open && (
        <div className="space-y-3 border-t p-3.5">
          {block.type !== 'cover' && (
            <Input aria-label="Подпись" placeholder="Подпись" value={block.caption ?? ''} onChange={e => onChange({ ...block, caption: e.target.value }, `caption:${block.id}`)} />
          )}
          <Input aria-label="Заголовок" placeholder="Заголовок" value={block.title ?? ''} onChange={e => onChange({ ...block, title: e.target.value }, `title:${block.id}`)} />
          {block.type === 'text' && (
            <div className="rounded-control-lg border p-3">
              <InlineTextEditor
                html={String(block.data.html ?? '')}
                onChange={html => onChange({ ...block, data: { ...block.data, html } }, `text:${block.id}`)}
              />
            </div>
          )}
          {block.type === 'cover' && (
            <Input
              aria-label="Подзаголовок"
              placeholder="Подзаголовок"
              value={String(block.data.subtitle ?? '')}
              onChange={e => onChange({ ...block, data: { ...block.data, subtitle: e.target.value } }, `subtitle:${block.id}`)}
            />
          )}
          <Toggle label="Показывать" checked={!block.hidden} onChange={visible => onChange({ ...block, hidden: !visible })} />
          <button type="button" onClick={onOpen} className="h-control-lg w-full rounded-control-lg bg-accent text-body-sm font-semibold">Готово</button>
        </div>
      )}
    </article>
  )
}

/** «Конструктор открывается на компьютере» — экран из макета, без почты. */
function MobileBlocked({ wishlist, onClose }: { wishlist: Wishlist; onClose: () => void }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/wishlist/edit/${wishlist.id}`)
      toast({ title: 'Ссылка на конструктор скопирована', description: 'Откройте её на компьютере.' })
    } catch {
      toast({ title: 'Не удалось скопировать', variant: 'destructive' })
    }
  }
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background text-foreground">
      <header className="flex h-14 items-center px-3">
        <button type="button" aria-label="Закрыть" onClick={onClose} className="flex size-control-lg items-center justify-center"><X size={20} aria-hidden /></button>
      </header>
      <div className="flex flex-1 flex-col items-center gap-4 px-7 pt-6 text-center">
        <Laptop size={96} strokeWidth={1.2} className="mt-6 text-muted-foreground" aria-hidden />
        <h1 className="text-title font-extrabold">Конструктор открывается на компьютере</h1>
        <p className="text-body leading-relaxed text-muted-foreground">
          Перетаскивать блоки на маленьком экране неудобно. С телефона можно менять тексты, тему и подарки — этого хватает для большинства правок.
        </p>
      </div>
      <div className="flex flex-col gap-2.5 px-5 pb-8 pt-5">
        <button type="button" onClick={onClose} className="h-control-lg rounded-control-lg bg-brand text-lead font-bold text-white transition-transform duration-fast active:scale-[.97]">Править на телефоне</button>
        <button type="button" onClick={copy} className="h-control-lg text-body font-semibold text-muted-foreground">Скопировать ссылку</button>
      </div>
    </div>
  )
}
