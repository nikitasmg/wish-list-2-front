'use client'

import { ColorsSelect } from '@/app/wishlist/components/colors-select'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function ColorSchemeBlockEditor({ data, onChange }: Props) {
  return (
    <ColorsSelect
      value={(data.scheme as string) ?? 'main'}
      onChange={(scheme) => onChange({ ...data, scheme })}
    />
  )
}
