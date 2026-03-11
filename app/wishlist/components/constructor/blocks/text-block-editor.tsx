'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function TextBlockEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Label>Текст</Label>
      <Textarea
        className="resize-none h-32"
        placeholder="Введи текст..."
        value={(data.content as string) ?? ''}
        onChange={(e) => onChange({ ...data, content: e.target.value })}
      />
    </div>
  )
}
