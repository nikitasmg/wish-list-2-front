'use client'

import { WishlistMenu } from '@/app/wishlist/[id]/components/wishlist-menu'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { colorSchema, normalizeScheme } from '@/shared/constants'
import { eventTiming, formatEventDate } from '@/shared/event-date'
import { Wishlist } from '@/shared/types'
import { Eye, Link2, Pencil, Plus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

interface WishlistCardProps {
  wishlist: Wishlist
}

function WishlistCoverPlaceholder({ colorScheme }: { colorScheme: string }) {
  const scheme = colorSchema.find(s => s.value === normalizeScheme(colorScheme)) ?? colorSchema[0]
  const [bg, accent] = scheme.colors
  return (
    <div
      className="w-full h-[110px] rounded-t-control-lg"
      style={{
        backgroundImage: [
          `radial-gradient(circle, ${accent}26 1px, transparent 1px)`,
          `linear-gradient(135deg, ${accent}40 0%, ${bg}26 100%)`,
        ].join(', '),
        backgroundSize: '18px 18px, 100% 100%',
        backgroundColor: bg,
      }}
    />
  )
}

export const WishlistCard = ({ wishlist }: WishlistCardProps) => {
  const router = useRouter()
  const { toast } = useToast()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const shareUrl = wishlist.shortId ? `${appUrl}/s/${wishlist.shortId}` : ''

  const scheme = colorSchema.find(s => s.value === normalizeScheme(wishlist.settings.colorScheme)) ?? colorSchema[0]
  const timing = eventTiming(wishlist.eventDate ?? wishlist.location?.time)
  const date = formatEventDate(wishlist.eventDate ?? wishlist.location?.time)

  const total = wishlist.presentsCount
  const reserved = wishlist.reservedCount ?? 0
  // Доля занятых подарков. Без подарков полоска не рисуется вовсе — пустая
  // шкала на новом вишлисте выглядит как ошибка, а не как «пока ничего нет».
  const progress = total > 0 ? Math.round((reserved / total) * 100) : 0

  const copyLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast({ title: 'Ссылка скопирована' })
    } catch {
      toast({ title: 'Не удалось скопировать ссылку', variant: 'destructive' })
    }
  }

  return (
    <div className={cn(
      'group relative border text-card-foreground rounded-control-lg hover:shadow-float transition-shadow bg-card flex flex-col',
      // Прошедший праздник приглушаем: он остаётся в списке, но не спорит
      // за внимание с теми, что ещё впереди.
      timing?.past && 'opacity-60 hover:opacity-100',
    )}>
      {wishlist.cover ? (
        <div className="relative h-[110px] rounded-t-control-lg overflow-hidden">
          <Image
            src={wishlist.cover}
            alt={wishlist.title}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      ) : (
        <WishlistCoverPlaceholder colorScheme={wishlist.settings.colorScheme} />
      )}

      <div className="p-3 flex flex-col flex-1 gap-2">
        <div className="flex items-center gap-2 text-caption text-muted-foreground">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: scheme.colors[1] }}
            aria-hidden
          />
          <span className="truncate">{wishlist.occasion || 'Без повода'}</span>
          <span className="ml-auto flex items-center gap-1 shrink-0" title="Просмотров">
            <Eye size={12} aria-hidden />
            <span className="tabular-nums">{wishlist.viewsCount ?? 0}</span>
          </span>
        </div>

        <div className="flex items-start justify-between gap-1">
          <h3 className="text-body-sm font-semibold line-clamp-2 leading-snug flex-1">
            {wishlist.title}
          </h3>
          <WishlistMenu wishlist={wishlist} />
        </div>

        <p className="text-caption text-muted-foreground">
          {date || 'без даты'}
          {timing && <> · {timing.label}</>}
        </p>

        {total > 0 && (
          <div className="space-y-1">
            <div className="text-caption text-muted-foreground">
              {reserved} из {total} подарков заняты
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* В узкой карточке (две колонки на телефоне) кнопки в один ряд не
            помещаются: иконки целиком переезжают на свою строку и делят её
            поровну. В широкой — всё остаётся в одном ряду. */}
        <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-[1_1_8.5rem]"
            onClick={() => router.push(`/wishlist/edit/${wishlist.id}`)}
          >
            <Pencil size={13} className="mr-1" aria-hidden />
            Редактировать
          </Button>
          <div className="flex flex-[1_0_auto] gap-1.5">
            <Button size="sm" variant="outline" className="flex-1" aria-label="Добавить подарок" title="Добавить подарок" onClick={() => router.push(`/wishlist/edit/${wishlist.id}?add=gift`)}>
              <Plus size={13} aria-hidden />
            </Button>
            {shareUrl && (
              <>
                <Button size="sm" variant="outline" className="flex-1" aria-label="Скопировать ссылку" onClick={copyLink}>
                  <Link2 size={13} aria-hidden />
                </Button>
                <Button size="sm" variant="outline" className="flex-1" asChild aria-label="Открыть страницу для гостей">
                  <Link href={`/s/${wishlist.shortId}`} target="_blank">
                    <Eye size={13} aria-hidden />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
