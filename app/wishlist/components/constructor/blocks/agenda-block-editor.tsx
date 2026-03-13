'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'
import React from 'react'

type AgendaItem = { time: string; text: string }

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function AgendaBlockEditor({ data, onChange }: Props) {
  const items = (data.items as AgendaItem[]) ?? []
  const title = (data.title as string) ?? ''

  const update = (index: number, field: keyof AgendaItem, value: string) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    onChange({ ...data, items: next })
  }

  const add = () => {
    onChange({ ...data, items: [...items, { time: '', text: '' }] })
  }

  const remove = (index: number) => {
    onChange({ ...data, items: items.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Заголовок (необязательно)</Label>
        <Input
          placeholder="Программа вечера"
          value={title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
        />
      </div>
      <Label>Пункты программы</Label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-start">
          <Input
            placeholder="18:00"
            value={item.time}
            onChange={(e) => update(i, 'time', e.target.value)}
            className="w-24 shrink-0"
          />
          <Input
            placeholder="Описание пункта"
            value={item.text}
            onChange={(e) => update(i, 'text', e.target.value)}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus size={14} className="mr-1" /> Добавить пункт
      </Button>
    </div>
  )
}
