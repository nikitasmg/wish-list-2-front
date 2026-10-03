'use client'

import { useApiGetAllWishlists } from '@/api/wishlist'
import { WhatsNewDialog } from '@/app/wishlist/components/whats-new-dialog'
import { WishlistCard } from '@/app/wishlist/components/wishlist-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { eventTiming, pluralRu, searchWishlists } from '@/shared/event-date'
import { ChevronRight, LayoutTemplate, Monitor, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { useMemo, useState } from 'react'

export default function Page() {
  const { data } = useApiGetAllWishlists()
  const [query, setQuery] = useState('')
  const wishlists = useMemo(() => data?.data ?? [], [data])
  const visible = useMemo(() => searchWishlists(wishlists, query), [wishlists, query])

  // «Скоро» — праздник ещё впереди: прошедшие и без даты не считаются.
  const upcoming = wishlists.filter(w => { const t = eventTiming(w.eventDate ?? w.location?.time); return t && !t.past }).length

  if (wishlists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="text-6xl">🎁</div>
        <h3 className="text-xl font-semibold">Пока нет вишлистов</h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          Создайте первый вишлист и поделитесь им с теми, кто хочет сделать вам подарок
        </p>
        <Button asChild>
          <Link href="/wishlist/create">Создать первый вишлист</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <WhatsNewDialog wishlists={wishlists} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Мои вишлисты</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {wishlists.length} {pluralRu(wishlists.length, ['вишлист', 'вишлиста', 'вишлистов'])}
            {upcoming > 0 && <> · {upcoming} {pluralRu(upcoming, ['праздник скоро', 'праздника скоро', 'праздников скоро'])}</>}
          </p>
        </div>
        <Button asChild>
          <Link href="/wishlist/create">
            <Plus size={18} className="mr-2" aria-hidden />
            Новый вишлист
          </Link>
        </Button>
      </div>

      {/* Поиск появляется, когда список перестаёт охватываться взглядом */}
      {wishlists.length > 3 && (
        <label className="flex items-center gap-2 max-w-xs rounded-xl border px-3 h-10 text-muted-foreground focus-within:ring-2 focus-within:ring-ring">
          <Search size={16} aria-hidden />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Поиск по названию или поводу"
            aria-label="Найти вишлист"
            className="border-0 bg-transparent p-0 h-auto shadow-none focus-visible:ring-0"
          />
        </label>
      )}

      {visible.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          Ничего не нашлось. Попробуйте другое слово.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map(wishlist => (
            <WishlistCard key={wishlist.id} wishlist={wishlist} />
          ))}

          {/* Плитка ведёт на экран выбора заготовки, а не создаёт пустой
              конструктор: с готовой страницы начать проще, чем с чистого листа. */}
          {!query && (
            <Link
              href="/wishlist/create"
              className="hidden md:flex flex-col items-center justify-center gap-3 min-h-[220px] rounded-xl border border-dashed text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              <span className="flex items-center justify-center w-12 h-12 rounded-full border text-primary">
                <Plus size={22} aria-hidden />
              </span>
              <span className="text-sm font-semibold">Создать вишлист</span>
            </Link>
          )}
        </div>
      )}

      {/* Телефон: создать можно только из шаблона — конструктор открывается
          на компьютере (макет MobileStart). */}
      <section className="space-y-3 md:hidden">
        <h3 className="text-lg font-extrabold">Новый вишлист</h3>
        <Link href="/wishlist/create" className="flex items-center gap-3.5 rounded-2xl border p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#17B6D6] to-[#7B5CF0] text-white"><LayoutTemplate size={22} aria-hidden /></span>
          <span className="min-w-0 flex-1"><span className="block font-bold">Из шаблона</span><span className="block text-sm text-muted-foreground">Готовая страница за пару минут</span></span>
          <ChevronRight size={18} className="text-muted-foreground" aria-hidden />
        </Link>
        <div className="flex items-center gap-3.5 rounded-2xl border p-4 text-muted-foreground">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted"><Monitor size={22} aria-hidden /></span>
          <span><span className="block font-bold">Конструктор</span><span className="block text-sm">Доступен на компьютере</span></span>
        </div>
      </section>
    </div>
  )
}
