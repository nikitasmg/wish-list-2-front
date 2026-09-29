'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { buildIcs, calendarEvent, googleCalendarUrl } from '@/lib/calendar'
import { Wishlist } from '@/shared/types'
import { CalendarPlus } from 'lucide-react'
import * as React from 'react'

/**
 * «Добавить в календарь».
 *
 * Кнопки нет вовсе, когда у вишлиста нет даты: добавлять в календарь нечего,
 * а неактивная кнопка только вызывает вопросы.
 */
export function AddToCalendar({ wishlist }: { wishlist: Wishlist }) {
  const event = calendarEvent(wishlist)
  if (!event) return null

  const downloadIcs = () => {
    const blob = new Blob([buildIcs(event)], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${wishlist.shortId || 'event'}.ics`
    document.body.appendChild(link)
    link.click()
    link.remove()
    // Ссылку на blob освобождаем сразу: иначе файл висит в памяти вкладки до
    // её закрытия.
    URL.revokeObjectURL(url)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="lg">
          <CalendarPlus className="mr-2 h-5 w-5" aria-hidden />
          Добавить в календарь
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        <DropdownMenuItem asChild>
          <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
            Google Календарь
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadIcs}>
          Apple, Outlook и другие
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
