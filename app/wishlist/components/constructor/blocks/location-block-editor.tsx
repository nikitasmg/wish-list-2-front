'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function LocationBlockEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Название места</Label>
        <Input
          placeholder="Кафе «Уют»"
          value={(data.name as string) ?? ''}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Ссылка на карту (2GIS / Yandex)</Label>
        <Input
          placeholder="https://2gis.ru/..."
          value={(data.link as string) ?? ''}
          onChange={(e) => onChange({ ...data, link: e.target.value })}
        />
      </div>
    </div>
  )
}
