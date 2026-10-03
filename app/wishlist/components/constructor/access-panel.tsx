'use client'

import { Button } from '@/components/ui/button'
import { Wishlist } from '@/shared/types'
import { Copy, ExternalLink, MessagesSquare } from 'lucide-react'
import * as React from 'react'
import { Toggle } from './controls'

/**
 * «Доступ»: ссылка на страницу и то, что видит сам организатор. Видимость
 * и время раскрытия — у каждого блока свои, во вкладке «Блок».
 */
export function AccessPanel({ wishlist, onSettings, onCopy, onResponses, hasGuestBlocks }: {
  wishlist: Wishlist
  onSettings: (settings: Wishlist['settings']) => void
  onCopy: () => void
  onResponses: () => void
  hasGuestBlocks: boolean
}) {
  const url = wishlist.shortId ? `/s/${wishlist.shortId}` : ''
  return (
    <div className="space-y-5 p-5 text-sm">
      <section className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground">Ссылка на страницу</h3>
        <p className="text-muted-foreground">Страница открыта всем, у кого есть ссылка. Регистрация гостям не нужна.</p>
        {url && (
          <div className="flex items-center gap-2 rounded-xl border bg-muted/40 p-2 pl-3">
            <span className="min-w-0 flex-1 truncate font-mono text-xs">prosto-namekni.ru{url}</span>
            <Button size="sm" variant="outline" onClick={onCopy}><Copy size={14} className="mr-1.5" aria-hidden />Копировать</Button>
          </div>
        )}
        {url && (
          <Button variant="ghost" size="sm" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} className="mr-1.5" aria-hidden />Открыть как гость</a>
          </Button>
        )}
      </section>

      <section className="space-y-3 border-t pt-4">
        <h3 className="text-xs font-semibold text-muted-foreground">Что вижу я</h3>
        <Toggle
          label="Показывать мне, какие подарки заняты"
          checked={wishlist.settings.showGiftAvailability}
          onChange={showGiftAvailability => onSettings({ ...wishlist.settings, showGiftAvailability })}
        />
        <p className="text-xs text-muted-foreground">Кто именно дарит — не видно никогда: так обещано гостям.</p>
      </section>

      {hasGuestBlocks && (
        <section className="space-y-2 border-t pt-4">
          <h3 className="text-xs font-semibold text-muted-foreground">Ответы гостей</h3>
          <Button variant="outline" className="w-full" onClick={onResponses}>
            <MessagesSquare size={15} className="mr-2" aria-hidden />
            Ответы, голоса и поздравления
          </Button>
        </section>
      )}
    </div>
  )
}
