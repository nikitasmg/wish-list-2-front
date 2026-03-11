'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Plus } from 'lucide-react'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function ColorSchemeBlockEditor({ data, onChange }: Props) {
  const colors = (data.colors as string[]) ?? []
  const label = (data.label as string) ?? ''

  const addColor = () => {
    onChange({ ...data, colors: [...colors, '#a78bfa'] })
  }

  const updateColor = (index: number, value: string) => {
    const next = colors.map((c, i) => (i === index ? value : c))
    onChange({ ...data, colors: next })
  }

  const removeColor = (index: number) => {
    onChange({ ...data, colors: colors.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Подпись (необязательно)</Label>
        <Input
          placeholder="Например: Приходите в этих цветах"
          value={label}
          onChange={(e) => onChange({ ...data, label: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Цвета</Label>
        <div className="flex flex-wrap gap-3">
          {colors.map((color, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="relative">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => updateColor(i, e.target.value)}
                  className="w-12 h-12 rounded-full border-2 border-border cursor-pointer p-0.5 bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => removeColor(i)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                >
                  <X size={10} />
                </button>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{color}</span>
            </div>
          ))}
          <button
            type="button"
            onClick={addColor}
            className="w-12 h-12 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
