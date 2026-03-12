'use client'

import { Label } from '@/components/ui/label'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

const STYLES = [
  { value: 'line', label: 'Линия' },
  { value: 'dots', label: 'Точки' },
  { value: 'stars', label: 'Звёздочки' },
  { value: 'blank', label: 'Пустое пространство' },
]

export function DividerBlockEditor({ data, onChange }: Props) {
  const style = (data.style as string) ?? 'line'

  return (
    <div className="space-y-3">
      <Label>Стиль разделителя</Label>
      <div className="grid grid-cols-2 gap-2">
        {STYLES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => onChange({ ...data, style: s.value })}
            className={`p-3 rounded-lg border text-sm text-left transition-colors ${
              style === s.value
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'border-border bg-card text-muted-foreground hover:border-primary/50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
