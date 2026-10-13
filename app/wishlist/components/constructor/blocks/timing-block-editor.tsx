'use client'

import { DateTimePicker } from '@/components/ui/date-time-picker'
import { Label } from '@/components/ui/label'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function TimingBlockEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Label>Дата/время события</Label>
      <DateTimePicker
        aria-label="Дата и время события"
        value={(data.end as string) ?? ''}
        onChange={end => onChange({ ...data, end })}
      />
    </div>
  )
}
