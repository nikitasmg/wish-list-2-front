'use client'
import type { SchemeTheme } from './scheme-config'

import { ReserveControl, shopName } from '@/app/s/[shortId]/components/present-item'
import { useReservation } from '@/app/s/[shortId]/components/use-reservation'
import { CardCover } from '@/components/card-cover'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Present } from '@/shared/types'
import { cn } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'
import * as React from 'react'

/**
 * Полная карточка подарка.
 *
 * В списке и в сетке описание обрезано по строкам, иначе один подарок с
 * подробной инструкцией растягивает всю сетку. Целиком текст живёт здесь —
 * вместе со всеми ссылками на магазины и кнопкой брони, чтобы не пришлось
 * закрывать окно ради неё.
 */
export function PresentDetailModal({
  present, wishlistId, theme, isHidden, open, onOpenChange,
}: {
  present: Present | null
  wishlistId: string
  theme: SchemeTheme
  isHidden: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!present) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(theme.className, 'max-w-lg max-h-[90vh] overflow-y-auto')} style={theme.style}>
        <PresentDetail
          present={present}
          wishlistId={wishlistId}
          theme={theme}
          isHidden={isHidden}
        />
      </DialogContent>
    </Dialog>
  )
}

function PresentDetail({
  present, wishlistId, theme, isHidden,
}: {
  present: Present
  wishlistId: string
  theme: SchemeTheme
  isHidden: boolean
}) {
  const { state, isPending, reserve, release } = useReservation(present, wishlistId)
  const links = present.links?.length ? present.links : present.link ? [present.link] : []

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl leading-snug [overflow-wrap:anywhere]">{present.title}</DialogTitle>
      </DialogHeader>

      {present.cover && <CardCover cover={present.cover} title={present.title} className="h-56" />}

      {present.price != null && (
        <div className="text-lg font-bold text-primary">{present.price.toLocaleString('ru-RU')} ₽</div>
      )}

      {present.description && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {present.description}
        </p>
      )}

      {links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {links.map(link => (
            <a
              key={link}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              {shopName(link)}
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          ))}
        </div>
      )}

      {!isHidden && (
        <div className="flex pt-1">
          <ReserveControl
            state={state}
            isPending={isPending}
            theme={theme}
            onReserve={reserve}
            onRelease={release}
          />
        </div>
      )}
    </>
  )
}
