'use client'

import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Wishlist } from '@/shared/types'
import { Share2 } from 'lucide-react'
import * as React from 'react'

/**
 * «Поделиться».
 *
 * Сначала нативное меню — на телефоне оно даёт мессенджеры, которыми ссылку
 * и отправляют. Где его нет, остаётся копирование в буфер: своя панель
 * с иконками соцсетей проигрывает системной и на десктопе почти не нужна.
 */
export function ShareWishlist({ wishlist }: { wishlist: Wishlist }) {
  const { toast } = useToast()

  const share = async () => {
    // Адрес берём из окна, а не собираем из env: страница уже открыта по
    // нужному адресу, и собранный вручную мог бы с ним разойтись.
    const url = window.location.href
    const data = { title: wishlist.title, text: wishlist.description || undefined, url }

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(data)
        return
      } catch (error) {
        // Отмена — это не ошибка: человек просто закрыл меню.
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      toast({ title: 'Ссылка скопирована' })
    } catch {
      toast({ title: 'Не удалось скопировать ссылку', variant: 'destructive' })
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={share}>
      <Share2 className="mr-2 h-4 w-4" aria-hidden />
      Поделиться
    </Button>
  )
}
