'use client'

import { useState } from 'react'
import { Present, Wishlist } from '@/shared/types'
import { PresentsList } from './presents-list'
import { PresentsGrid } from './presents-grid'
import { PresentsFilter, PresentFilter, filterPresents } from './presents-filter'
import { PresentDetailModal } from './present-detail-modal'
import { getSchemeConfig, schemeTheme } from './scheme-config'

export function GiftsSection({ wishlist, presents, owner = false, preview = false, view }: {
  wishlist: Wishlist; presents: Present[]; owner?: boolean; preview?: boolean; view?: string
}) {
  const [filter, setFilter] = useState<PresentFilter>('all')
  // Одна модалка на всю секцию, а не по одной на карточку: подробности
  // открывают у одного подарка за раз.
  const [detail, setDetail] = useState<Present | null>(null)
  // Тема для порталов: диалоги рендерятся в body, вне обёртки страницы.
  const theme = schemeTheme(wishlist.settings)
  const hidden = preview || (owner && !wishlist.settings.showGiftAvailability)
  const visible = hidden ? presents : filterPresents(presents, filter)
  const layout = view ?? wishlist.settings.presentsLayout ?? 'list'
  // Never reveal reservations indirectly through filters or visual dimming.
  const items = hidden ? visible.map(p => ({ ...p, reserved: false, reservedByMe: false })) : visible
  return <section className="space-y-5">
    {!hidden && <PresentsFilter presents={presents} value={filter} onChange={setFilter} />}
    {!items.length ? <p className="text-muted-foreground">{!presents.length ? 'Подарков пока нет' : 'В этой категории пока нет подарков'}</p>
      : layout === 'list' ? <PresentsList presents={items} wishlistId={wishlist.id} theme={theme} config={getSchemeConfig(wishlist.settings.colorScheme)} isHidden={hidden} onDetails={setDetail} />
      : <PresentsGrid presents={items} wishlistId={wishlist.id} theme={theme} isHidden={hidden} columns={layout === 'tiles' || layout === 'grid3' ? 3 : 2} onDetails={setDetail} />}
    <PresentDetailModal
      present={detail}
      wishlistId={wishlist.id}
      theme={theme}
      isHidden={hidden}
      open={Boolean(detail)}
      onOpenChange={open => { if (!open) setDetail(null) }}
    />
  </section>
}
