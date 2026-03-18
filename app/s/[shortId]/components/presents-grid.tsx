import { Present } from '@/shared/types'
import { PresentItem } from './present-item'
import * as React from 'react'

type Props = {
  presents: Present[]
  wishlistId: string
  theme: string
  isHidden: boolean
  isExample?: boolean
  columns: 2 | 3
}

export function PresentsGrid({ presents, wishlistId, theme, isHidden, isExample, columns }: Props) {
  if (!presents.length) return null

  return (
    <div className={
      columns === 3
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        : 'grid grid-cols-1 md:grid-cols-2 gap-6'
    }>
      {presents.map(present => (
        <PresentItem key={present.id} present={present} wishlistId={wishlistId} theme={theme} isHidden={isHidden} isExample={isExample} />
      ))}
    </div>
  )
}
