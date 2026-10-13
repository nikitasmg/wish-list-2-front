'use client'

import { useApiGetAllPresents } from '@/api/present'
import { BlockContent } from '@/app/s/[shortId]/components/blocks/block-renderer'
import { GuestBlockView } from '@/app/s/[shortId]/components/blocks/guest-block-view'
import { WishlistLanding } from '@/app/s/[shortId]/components/wishlist-landing'
import { PresentsManager } from '@/app/wishlist/components/presents-manager'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { InputDensity } from '@/components/ui/input-density'
import { ToastAction } from '@/components/ui/toast'
import { toast } from '@/hooks/use-toast'
import { useConstructorTour } from '@/hooks/use-constructor-tour'
import { useWishlistDraft } from '@/hooks/use-wishlist-draft'
import { cn } from '@/lib/utils'
import { colorSchema, CUSTOM_ACCENTS, CUSTOM_BASES, normalizeScheme } from '@/shared/constants'
import { BLOCK_CATALOG, LibraryItem, libraryBlock } from '@/shared/editor-model'
import { insertRow, layoutRows, moveToCell, moveToRow, nudge, placeBeside, removeBlock, replaceBlock } from '@/shared/layout'
import { pageLook, schemeLook, withoutPattern } from '@/shared/look'
import { Wishlist } from '@/shared/types'
import {
  CollisionDetection,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  Modifier,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { CircleHelp, ListTree, Palette, Plus, Undo2, Users, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { AccessPanel } from './constructor/access-panel'
import { BlockCanvas, DragData, DropData, Selection } from './constructor/block-canvas'
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

type Panel = 'add' | 'structure' | 'design' | 'access' | null

const PANEL_TITLE: Record<Exclude<Panel, null>, string> = {
  add: 'Добавить блок',
  structure: 'Структура',
  design: 'Оформление страницы',
  access: 'Доступ',
}

const GUEST_BLOCKS = ['rsvp', 'poll', 'playlist', 'guestbook']

/** Выше этого блок под курсором обрезается: длинный вишлист закрыл бы весь холст. */
const PREVIEW_MAX = 360

/**
 * Обрезанное превью держим под курсором: блок, взятый за низ, иначе уехал бы
 * вверх и тащить пришлось бы пустоту.
 */
const keepUnderCursor: Modifier = ({ transform, activatorEvent, activeNodeRect }) => {
  if (!activeNodeRect || !(activatorEvent instanceof PointerEvent)) return transform
  const below = activatorEvent.clientY - activeNodeRect.top - (PREVIEW_MAX - 48)
  return below > 0 ? { ...transform, y: transform.y + below } : transform
}

/** Край соседа важнее промежутка: их цели перекрываются у углов блока. */
const sideFirst: CollisionDetection = args => {
  const hits = pointerWithin(args)
  const side = hits.find(hit => String(hit.id).startsWith('side-'))
  return side ? [side] : hits
}

/**
 * Конструктор по макету: шапка, рельс слева (добавить блок, структура,
 * оформление, доступ, отменить), холст по центру и инспектор справа.
 *
 * Справа — только выделенное: блок или ряд. Настройки всей страницы живут
 * слева, иначе «Оформление» и «Доступ» читаются как настройки блока.
 *
 * Редактор занимает весь экран: у него своя шапка, и шапка сайта над ней
 * только отнимала бы высоту у холста.
 */
function Editor({ wishlist }: { wishlist: Wishlist }) {
  const draftState = useWishlistDraft(wishlist)
  const { draft, layout, change, setLayout, undo, redo, status, error, retry } = draftState
  const [autoAdd] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('add') === 'gift')
  const [mode, setMode] = useState<EditorMode>(autoAdd ? 'presents' : 'page')
  // Форма подарка открыта сразу: пришли по «+» из кабинета или из блока вишлиста.
  const [giftForm, setGiftForm] = useState(autoAdd)
  const addGifts = () => { setGiftForm(true); setMode('presents') }
  const [panel, setPanel] = useState<Panel>(null)
  const [device, setDevice] = useState<'desktop' | 'phone'>('desktop')
  const [selection, setSelection] = useState<Selection>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [askReload, setAskReload] = useState(false)
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

  const select = setSelection

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

  // Без вопроса «точно удалить?»: ошибку исправляет «Отменить» в тосте и Ctrl+Z.
  const remove = useCallback((blockId: string) => {
    setLayout(removeBlock(layout, blockId))
    setSelection(null)
    toast({ title: 'Блок удалён', action: <ToastAction altText="Вернуть блок" onClick={undo}>Отменить</ToastAction> })
  }, [layout, setLayout, undo])

  // Клавиатура: отмена/повтор, удаление и Alt+стрелки. В полях ввода отмену оставляем
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
      } else if ((event.key === 'Backspace' || event.key === 'Delete') && !editing && !dragId && selection?.kind === 'block') {
        // Только с холста: Backspace на кнопке в панели настроек блок не трогает.
        if (target !== document.body && !target.closest('[data-tour="block-canvas"]')) return
        event.preventDefault()
        remove(selection.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, selection, layout, setLayout, dragId, remove])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const onDragStart = (event: DragStartEvent) => {
    // Блок с текстом берётся за сам текст: нажатие успело поставить в него
    // курсор и начать выделение — на время переноса снимаем и то и другое.
    if (document.activeElement instanceof HTMLElement && document.activeElement.isContentEditable) document.activeElement.blur()
    window.getSelection()?.removeAllRanges()
    setDragId((event.active.data.current as DragData).blockId)
  }
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

  const leaveDialog = (
    <ConfirmDialog
      open={draftState.leave.asking}
      title="Уйти из редактора?"
      description="Последние правки ещё не сохранились — они потеряются."
      confirmLabel="Уйти без сохранения"
      cancelLabel="Остаться"
      onConfirm={draftState.leave.confirm}
      onCancel={draftState.leave.cancel}
    />
  )

  if (narrow) {
    return (
      <>
        <MobileEditor
          wishlist={wishlist}
          draft={draftState}
          presents={presents}
          onShare={copyLink}
        />
        {leaveDialog}
      </>
    )
  }

  const dragBlock = dragId ? layout.blocks.find(b => b.id === dragId) : undefined
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
        onMode={next => { setGiftForm(false); setMode(next) }}
        scheme={{ name: schemeInfo?.name ?? 'Своя', colors: schemeInfo?.colors ?? [CUSTOM_BASES.dark, draft.settings.customScheme?.accent ?? CUSTOM_ACCENTS[0].dark] }}
        onScheme={() => { setMode('page'); setPanel('design') }}
        device={device}
        onDevice={setDevice}
        canUndo={draftState.canUndo}
        canRedo={draftState.canRedo}
        onUndo={undo}
        onRedo={redo}
        onShare={copyLink}
      />

      {error != null && (
        <div role="alert" className="flex flex-wrap items-center gap-3 border-b border-destructive bg-destructive/10 px-4 py-2 text-body-sm">
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
            onClick={() => setAskReload(true)}
          >
            Загрузить актуальную
          </Button>
        </div>
      )}

      {mode === 'page' && (
        <DndContext
          sensors={sensors}
          collisionDetection={sideFirst}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setDragId(null)}
        >
          <div className="flex min-h-0 flex-1">
            <nav aria-label="Инструменты" data-tour="block-palette" className="flex w-14 shrink-0 flex-col items-center gap-1.5 border-r py-3">
              <IconButton label="Добавить блок" active={panel === 'add'} onClick={() => setPanel(panel === 'add' ? null : 'add')}><Plus size={20} aria-hidden /></IconButton>
              <IconButton label="Структура" active={panel === 'structure'} onClick={() => setPanel(panel === 'structure' ? null : 'structure')}><ListTree size={20} aria-hidden /></IconButton>
              <IconButton label="Оформление страницы" active={panel === 'design'} onClick={() => setPanel(panel === 'design' ? null : 'design')}><Palette size={20} aria-hidden /></IconButton>
              <IconButton label="Доступ" active={panel === 'access'} onClick={() => setPanel(panel === 'access' ? null : 'access')}><Users size={20} aria-hidden /></IconButton>
              <div className="flex-1" />
              <IconButton label="Отменить (Ctrl+Z)" disabled={!draftState.canUndo} onClick={undo}><Undo2 size={18} aria-hidden /></IconButton>
              <IconButton label="Как пользоваться редактором" onClick={startTour}><CircleHelp size={18} aria-hidden /></IconButton>
            </nav>

            {panel && (
              <aside className={cn('flex shrink-0 flex-col border-r', panel === 'design' || panel === 'access' ? 'w-[320px]' : 'w-[264px]')}>
                <div className="flex shrink-0 items-center justify-between gap-2 py-2 pl-5 pr-2">
                  <span className="text-body font-bold">{PANEL_TITLE[panel]}</span>
                  <IconButton label="Закрыть панель" onClick={() => setPanel(null)}><X size={16} aria-hidden /></IconButton>
                </div>
                <InputDensity value="md">
                  {(panel === 'add' || panel === 'structure') && (
                    <div className="flex min-h-0 flex-1 flex-col px-3 pb-3">
                      {panel === 'add'
                        ? <LibraryList onPick={insert} />
                        : <StructurePanel layout={layout} selection={selection} onSelect={select} onLayout={setLayout} />}
                    </div>
                  )}
                  {panel === 'design' && (
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      <DesignPanel settings={draft.settings} onChange={(settings, key) => change({ settings }, key)} />
                    </div>
                  )}
                  {panel === 'access' && (
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      <AccessPanel
                        wishlist={draft}
                        onSettings={settings => change({ settings })}
                        onCopy={copyLink}
                        hasGuestBlocks={hasGuestBlocks}
                        onResponses={() => setMode('responses')}
                      />
                    </div>
                  )}
                </InputDensity>
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
              onRemove={remove}
              onAddGifts={addGifts}
            />

            <aside aria-label={selection?.kind === 'row' ? 'Настройки ряда' : 'Настройки блока'} className="flex w-[340px] shrink-0 flex-col border-l">
              {/* Панели плотные, как в макете инспектора: поля 40px, а не 48. */}
              <InputDensity value="md">
              <div className="min-h-0 flex-1 overflow-y-auto">
                {selection?.kind === 'row' && (
                  <RowInspector layout={layout} index={selection.index} onLayout={setLayout} onDone={() => setSelection(null)} />
                )}
                {selection?.kind !== 'row' && (
                  <BlockInspector
                    block={selectedBlock}
                    alone={selectedRowColumns === 1}
                    wishlist={draft}
                    onChange={(block, key) => setLayout(replaceBlock(layout, block), key)}
                    onWishlist={change}
                  />
                )}
              </div>
              </InputDensity>
            </aside>
          </div>

          {/* За курсором идёт сам блок, в схеме страницы: оверлей рисуется вне листа. */}
          <DragOverlay dropAnimation={null} modifiers={[keepUnderCursor]}>
            {dragBlock && (
              <div
                inert
                className={cn('pointer-events-none w-full select-none overflow-hidden rounded-card bg-background text-foreground opacity-90 shadow-float', withoutPattern(look.className))}
                style={{ ...look.style, maxHeight: PREVIEW_MAX }}
              >
                <BlockContent block={{ ...dragBlock, hidden: false, revealAt: null }} wishlist={draft} presents={presents} preview />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {mode === 'preview' && (
        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/50 p-6">
          <div className={cn('mx-auto overflow-hidden rounded-card border shadow-overlay', device === 'phone' ? 'w-[390px] max-w-full' : 'max-w-[1280px]')}>
            <WishlistLanding wishlist={draft} presents={presents} isMyWishlist={false} disableBodyTheme />
          </div>
        </div>
      )}

      {mode === 'presents' && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <PresentsManager wishlist={draft} presents={presents} autoAdd={giftForm} />
        </div>
      )}

      {mode === 'responses' && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-6 p-6">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-title font-extrabold">Ответы гостей</h1>
              <Button variant="outline" onClick={() => setMode('page')}>К странице</Button>
            </div>
            {(wishlist.blocks ?? []).filter(b => GUEST_BLOCKS.includes(b.type)).map(b => (
              <section key={b.id} className={cn('space-y-4 rounded-card border p-5', schemeOnly.className)} style={schemeOnly.style}>
                <h2 className="text-title-sm font-bold">
                  {b.title || BLOCK_CATALOG.find(c => c.type === b.type)?.label}
                </h2>
                <GuestBlockView block={b} wishlistId={wishlist.id} owner />
              </section>
            ))}
            <p className="text-body-sm text-muted-foreground">Показаны сохранённые блоки. Новый блок появится здесь после сохранения.</p>
          </div>
        </div>
      )}

      {leaveDialog}
      <ConfirmDialog
        open={askReload}
        title="Загрузить серверную версию?"
        description="Несохранённые правки из этой вкладки потеряются."
        confirmLabel="Загрузить"
        onConfirm={() => window.location.reload()}
        onCancel={() => setAskReload(false)}
      />
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

