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
    <div className="space-y-2">
      <Label>Дата/время события</Label>
      <Input
        type="datetime-local"
        value={(data.end as string) ?? ''}
        onChange={(e) => onChange({ ...data, end: e.target.value })}
      />
    </div>
  )
}
