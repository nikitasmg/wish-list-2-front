'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function DateBlockEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Дата и время</Label>
        <Input
          type="datetime-local"
          value={(data.datetime as string) ?? ''}
          onChange={(e) => onChange({ ...data, datetime: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Подпись (необязательно)</Label>
        <Input
          placeholder="Например: Начало праздника"
          value={(data.label as string) ?? ''}
          onChange={(e) => onChange({ ...data, label: e.target.value })}
        />
      </div>
    </div>
  )
}
