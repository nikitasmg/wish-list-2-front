// app/wishlist/components/constructor/block-palette.tsx
'use client'

import { Block, BlockType } from '@/shared/types'
import React from 'react'

type PaletteItem = {
  type: BlockType
  label: string
  preview: React.ReactNode
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'text',
    label: 'Текст',
    preview: (
      <p className="text-xs text-muted-foreground border-l-2 border-primary pl-2 leading-snug">
        Здесь будет текст вашего блока...
      </p>
    ),
  },
  {
    type: 'image',
    label: 'Картинка',
    preview: (
      <div className="w-full h-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
        [ изображение ]
      </div>
    ),
  },
  {
    type: 'text_image',
    label: 'Текст + фото',
    preview: (
      <div className="flex gap-2 items-center">
        <p className="text-xs text-muted-foreground flex-1 leading-snug border-l-2 border-primary pl-2">Текст...</p>
        <div className="w-8 h-8 rounded bg-muted shrink-0" />
      </div>
    ),
  },
  {
    type: 'date',
    label: 'Дата',
    preview: (
      <p className="text-xs text-primary font-medium">📅 15 марта 2025, 18:00</p>
    ),
  },
  {
    type: 'location',
    label: 'Место',
    preview: (
      <p className="text-xs text-primary font-medium">📍 Кафе «Уют», Москва</p>
    ),
  },
  {
    type: 'color_scheme',
    label: 'Цветовая схема',
    preview: (
      <div className="flex gap-1">
        {['bg-violet-500', 'bg-pink-500', 'bg-blue-500', 'bg-green-500'].map((c) => (
          <div key={c} className={`w-4 h-4 rounded-full ${c}`} />
        ))}
      </div>
    ),
  },
  {
    type: 'timing',
    label: 'Таймер',
    preview: (
      <p className="text-xs text-primary font-medium">⏱ 18:00 — 23:00</p>
    ),
  },
]

type Props = {
  onAdd: (block: Block) => void
  existingCount: number
}

export function BlockPalette({ onAdd, existingCount }: Props) {
  const handleAdd = (type: BlockType) => {
    onAdd({ type, position: existingCount, colSpan: 1, rowSpan: 1, data: {} })
  }

  return (
    <div className="w-56 shrink-0 space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Блоки
      </h3>
      {PALETTE_ITEMS.map((item) => (
        <button
          key={item.type}
          type="button"
          onClick={() => handleAdd(item.type)}
          className="w-full text-left rounded-lg border bg-card p-3 hover:border-primary/50 hover:bg-accent/30 transition-colors space-y-1.5"
        >
          <span className="text-xs font-semibold text-foreground">{item.label}</span>
          <div>{item.preview}</div>
        </button>
      ))}
    </div>
  )
}
