'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function TimingBlockEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Начало</Label>
        <Input
          type="datetime-local"
          value={(data.start as string) ?? ''}
          onChange={(e) => onChange({ ...data, start: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Конец (необязательно)</Label>
        <Input
          type="datetime-local"
          value={(data.end as string) ?? ''}
          onChange={(e) => onChange({ ...data, end: e.target.value })}
        />
      </div>
    </div>
  )
}
