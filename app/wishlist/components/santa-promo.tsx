'use client'

import { Button } from '@/components/ui/button'
import { santaPromoVisible } from '@/shared/santa'
import { SANTA_ORIGIN, santaHref } from '@/shared/santa-route'
import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'

/** «Устройте Тайного Санту» — с 1 октября по 31 декабря (макет «Переход из вишлиста»). */
export function SantaPromo() {
  const [visible, setVisible] = useState(false)
  useEffect(() => setVisible(santaPromoVisible(new Date())), [])
  if (!visible) return null

  return (
    <section className="dark santa santa-snow flex flex-col gap-5 rounded-card border border-border bg-card p-6 text-foreground md:flex-row md:items-center md:gap-8 md:p-8">
      <span className="flex size-control-xl shrink-0 items-center justify-center rounded-card bg-festive text-tone-gold">
        <Star className="size-7" fill="currentColor" aria-hidden />
      </span>
      <div className="flex-1 space-y-2">
        <p className="text-eyebrow uppercase text-tone-gold">Новое к Новому году</p>
        <h3 className="text-title">Устройте Тайного Санту</h3>
        <p className="text-body text-muted-foreground">
          Соберите друзей или коллег — мы тайно распределим, кто кому дарит. Ваши вишлисты подтянутся сами.
        </p>
      </div>
      <Button asChild variant="festive" size="lg">
        <a href={`${SANTA_ORIGIN}${santaHref('/rooms/new')}`}>Создать комнату</a>
      </Button>
    </section>
  )
}
