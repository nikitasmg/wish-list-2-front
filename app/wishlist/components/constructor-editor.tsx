'use client'

import { useApiGetAllPresents } from '@/api/present'
import { GuestBlockView } from '@/app/s/[shortId]/components/blocks/guest-block-view'
import { WishlistLanding } from '@/app/s/[shortId]/components/wishlist-landing'
import { PresentsManager } from '@/app/wishlist/components/presents-manager'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { useConstructorTour } from '@/hooks/use-constructor-tour'
import { useWishlistDraft } from '@/hooks/use-wishlist-draft'
import { cn } from '@/lib/utils'
import { colorSchema, normalizeScheme } from '@/shared/constants'
import { BLOCK_CATALOG, LibraryItem, libraryBlock } from '@/shared/editor-model'
import { insertRow, layoutRows, moveToCell, moveToRow, nudge, placeBeside, replaceBlock } from '@/shared/layout'
import { pageLook, schemeLook } from '@/shared/look'
import { Wishlist } from '@/shared/types'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { CircleHelp, ListTree, Palette, Plus, Undo2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { AccessPanel } from './constructor/access-panel'
import { BlockCanvas, DragData, DropData, Selection } from './constructor/block-canvas'
import { blockIcon } from './constructor/block-icons'
import { BlockInspector } from './constructor/block-inspector'
import { DesignPanel } from './constructor/design-panel'
import { EditorHeader, EditorMode, IconButton } from './constructor/editor-header'
import { LibraryList } from './constructor/insert-menu'
import { MobileEditor } from './constructor/mobile-editor'
import { RowInspector } from './constructor/row-inspector'
import { StructurePanel } from './constructor/structure-panel'

export function ConstructorEditor({ wishlist }: { wishlist: Wishlist }) {
  return <Editor key={wishlist.id} wishlist={wishlist} />
}

type Panel = 'add' | 'structure' | null
type Tab = 'block' | 'design' | 'access'

const GUEST_BLOCKS = ['rsvp', 'poll', 'playlist', 'guestbook']

/**
 * Конструктор по макету: шапка, рельс слева (добавить блок, структура,
 * оформление, отменить), холст по центру и инспектор справа — «Блок» или
 * «Ряд», «Оформление», «Доступ».
 *
 * Редактор занимает весь экран: у него своя шапка, и шапка сайта над ней
 * только отнимала бы высоту у холста.
 */
function Editor({ wishlist }: { wishlist: Wishlist }) {
  const draftState = useWishlistDraft(wishlist)
  const { draft, layout, change, setLayout, undo, redo, status, error, retry } = draftState
  const [autoAdd] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('add') === 'gift')
  const [mode, setMode] = useState<EditorMode>(autoAdd ? 'presents' : 'page')
  const [panel, setPanel] = useState<Panel>(null)
  const [tab, setTab] = useState<Tab>('block')
  const [device, setDevice] = useState<'desktop' | 'phone'>('desktop')
  const [selection, setSelection] = useState<Selection>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const narrow = useNarrowScreen()
  const { data: presentsData } = useApiGetAllPresents(wishlist.id)
  const presents = presentsData?.data ?? []
  const { startTour } = useConstructorTour()

  const scheme = normalizeScheme(draft.settings.colorScheme)
  const schemeInfo = colorSchema.find(s => s.value === scheme)
  const look = pageLook(draft.settings)
  const schemeOnly = schemeLook(draft.settings)

  const selectedBlock = selection?.kind === 'block' ? layout.blocks.find(b => b.id === selection.id) : undefined
  const selectedRowColumns = selectedBlock ? layoutRows(layout)[selectedBlock.row]?.settings.columns ?? 1 : 1

  const select = useCallback((next: Selection) => {
    setSelection(next)
    if (next) setTab('block')
  }, [])

  const copyLink = async () => {
    const url = `${window.location.origin}/s/${wishlist.shortId}`
    try {
      if (narrow && navigator.share) { await navigator.share({ title: draft.title, url }); return }
      await navigator.clipboard.writeText(url)
      toast({ title: 'Ссылка скопирована', description: 'Отправьте её гостям — регистрация им не нужна.' })
    } catch {
      toast({ title: 'Не удалось скопировать ссылку', variant: 'destructive' })
    }
  }

  const insert = (item: LibraryItem) => {
    const block = libraryBlock(item)
    // Блок встаёт под выделенным, а без выделения — в конец страницы.
    const anchor = selectedBlock ? selectedBlock.row + 1 : layout.rows.length
    setLayout(insertRow(layout, anchor, block))
    select({ kind: 'block', id: block.id })
  }

  // Клавиатура: отмена/повтор и Alt+стрелки. В полях ввода отмену оставляем
  // браузеру — там Ctrl+Z должен откатывать набранные буквы, а не всю правку.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const editing = target.closest('input, textarea, [contenteditable="true"]')
      const mod = event.ctrlKey || event.metaKey
      if (mod && !editing && event.code === 'KeyZ') {
        event.preventDefault()
        if (event.shiftKey) redo(); else undo()
      } else if (mod && !editing && event.code === 'KeyY') {
        event.preventDefault(); redo()
      } else if (event.altKey && selection?.kind === 'block' && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        event.preventDefault()
        setLayout(nudge(layout, selection.id, event.key === 'ArrowUp' ? -1 : 1))
      } else if (event.key === 'Escape' && !editing && !dragId) {
        setSelection(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, selection, layout, setLayout, dragId])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const onDragStart = (event: DragStartEvent) => setDragId((event.active.data.current as DragData).blockId)
  const onDragEnd = (event: DragEndEvent) => {
    setDragId(null)
    const drag = event.active.data.current as DragData | undefined
    const drop = event.over?.data.current as DropData | undefined
    if (!drag || !drop) return
    const next = drop.kind === 'gap' ? moveToRow(layout, drag.blockId, drop.at)
      : drop.kind === 'side' ? placeBeside(layout, drag.blockId, drop.target, drop.side)
      : moveToCell(layout, drag.blockId, drop.row, drop.col)
    if (next !== layout) setLayout(next)
    select({ kind: 'block', id: drag.blockId })
  }

  if (narrow) {
    return (
      <MobileEditor
        wishlist={wishlist}
        draft={draftState}
        presents={presents}
        onShare={copyLink}
      />
    )
  }

  const dragBlock = dragId ? layout.blocks.find(b => b.id === dragId) : undefined
  const DragIcon = dragBlock ? blockIcon(dragBlock.type) : Plus
  const hasGuestBlocks = layout.blocks.some(b => GUEST_BLOCKS.includes(b.type))

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background text-foreground">
      <EditorHeader
        title={draft.title}
        templateName={draft.templateName}
        status={status}
        error={error != null}
        mode={mode}
        presentsCount={presents.length}
        onMode={setMode}
        scheme={{ name: schemeInfo?.name ?? 'Своя', colors: schemeInfo?.colors ?? ['#101216', draft.settings.customScheme?.accent ?? '#FF8A65'] }}
        onScheme={() => { setMode('page'); setTab('design') }}
        device={device}
        onDevice={setDevice}
        canUndo={draftState.canUndo}
        canRedo={draftState.canRedo}
        onUndo={undo}
        onRedo={redo}
        onShare={copyLink}
      />

      {error != null && (
        <div role="alert" className="flex flex-wrap items-center gap-3 border-b border-destructive bg-destructive/10 px-4 py-2 text-sm">
          <span className="flex-1">Изменения не сохранились. Черновик остался в редакторе.</span>
          <Button size="sm" variant="outline" onClick={() => void retry()}>Повторить</Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'wishlist-draft.json'
              a.click()
              setTimeout(() => URL.revokeObjectURL(url), 1000)
            }}
          >
            Скачать черновик
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (window.confirm('Локальные несохранённые изменения будут потеряны. Загрузить серверную версию?')) window.location.reload()
            }}
          >
            Загрузить актуальную
          </Button>
        </div>
      )}

      {mode === 'page' && (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setDragId(null)}
        >
          <div className="flex min-h-0 flex-1">
            <nav aria-label="Инструменты" data-tour="block-palette" className="flex w-14 shrink-0 flex-col items-center gap-1.5 border-r py-3">
              <IconButton label="Добавить блок" active={panel === 'add'} onClick={() => setPanel(panel === 'add' ? null : 'add')}><Plus size={20} aria-hidden /></IconButton>
              <IconButton label="Структура" active={panel === 'structure'} onClick={() => setPanel(panel === 'structure' ? null : 'structure')}><ListTree size={20} aria-hidden /></IconButton>
              <IconButton label="Оформление" active={tab === 'design'} onClick={() => setTab('design')}><Palette size={20} aria-hidden /></IconButton>
              <div className="flex-1" />
              <IconButton label="Отменить (Ctrl+Z)" disabled={!draftState.canUndo} onClick={undo}><Undo2 size={18} aria-hidden /></IconButton>
              <IconButton label="Как пользоваться редактором" onClick={startTour}><CircleHelp size={18} aria-hidden /></IconButton>
            </nav>

            {panel && (
              <aside className="flex w-[264px] shrink-0 flex-col border-r p-3">
                <div className="px-1.5 pb-3 text-[15px] font-bold">{panel === 'add' ? 'Добавить блок' : 'Структура'}</div>
                {panel === 'add'
                  ? <LibraryList onPick={insert} />
                  : <StructurePanel layout={layout} selection={selection} onSelect={select} onLayout={setLayout} />}
              </aside>
            )}

            <BlockCanvas
              wishlist={draft}
              layout={layout}
              presents={presents}
              selection={selection}
              phone={device === 'phone'}
              schemeClass={look.className}
              schemeStyle={look.style}
              onSelect={select}
              onLayout={setLayout}
            />

            <aside className="flex w-[340px] shrink-0 flex-col border-l">
              <nav className="flex shrink-0 gap-5 border-b px-5" aria-label="Настройки">
                {([['block', selection?.kind === 'row' ? 'Ряд' : 'Блок'], ['design', 'Оформление'], ['access', 'Доступ']] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={tab === value}
                    onClick={() => setTab(value)}
                    className={cn(
                      'h-[46px] border-b-2 text-sm transition-colors',
                      tab === value ? 'border-primary font-bold text-foreground' : 'border-transparent font-semibold text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </nav>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {tab === 'block' && selection?.kind === 'row' && (
                  <RowInspector layout={layout} index={selection.index} onLayout={setLayout} onDone={() => setSelection(null)} />
                )}
                {tab === 'block' && selection?.kind !== 'row' && (
                  <BlockInspector
                    block={selectedBlock}
                    alone={selectedRowColumns === 1}
                    wishlist={draft}
                    onChange={(block, key) => setLayout(replaceBlock(layout, block), key)}
                    onWishlist={change}
                  />
                )}
                {tab === 'design' && (
                  <DesignPanel settings={draft.settings} onChange={(settings, key) => change({ settings }, key)} />
                )}
                {tab === 'access' && (
                  <AccessPanel
                    wishlist={draft}
                    onSettings={settings => change({ settings })}
                    onCopy={copyLink}
                    hasGuestBlocks={hasGuestBlocks}
                    onResponses={() => setMode('responses')}
                  />
                )}
              </div>
            </aside>
          </div>

          <DragOverlay dropAnimation={null}>
            {dragBlock && (
              <div className="flex items-center gap-2 rounded-xl border bg-popover px-3 py-2 text-sm font-semibold shadow-2xl">
                <DragIcon size={15} className="text-primary" aria-hidden />
                {dragBlock.caption || BLOCK_CATALOG.find(c => c.type === dragBlock.type)?.label}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {mode === 'preview' && (
        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/50 p-6">
          <div className={cn('mx-auto overflow-hidden rounded-2xl border shadow-2xl', device === 'phone' ? 'w-[390px] max-w-full' : 'max-w-[1280px]')}>
            <WishlistLanding wishlist={draft} presents={presents} isMyWishlist={false} disableBodyTheme />
          </div>
        </div>
      )}

      {mode === 'presents' && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <PresentsManager wishlist={draft} presents={presents} autoAdd={autoAdd} />
        </div>
      )}

      {mode === 'responses' && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-6 p-6">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-2xl font-extrabold">Ответы гостей</h1>
              <Button variant="outline" onClick={() => setMode('page')}>К странице</Button>
            </div>
            {(wishlist.blocks ?? []).filter(b => GUEST_BLOCKS.includes(b.type)).map(b => (
              <section key={b.id} className={cn('space-y-4 rounded-2xl border p-5', schemeOnly.className)} style={schemeOnly.style}>
                <h2 className="text-xl font-bold">
                  {b.title || BLOCK_CATALOG.find(c => c.type === b.type)?.label}
                </h2>
                <GuestBlockView block={b} wishlistId={wishlist.id} owner />
              </section>
            ))}
            <p className="text-sm text-muted-foreground">Показаны сохранённые блоки. Новый блок появится здесь после сохранения.</p>
          </div>
        </div>
      )}
    </div>
  )
}

/** Узкий экран: конструктор там не открывается — по макету только простая правка. */
function useNarrowScreen() {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 1023px)')
    setNarrow(query.matches)
    const onChange = (event: MediaQueryListEvent) => setNarrow(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return narrow
}

