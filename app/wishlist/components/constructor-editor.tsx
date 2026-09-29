'use client'

import { useState } from 'react'
import { useApiGetAllPresents } from '@/api/present'
import { useWishlistDraft } from '@/hooks/use-wishlist-draft'
import { BlockCanvas } from './constructor/block-canvas'
import { BlockInspector } from './constructor/block-inspector'
import { WishlistLanding } from '@/app/s/[shortId]/components/wishlist-landing'
import { GuestBlockView } from '@/app/s/[shortId]/components/blocks/guest-block-view'
import { PresentCard } from '@/app/wishlist/[id]/present/components/present-card'
import { PresentModal } from './present-modal'
import { ColorsSelect } from './colors-select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Wishlist } from '@/shared/types'
import { localDateTime } from '@/shared/editor-model'
import { normalizeScheme } from '@/shared/constants'
import { deriveSchemeStyle } from '@/shared/derive-scheme'
import { toast } from '@/hooks/use-toast'

export function ConstructorEditor({ wishlist }: { wishlist: Wishlist }) {
  return <Editor key={wishlist.id} wishlist={wishlist} />
}
function Editor({ wishlist }: { wishlist: Wishlist }) {
  const { draft, change, status, dirty, flush, retry, error } = useWishlistDraft(wishlist)
  const [mode, setMode] = useState<'editor' | 'preview' | 'presents' | 'responses'>('editor')
  const [tab, setTab] = useState<'block' | 'page' | 'access'>('block')
  const [previewWidth, setPreviewWidth] = useState<'desktop' | 'phone'>('desktop')
  const [selected, setSelected] = useState<string>()
  const [presentModalOpen, setPresentModalOpen] = useState(false)
  const { data: presentsData } = useApiGetAllPresents(wishlist.id)
  const presents = presentsData?.data ?? []
  const block = draft.blocks?.find(b => b.id === selected)
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/s/${wishlist.shortId}`); toast({ title: 'Ссылка скопирована' }) }
    catch { toast({ title: 'Не удалось скопировать ссылку', variant: 'destructive' }) }
  }
  return <div className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold">{draft.title || 'Мой праздник'}</h1><p role="status" className={error ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>{status}</p></div>
      <div className="flex gap-2"><Button variant="outline" disabled={!dirty || Boolean(error)} onClick={() => void flush()}>Сохранить</Button>{wishlist.shortId && <Button variant="outline" onClick={copyLink}>Поделиться</Button>}</div>
    </header>
    {error != null && <div role="alert" className="rounded-xl border border-destructive p-4 space-y-3 text-sm"><p>Черновик остаётся в редакторе. При конфликте скопируйте нужные изменения, затем загрузите актуальную страницу. Повторная отправка не снимает защиту от конфликта.</p><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void retry()}>Повторить</Button><Button variant="outline" onClick={() => { const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'wishlist-draft.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000) }}>Скачать черновик</Button><Button variant="outline" onClick={() => { if (window.confirm('Локальные несохранённые изменения будут потеряны. Загрузить серверную версию?')) window.location.reload() }}>Загрузить актуальную</Button></div></div>}
    <nav className="flex flex-wrap gap-2" aria-label="Режим редактора">
      {([['editor', 'Страница'], ['presents', 'Подарки'], ['preview', 'Предпросмотр'], ['responses', 'Ответы гостей']] as const).map(([value, label]) => <Button key={value} variant={mode === value ? 'default' : 'outline'} onClick={() => setMode(value)}>{label}</Button>)}
    </nav>
    {mode === 'editor' && <>
      <p className="rounded-xl bg-muted p-3 text-sm lg:hidden">Полный конструктор удобнее на компьютере. Здесь можно настроить страницу, блоки и подарки.{wishlist.shortId && <button onClick={copyLink} className="ml-2 underline">Скопировать ссылку</button>}</p>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className={normalizeScheme(draft.settings.colorScheme)} style={draft.settings.colorScheme === 'custom' ? deriveSchemeStyle(draft.settings.customScheme) : undefined}>
          <BlockCanvas wishlist={draft} presents={presents} selected={selected} onSelect={id => { setSelected(id); setTab('block') }} onChange={blocks => change({ blocks })} />
        </div>
        <aside className="rounded-2xl border bg-background lg:sticky lg:top-4 lg:max-h-[85vh] lg:overflow-y-auto">
          <nav className="flex gap-1 border-b p-2" aria-label="Настройки страницы">{([['block', 'Блок'], ['page', 'Страница'], ['access', 'Доступ']] as const).map(([value, label]) => <Button key={value} size="sm" variant={tab === value ? 'default' : 'ghost'} onClick={() => setTab(value)}>{label}</Button>)}</nav>
          {tab === 'block' && <BlockInspector block={block} onChange={next => change({ blocks: draft.blocks?.map(b => b.id === next.id ? next : b) })} />}
          {tab === 'page' && <div className="space-y-5 p-4">
            <label className="block space-y-1 text-sm"><span>Название</span><Input value={draft.title} onChange={e => change({ title: e.target.value })} /></label>
            <label className="block space-y-1 text-sm"><span>Описание</span><Textarea value={draft.description} onChange={e => change({ description: e.target.value })} /></label>
            <label className="block space-y-1 text-sm"><span>Дата праздника</span><Input type="datetime-local" value={localDateTime(draft.eventDate)} onChange={e => change({ eventDate: e.target.value ? new Date(e.target.value).toISOString() : null })} /></label>
            <label className="block space-y-1 text-sm"><span>Повод</span><Input value={draft.occasion ?? ''} onChange={e => change({ occasion: e.target.value })} /></label>
            <ColorsSelect value={draft.settings.colorScheme} customScheme={draft.settings.customScheme} onChange={colorScheme => change({ settings: { ...draft.settings, colorScheme, ...(colorScheme === 'custom' && !draft.settings.customScheme ? { customScheme: { base: 'dark' as const, accent: '#a78bfa' } } : {}) } })} onCustomChange={customScheme => change({ settings: { ...draft.settings, customScheme } })} />
          </div>}
          {tab === 'access' && <div className="space-y-4 p-4 text-sm"><p>Страница доступна по ссылке. Видимость и время раскрытия настраиваются отдельно для каждого блока.</p><label className="flex items-start gap-2"><input type="checkbox" checked={draft.settings.showGiftAvailability} onChange={e => change({ settings: { ...draft.settings, showGiftAvailability: e.target.checked } })} />Показывать мне, какие подарки заняты</label>{wishlist.shortId && <Button variant="outline" onClick={copyLink}>Скопировать ссылку</Button>}</div>}
        </aside>
      </div>
    </>}
    {mode === 'preview' && <div className="space-y-3">
      {/* Переключатель ширины: половина гостей приходит с телефона, а
          проверить это, не меняя размер окна, было нечем. Заодно у
          mobilePosition появляется способ себя показать. */}
      <div className="flex justify-end">
        <div className="inline-flex gap-1 rounded-xl border p-1" role="group" aria-label="Ширина предпросмотра">
          {([['desktop', 'Компьютер'], ['phone', 'Телефон']] as const).map(([value, label]) => (
            <Button
              key={value}
              size="sm"
              variant={previewWidth === value ? 'default' : 'ghost'}
              aria-pressed={previewWidth === value}
              onClick={() => setPreviewWidth(value)}
            >{label}</Button>
          ))}
        </div>
      </div>
      <div className={previewWidth === 'phone' ? 'mx-auto w-[390px] max-w-full overflow-hidden rounded-2xl border' : 'overflow-hidden rounded-2xl border'}>
        <WishlistLanding wishlist={draft} presents={presents} isMyWishlist={false} disableBodyTheme />
      </div>
    </div>}
    {mode === 'responses' && <div className="space-y-6"><p className="text-sm text-muted-foreground">Ответы для сохранённых блоков. Настройки нового блока сначала нужно сохранить.</p>{(wishlist.blocks ?? []).filter(b => ['rsvp', 'poll', 'playlist', 'guestbook'].includes(b.type)).map(b => <section key={b.id} className="rounded-xl border p-5 space-y-4"><h2 className="text-xl font-bold">{b.title || ({ rsvp: 'Ответы гостей', poll: 'Голосование', playlist: 'Плейлист', guestbook: 'Гостевая книга' } as Record<string, string>)[b.type]}</h2><GuestBlockView block={b} wishlistId={wishlist.id} owner /></section>)}</div>}
    {mode === 'presents' && <div className="space-y-4"><Button variant="outline" className="w-full border-dashed" onClick={() => setPresentModalOpen(true)}>Добавить подарок</Button><div className="flex flex-col gap-4 md:flex-row md:flex-wrap">{presents.map(present => <PresentCard key={present.id} present={present} wishlistId={wishlist.id} />)}</div>{!presents.length && <p className="text-sm text-muted-foreground">Подарков пока нет. Добавьте первый!</p>}</div>}
    <PresentModal wishlistId={wishlist.id} open={presentModalOpen} onOpenChange={setPresentModalOpen} />
  </div>
}
