'use client'

import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import api from '@/lib/api'
import { Wishlist, Block } from '@/shared/types'
import { prepareBlocks, wishlistForm, matchesSavedBlocks } from '@/shared/editor-model'
import { SaveQueue } from '@/shared/save-queue'

export function useWishlistDraft(initial: Wishlist) {
  const [draft, setDraft] = useState(() => ({ ...initial, blocks: prepareBlocks(initial) }))
  const latest = useRef(draft)
  const saved = useRef(initial)
  const [status, setStatus] = useState('Сохранено')
  const [dirty, setDirty] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
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
      saved.current = { ...meta.data, blocks: saved.current.blocks }
    }

    const result = await api.put<{ data: Wishlist }, Block[]>(`wishlists/${initial.id}/blocks`, snapshot.blocks ?? [], { headers: { 'If-Match': saved.current.updatedAt } })
    if (!matchesSavedBlocks(snapshot.blocks ?? [], result.data.blocks ?? [])) throw new Error('conflict')
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
  const change = (patch: Partial<Wishlist>) => {
    const next = { ...latest.current, ...patch }
    latest.current = next; setDraft(next); setDirty(true)
    if (!queue.error) setStatus('Есть изменения')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => { timer.current = null; void queue.push(latest.current) }, 800)
  }
  const flush = async () => { if (timer.current) clearTimeout(timer.current); timer.current = null; await queue.push(latest.current) }
  const retry = async () => { if (timer.current) clearTimeout(timer.current); timer.current = null; await queue.push(latest.current); await queue.retry() }
  return { draft, change, status, dirty, flush, retry, error: queue.error }
}
