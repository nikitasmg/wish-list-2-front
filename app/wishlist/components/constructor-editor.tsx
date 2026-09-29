'use client'

import { useApiGetAllPresents } from '@/api/present'
import { GuestBlockView } from '@/app/s/[shortId]/components/blocks/guest-block-view'
import { WishlistLanding } from '@/app/s/[shortId]/components/wishlist-landing'
import { PresentsManager } from '@/app/wishlist/components/presents-manager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { useConstructorTour } from '@/hooks/use-constructor-tour'
import { useWishlistDraft } from '@/hooks/use-wishlist-draft'
import { cn } from '@/lib/utils'
import { colorSchema, normalizeScheme } from '@/shared/constants'
import { deriveSchemeStyle } from '@/shared/derive-scheme'
import { appendLibraryBlock, localDateTime } from '@/shared/editor-model'
import { resizeBlock } from '@/shared/grid'
import { Wishlist } from '@/shared/types'
import { CircleHelp, Eye, Link2, Monitor, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { ColorsSelect } from './colors-select'
import { BlockCanvas } from './constructor/block-canvas'
import { BlockInspector } from './constructor/block-inspector'
import { BlockLibrary } from './constructor/block-library'
import { Toggle } from './constructor/controls'

export function ConstructorEditor({ wishlist }: { wishlist: Wishlist }) {
  return <Editor key={wishlist.id} wishlist={wishlist} />
}

type Mode = 'editor' | 'presents' | 'preview' | 'responses'

function Editor({ wishlist }: { wishlist: Wishlist }) {
  const { draft, change, status, dirty, flush, retry, error } = useWishlistDraft(wishlist)
  const [mode, setMode] = useState<Mode>('editor')
  const [tab, setTab] = useState<'block' | 'page' | 'access'>('block')
  const [width, setWidth] = useState<'desktop' | 'phone'>('desktop')
  const [selected, setSelected] = useState<string>()
  const { data: presentsData } = useApiGetAllPresents(wishlist.id)
  const presents = presentsData?.data ?? []
  const blocks = draft.blocks ?? []
  const block = blocks.find(b => b.id === selected)
  const { startTour } = useConstructorTour()

  const scheme = normalizeScheme(draft.settings.colorScheme)
  const schemeName = colorSchema.find(s => s.value === scheme)?.name ?? 'Своя'
  const schemeColors = colorSchema.find(s => s.value === scheme)?.colors ?? ['#0B1226', '#8BE9F5']

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/s/${wishlist.shortId}`)
      toast({ title: 'Ссылка скопирована' })
    } catch {
      toast({ title: 'Не удалось скопировать ссылку', variant: 'destructive' })
    }
  }

  const modes: [Mode, string][] = [
    ['editor', 'Страница'],
    ['presents', `Подарки${presents.length ? ` · ${presents.length}` : ''}`],
    ['preview', 'Предпросмотр'],
    ['responses', 'Ответы гостей'],
  ]

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center gap-3">
        <div data-tour="title" className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">{draft.title || 'Мой праздник'}</h1>
          <p role="status" className={cn('text-sm', error ? 'text-destructive' : 'text-muted-foreground')}>
            {status}
          </p>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* Схема лежит на вкладке «Страница», но смотреть на неё хочется с
              холста — поэтому показываем прямо в шапке и туда же ведём. */}
          <button
            type="button"
            onClick={() => { setMode('editor'); setTab('page') }}
            className="flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-semibold hover:bg-accent"
          >
            <span className="flex" aria-hidden>
              <span className="h-3.5 w-3.5 rounded-full border" style={{ backgroundColor: schemeColors[0] }} />
              <span className="-ml-1.5 h-3.5 w-3.5 rounded-full" style={{ backgroundColor: schemeColors[1] }} />
            </span>
            {schemeName}
          </button>

          <div className="flex gap-0.5 rounded-xl border p-[3px]" role="group" aria-label="Ширина страницы">
            {([['desktop', Monitor, 'Компьютер'], ['phone', Smartphone, 'Телефон']] as const).map(([value, Icon, label]) => (
              <button
                key={value}
                type="button"
                aria-label={label}
                aria-pressed={width === value}
                title={label}
                onClick={() => setWidth(value)}
                className={cn(
                  'flex h-7 w-8 items-center justify-center rounded-lg',
                  width === value ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon size={15} aria-hidden />
              </button>
            ))}
          </div>

          <Button variant="outline" disabled={!dirty || Boolean(error)} onClick={() => void flush()}>
            Сохранить
          </Button>
          {wishlist.shortId && (
            <Button variant="outline" onClick={copyLink}>
              <Link2 size={15} className="mr-1.5" aria-hidden />
              Поделиться
            </Button>
          )}
          {wishlist.shortId && (
            <Button variant="outline" asChild>
              <a href={`/s/${wishlist.shortId}`} target="_blank" rel="noopener noreferrer">
                <Eye size={15} className="mr-1.5" aria-hidden />
                Открыть
              </a>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            title="Как пользоваться редактором"
            aria-label="Как пользоваться редактором"
            onClick={startTour}
          >
            <CircleHelp size={16} aria-hidden />
          </Button>
        </div>
      </header>

      {error != null && (
        <div role="alert" className="space-y-3 rounded-xl border border-destructive p-4 text-sm">
          <p>
            Черновик остаётся в редакторе. При конфликте скопируйте нужные изменения, затем
            загрузите актуальную страницу. Повторная отправка не снимает защиту от конфликта.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void retry()}>Повторить</Button>
            <Button
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
              variant="outline"
              onClick={() => {
                if (window.confirm('Локальные несохранённые изменения будут потеряны. Загрузить серверную версию?')) {
                  window.location.reload()
                }
              }}
            >
              Загрузить актуальную
            </Button>
          </div>
        </div>
      )}

      <nav className="flex w-max gap-0.5 rounded-xl border p-[3px]" aria-label="Режим редактора">
        {modes.map(([value, label]) => (
          <button
            key={value}
            type="button"
            data-tour={value === 'presents' ? 'tab-presents' : undefined}
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              'h-8 rounded-lg px-4 text-sm font-semibold transition-colors',
              mode === value ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      {mode === 'editor' && (
        <>
          <p className="rounded-xl bg-muted p-3 text-sm lg:hidden">
            Полный конструктор удобнее на компьютере. Здесь можно настроить страницу, блоки и подарки.
          </p>

          <div className={cn(
            'grid grid-cols-1 overflow-hidden rounded-2xl border',
            'lg:h-[calc(100vh-15rem)] lg:min-h-[520px] lg:grid-cols-[minmax(0,1fr)_340px]',
            'xl:grid-cols-[248px_minmax(0,1fr)_340px]',
          )}>
            <div className="hidden min-h-0 xl:flex xl:flex-col">
              <BlockLibrary
                onAdd={item => {
                  const next = appendLibraryBlock(blocks, item)
                  change({ blocks: next })
                  setSelected(next[next.length - 1].id)
                  setTab('block')
                }}
              />
            </div>

            {/* Схема вишлиста красит только холст: вокруг остаётся интерфейс
                приложения, он живёт в своей теме. */}
            <div
              data-tour="block-canvas"
              className={cn('flex min-h-0 flex-col', scheme !== 'custom' && scheme)}
              style={draft.settings.colorScheme === 'custom' ? deriveSchemeStyle(draft.settings.customScheme) : undefined}
            >
              <BlockCanvas
                wishlist={draft}
                presents={presents}
                selected={selected}
                mobile={width === 'phone'}
                onSelect={id => { setSelected(id); if (id) setTab('block') }}
                onChange={next => change({ blocks: next })}
              />
            </div>

            <aside className="min-h-0 overflow-y-auto border-t lg:border-l lg:border-t-0">
              <nav className="flex gap-5 border-b px-4" aria-label="Настройки страницы">
                {([['block', 'Блок'], ['page', 'Страница'], ['access', 'Доступ']] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={tab === value}
                    onClick={() => setTab(value)}
                    className={cn(
                      'h-11 border-b-2 text-sm transition-colors',
                      tab === value
                        ? 'border-primary font-bold text-foreground'
                        : 'border-transparent font-semibold text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </nav>

              {tab === 'block' && (
                <BlockInspector
                  block={block}
                  onChange={next => {
                    // Ширина меняет раскладку соседей, поэтому идёт через сетку,
                    // а не простой заменой блока: иначе широкий блок наехал бы
                    // на соседа по строке.
                    const patched = blocks.map(b => (b.id === next.id ? next : b))
                    const previous = blocks.find(b => b.id === next.id)
                    change({
                      blocks: previous && previous.colSpan !== next.colSpan
                        ? resizeBlock(patched, next.id, next.colSpan)
                        : patched,
                    })
                  }}
                />
              )}

              {tab === 'page' && (
                <div className="space-y-5 p-4">
                  <label className="block space-y-1 text-sm">
                    <span className="text-xs font-semibold text-muted-foreground">Название</span>
                    <Input value={draft.title} onChange={e => change({ title: e.target.value })} />
                  </label>
                  <label className="block space-y-1 text-sm">
                    <span className="text-xs font-semibold text-muted-foreground">Описание</span>
                    <Textarea value={draft.description} onChange={e => change({ description: e.target.value })} />
                  </label>
                  <label className="block space-y-1 text-sm">
                    <span className="text-xs font-semibold text-muted-foreground">Дата праздника</span>
                    <Input
                      type="datetime-local"
                      value={localDateTime(draft.eventDate)}
                      onChange={e => change({ eventDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    />
                  </label>
                  <label className="block space-y-1 text-sm">
                    <span className="text-xs font-semibold text-muted-foreground">Повод</span>
                    <Input value={draft.occasion ?? ''} onChange={e => change({ occasion: e.target.value })} />
                  </label>
                  <ColorsSelect
                    value={draft.settings.colorScheme}
                    customScheme={draft.settings.customScheme}
                    onChange={colorScheme => change({
                      settings: {
                        ...draft.settings,
                        colorScheme,
                        ...(colorScheme === 'custom' && !draft.settings.customScheme
                          ? { customScheme: { base: 'dark' as const, accent: '#a78bfa' } }
                          : {}),
                      },
                    })}
                    onCustomChange={customScheme => change({ settings: { ...draft.settings, customScheme } })}
                  />
                </div>
              )}

              {tab === 'access' && (
                <div className="space-y-4 p-4 text-sm">
                  <p className="text-muted-foreground">
                    Страница доступна по ссылке. Видимость и время раскрытия настраиваются
                    отдельно для каждого блока.
                  </p>
                  <Toggle
                    label="Показывать мне, какие подарки заняты"
                    checked={draft.settings.showGiftAvailability}
                    onChange={showGiftAvailability => change({
                      settings: { ...draft.settings, showGiftAvailability },
                    })}
                  />
                  {wishlist.shortId && (
                    <Button variant="outline" onClick={copyLink}>Скопировать ссылку</Button>
                  )}
                </div>
              )}
            </aside>
          </div>
        </>
      )}

      {mode === 'preview' && (
        <div className={cn(
          'overflow-hidden rounded-2xl border',
          width === 'phone' && 'mx-auto w-[390px] max-w-full',
        )}>
          <WishlistLanding wishlist={draft} presents={presents} isMyWishlist={false} disableBodyTheme />
        </div>
      )}

      {mode === 'presents' && <PresentsManager wishlist={draft} presents={presents} />}

      {mode === 'responses' && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Ответы для сохранённых блоков. Настройки нового блока сначала нужно сохранить.
          </p>
          {(wishlist.blocks ?? [])
            .filter(b => ['rsvp', 'poll', 'playlist', 'guestbook'].includes(b.type))
            .map(b => (
              <section key={b.id} className="space-y-4 rounded-xl border p-5">
                <h2 className="text-xl font-bold">
                  {b.title || ({
                    rsvp: 'Ответы гостей',
                    poll: 'Голосование',
                    playlist: 'Плейлист',
                    guestbook: 'Гостевая книга',
                  } as Record<string, string>)[b.type]}
                </h2>
                <GuestBlockView block={b} wishlistId={wishlist.id} owner />
              </section>
            ))}
        </div>
      )}
    </div>
  )
}
