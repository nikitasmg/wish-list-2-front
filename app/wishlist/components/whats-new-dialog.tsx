'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { isLegacyWishlist } from '@/shared/editor-model'
import type { Wishlist } from '@/shared/types'
import { Columns2, Gift, LayoutTemplate, ListChecks, Palette, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

const SEEN_KEY = 'whats_new_redesign_seen'

const NEWS = [
  { icon: LayoutTemplate, title: 'Шаблоны под повод', text: 'День рождения, свадьба, юбилей — готовая страница за пару минут' },
  { icon: Columns2, title: 'Конструктор из блоков', text: 'Программа, место, дресс-код — ставьте блоки рядом в ряд. На компьютере' },
  { icon: ListChecks, title: 'Ответ гостя, голосование, плейлист', text: 'Гости отвечают, придут ли, и выбирают торт — без регистрации' },
  { icon: Gift, title: 'Главная мечта и бронь с именем', text: 'Кто что дарит, вы не видите — сюрприз остаётся сюрпризом' },
  { icon: Palette, title: 'Оформление', text: 'Девять цветовых схем, шрифты заголовков и узоры фона' },
]

function readSeen(): boolean {
  try { return localStorage.getItem(SEEN_KEY) === '1' } catch { return true }
}

function markSeen() {
  try { localStorage.setItem(SEEN_KEY, '1') } catch { /* без памяти покажем ещё раз — не страшно */ }
}

/**
 * «Что нового» для тех, кто пользовался сервисом до редизайна.
 *
 * Старого пользователя узнаём по вишлисту старого формата: новый формат
 * появляется у вишлиста при первом сохранении в новом редакторе, а у
 * созданных после редизайна он сразу новый. Показываем один раз на браузер.
 */
export function WhatsNewDialog({ wishlists }: { wishlists: Wishlist[] }) {
  const [open, setOpen] = React.useState(false)
  const hasLegacy = wishlists.some(isLegacyWishlist)

  React.useEffect(() => {
    if (hasLegacy && !readSeen()) setOpen(true)
  }, [hasLegacy])

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) markSeen()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto p-0 sm:max-w-[520px]">
        <div className="relative overflow-hidden bg-hero-night px-6 pb-6 pt-7 text-white">
          <div className="pointer-events-none absolute inset-0 bg-dots bg-[length:28px_28px]" aria-hidden />
          <span className="relative inline-flex h-7 items-center rounded-full border border-white/20 bg-white/10 px-3 text-caption font-bold">Обновление</span>
          <DialogTitle className="relative mt-3 font-unbounded text-title font-extrabold">Намекни обновился</DialogTitle>
          <DialogDescription className="relative mt-2 text-body text-white/75">Вишлист теперь — целая страница праздника</DialogDescription>
        </div>

        <ul className="flex flex-col gap-4 px-6 py-5">
          {NEWS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary/15 text-primary"><Icon size={18} aria-hidden /></span>
              <span className="min-w-0">
                <span className="block text-body font-bold leading-snug">{title}</span>
                <span className="block text-body-sm leading-snug text-muted-foreground">{text}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mx-6 flex gap-3 rounded-control-lg border bg-muted/40 p-3.5 text-body-sm">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden />
          <span>Ваши вишлисты на месте, ссылки не изменились. Откройте любой — он уже в новом редакторе.</span>
        </div>

        <div className="flex flex-col-reverse gap-2 px-6 pb-6 pt-5 sm:flex-row sm:justify-end">
          <Button variant="outline" asChild>
            <Link href="/how-it-works" onClick={() => onOpenChange(false)}>Как это работает</Link>
          </Button>
          <Button onClick={() => onOpenChange(false)}>Понятно</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
