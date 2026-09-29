import type { SchemeTheme } from './scheme-config'
import { Present } from '@/shared/types'
import { PresentItem } from './present-item'
import * as React from 'react'

type Props = {
  presents: Present[]
  wishlistId: string
  theme: SchemeTheme
  isHidden: boolean
  isOwner?: boolean
  isExample?: boolean
  columns: 2 | 3
  /** Открыть подробности: модалка живёт одна на всю секцию. */
  onDetails?: (present: Present) => void
}

export function PresentsGrid({ presents, wishlistId, theme, isHidden, isOwner, isExample, columns, onDetails }: Props) {
  if (!presents.length) return null

  return (
    <div className={
      columns === 3
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        : 'grid grid-cols-1 md:grid-cols-2 gap-6'
    }>
      {presents.map(present => (
        <PresentItem key={present.id} present={present} wishlistId={wishlistId} theme={theme} isHidden={isHidden} isOwner={isOwner} isExample={isExample} onDetails={onDetails} />
      ))}
    </div>
  )
}
