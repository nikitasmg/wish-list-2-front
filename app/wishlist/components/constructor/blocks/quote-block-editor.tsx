'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function QuoteBlockEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Цитата</Label>
        <Textarea
          className="resize-none h-28"
          placeholder="«Лучший праздник — тот, куда зовут лучших людей»"
          value={(data.text as string) ?? ''}
          onChange={(e) => onChange({ ...data, text: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Автор (необязательно)</Label>
        <Input
          placeholder="— именинница"
          value={(data.author as string) ?? ''}
          onChange={(e) => onChange({ ...data, author: e.target.value })}
        />
      </div>
    </div>
  )
}
