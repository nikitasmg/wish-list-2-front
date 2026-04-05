// app/wishlist/components/constructor/block-palette.tsx
'use client'

import { Block, BlockType } from '@/shared/types'
import React from 'react'

type PaletteItem = {
  type: BlockType
  label: string
  preview: React.ReactNode
}

export const PALETTE_ITEMS: PaletteItem[] = [
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
      <p className="text-xs text-primary font-medium truncate">📅 15 марта 2025, 18:00</p>
    ),
  },
  {
    type: 'location',
    label: 'Место',
    preview: (
      <p className="text-xs text-primary font-medium truncate">📍 Кафе «Уют», Москва</p>
    ),
  },
  {
    type: 'color_scheme',
    label: 'Дресс-код',
    preview: (
      <div className="flex gap-1.5 items-center">
        {['bg-violet-400', 'bg-pink-400', 'bg-sky-400', 'bg-emerald-400'].map((c) => (
          <div key={c} className={`w-4 h-4 rounded-full ${c}`} />
        ))}
        <span className="text-xs text-muted-foreground ml-1">цвета образа</span>
      </div>
    ),
  },
  {
    type: 'timing',
    label: 'Таймер',
    preview: (
      <div className="flex gap-1.5">
        {['22д', '04ч', '33м'].map((t) => (
          <div key={t} className="bg-muted rounded px-1.5 py-0.5 text-xs font-mono text-primary">{t}</div>
        ))}
      </div>
    ),
  },
  {
    type: 'agenda',
    label: 'Программа',
    preview: (
      <div className="space-y-1">
        {[['18:00', 'Сбор гостей'], ['19:00', 'Торжество']].map(([time, text]) => (
          <div key={time} className="flex gap-2 text-xs">
            <span className="text-muted-foreground font-mono w-10 shrink-0">{time}</span>
            <span className="text-foreground truncate">{text}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    type: 'gallery',
    label: 'Галерея',
    preview: (
      <div className="grid grid-cols-3 gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="aspect-square rounded bg-muted" />
        ))}
      </div>
    ),
  },
  {
    type: 'quote',
    label: 'Цитата',
    preview: (
      <div className="border-l-2 border-accent pl-2">
        <p className="text-xs italic text-muted-foreground leading-snug">«Лучшее ещё впереди»</p>
        <p className="text-xs text-muted-foreground/60 mt-0.5">— Автор</p>
      </div>
    ),
  },
  {
    type: 'divider',
    label: 'Разделитель',
    preview: (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-border" />
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-muted-foreground/40" />
          ))}
        </div>
        <div className="flex-1 h-px bg-border" />
      </div>
    ),
  },
  {
    type: 'contact',
    label: 'Контакт',
    preview: (
      <div className="text-xs space-y-0.5">
        <p className="font-medium text-foreground">Иван Иванов</p>
        <p className="text-muted-foreground">+7 999 123 45 67</p>
      </div>
    ),
  },
  {
    type: 'video',
    label: 'Видео',
    preview: (
      <div className="w-full h-10 rounded bg-muted flex items-center justify-center gap-2">
        <div className="w-4 h-4 rounded-full bg-muted-foreground/30 flex items-center justify-center">
          <div className="w-0 h-0 border-y-[4px] border-y-transparent border-l-[6px] border-l-muted-foreground/60 ml-0.5" />
        </div>
        <span className="text-xs text-muted-foreground">YouTube / VK</span>
      </div>
    ),
  },
  {
    type: 'checklist',
    label: 'Чеклист',
    preview: (
      <div className="space-y-1">
        {['Паспорт', 'Хорошее настроение'].map((item) => (
          <div key={item} className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded border border-muted-foreground/40 shrink-0" />
            <span className="text-muted-foreground">{item}</span>
          </div>
        ))}
      </div>
    ),
  },
]

type Props = {
  onAdd: (block: Block) => void
}

export function BlockPalette({ onAdd }: Props) {
  const handleAdd = (type: BlockType) => {
    onAdd({ type, row: 0, col: 0, colSpan: 1, data: {} })
  }

  return (
    <div className="w-full overflow-x-auto flex flex-row gap-2 pb-2 md:w-56 md:shrink-0 md:flex-col md:overflow-x-visible md:pb-0">
      <h3 className="hidden md:block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Блоки
      </h3>
      {PALETTE_ITEMS.map((item) => (
        <button
          key={item.type}
          type="button"
          onClick={() => handleAdd(item.type)}
          className="shrink-0 w-28 md:w-full text-left rounded-lg border bg-card p-3 hover:border-primary/50 hover:bg-accent/30 transition-colors space-y-1.5 overflow-hidden"
        >
          <span className="text-xs font-semibold text-foreground">{item.label}</span>
          <div>{item.preview}</div>
        </button>
      ))}
    </div>
  )
}
