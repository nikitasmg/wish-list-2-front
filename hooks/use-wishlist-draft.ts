'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import api from '@/lib/api'
import { Wishlist, Block, RowSettings } from '@/shared/types'
import { prepareLayout, wishlistForm, matchesSavedBlocks, matchesSavedRows } from '@/shared/editor-model'
import { History } from '@/shared/history'
import type { Layout } from '@/shared/layout'
import { SaveQueue } from '@/shared/save-queue'

/**
 * Черновик вишлиста в редакторе: автосохранение, конфликт версий и история
 * «Отменить / Повторить».
 *
 * Откат — обычная правка: снимок уходит тем же PUT, что и любая другая, и
 * проверяется той же версией. Отдельного «отката на сервере» нет и не нужно.
 */
export function useWishlistDraft(initial: Wishlist) {
  const [draft, setDraft] = useState<Wishlist>(() => ({ ...initial, ...prepareLayout(initial) }))
  const latest = useRef(draft)
  const saved = useRef(initial)
  const [status, setStatus] = useState('Сохранено')
  const [dirty, setDirty] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [history] = useState(() => new History<Wishlist>())
  const [, setHistoryVersion] = useState(0)
  const client = useQueryClient()
  const [queue] = useState(() => new SaveQueue<Wishlist>(async snapshot => {
    const metadata = (value: Wishlist) => JSON.stringify(Array.from(wishlistForm(value).entries()))

    // Настройки и блоки сохраняются двумя запросами, строго по очереди: второй
    // берёт версию, которую вернул первый. Оба проверяют её через If-Match, и
    // бэк обновляет только свои колонки — раньше PUT настроек писал модель
    // целиком и затирал блоки снимком, прочитанным до правки.
    if (metadata(snapshot) !== metadata(saved.current)) {
      const meta = await api.put<{ data: Wishlist }, FormData>(
        `wishlists/${initial.id}`,
        wishlistForm(snapshot),
        { headers: { 'Content-Type': 'multipart/form-data', 'If-Match': saved.current.updatedAt } },
      )
      // Блоки в этом ответе те, что лежат в базе, — свои держим из снимка.
      saved.current = { ...meta.data, blocks: saved.current.blocks, rows: saved.current.rows }
    }

    const blocks = snapshot.blocks ?? []
    const rows = snapshot.rows ?? []
    const result = await api.put<{ data: Wishlist }, { blocks: Block[]; rows: RowSettings[] }>(
      `wishlists/${initial.id}/blocks`,
      { blocks, rows },
      { headers: { 'If-Match': saved.current.updatedAt } },
    )
    if (!matchesSavedBlocks(blocks, result.data.blocks ?? []) || !matchesSavedRows(rows, result.data.rows)) {
      throw new Error('conflict')
    }
    saved.current = result.data
    client.setQueryData(['wishlist', initial.id], result)
    void client.invalidateQueries({ queryKey: ['wishlists'] })
    // Do not replace the local draft with a response to an older edit.
  }, () => {
    const conflict = queue.error instanceof Error && queue.error.message === 'conflict' || isAxiosError(queue.error) && queue.error.response?.status === 409
    setStatus(queue.error ? conflict ? 'Конфликт: страница изменена в другой вкладке' : 'Не удалось сохранить' : queue.saving ? 'Сохраняем…' : timer.current ? 'Есть изменения' : 'Сохранено')
    setDirty(queue.dirty || Boolean(timer.current))
  }))
  useEffect(() => {
    queue.start()
    const unload = (event: BeforeUnloadEvent) => { if (timer.current || queue.dirty) { event.preventDefault(); event.returnValue = '' } }
    const navigate = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a') : null
      if (!link || link.target === '_blank' || link.hasAttribute('download') || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      const destination = new URL(link.href, window.location.href)
      if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return
      if ((timer.current || queue.dirty) && !window.confirm('Есть несохранённые изменения. Покинуть редактор и потерять их?')) { event.preventDefault(); event.stopPropagation() }
    }
    window.addEventListener('beforeunload', unload)
    document.addEventListener('click', navigate, true)
    return () => { queue.stop(); if (timer.current) clearTimeout(timer.current); window.removeEventListener('beforeunload', unload); document.removeEventListener('click', navigate, true) }
  }, [queue])

  const apply = useCallback((next: Wishlist) => {
    latest.current = next; setDraft(next); setDirty(true)
    if (!queue.error) setStatus('Есть изменения')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => { timer.current = null; void queue.push(latest.current) }, 800)
  }, [queue])

  /** key склеивает правки подряд в один шаг отмены (например, набор текста). */
  const change = useCallback((patch: Partial<Wishlist>, key?: string) => {
    history.record(latest.current, key)
    setHistoryVersion(v => v + 1)
    apply({ ...latest.current, ...patch })
  }, [apply, history])

  const setLayout = useCallback((layout: Layout, key?: string) => change({ blocks: layout.blocks, rows: layout.rows }, key), [change])

  const undo = useCallback(() => {
    const previous = history.undo(latest.current)
    if (previous) { setHistoryVersion(v => v + 1); apply(previous) }
  }, [apply, history])
  const redo = useCallback(() => {
    const next = history.redo(latest.current)
    if (next) { setHistoryVersion(v => v + 1); apply(next) }
  }, [apply, history])

  const flush = async () => { if (timer.current) clearTimeout(timer.current); timer.current = null; await queue.push(latest.current) }
  const retry = async () => { if (timer.current) clearTimeout(timer.current); timer.current = null; await queue.push(latest.current); await queue.retry() }
  const layout: Layout = { blocks: draft.blocks ?? [], rows: draft.rows ?? [] }
  return {
    draft, layout, change, setLayout, undo, redo,
    canUndo: history.canUndo, canRedo: history.canRedo,
    status, dirty, flush, retry, error: queue.error,
  }
}
