'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'
import React from 'react'

type ChecklistItem = { text: string }

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function ChecklistBlockEditor({ data, onChange }: Props) {
  const title = (data.title as string) ?? ''
  const items = (data.items as ChecklistItem[]) ?? []

  const updateItem = (index: number, value: string) => {
    const next = items.map((item, i) => (i === index ? { text: value } : item))
    onChange({ ...data, items: next })
  }

  const addItem = () => {
    onChange({ ...data, items: [...items, { text: '' }] })
  }

  const removeItem = (index: number) => {
    onChange({ ...data, items: items.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Заголовок (необязательно)</Label>
        <Input
          placeholder="Что взять с собой"
          value={title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Пункты</Label>
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              placeholder="Пункт списка"
              value={item.text}
              onChange={(e) => updateItem(i, e.target.value)}
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="p-2 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus size={14} className="mr-1" /> Добавить пункт
        </Button>
      </div>
    </div>
  )
}
