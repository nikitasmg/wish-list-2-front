'use client'

import { colorSchema, normalizeScheme } from '@/shared/constants'
import { SystemTemplate } from '@/shared/types'
import { cn } from '@/lib/utils'
import * as React from 'react'

/**
 * Миниатюра шаблона.
 *
 * Рисуется из тех же данных, что и настоящая страница: схема берётся из
 * реестра, вид обложки — из блока. Держать отдельные картинки-превью означало
 * бы, что витрина рано или поздно покажет не то, что человек получит.
 */

type Palette = { bg: string; accent: string; dark: boolean }

function palette(colorScheme: string): Palette {
  const scheme = colorSchema.find(s => s.value === normalizeScheme(colorScheme)) ?? colorSchema[0]
  return { bg: scheme.colors[0], accent: scheme.colors[1], dark: scheme.kind === 'dark' }
}

function coverBlock(template: SystemTemplate) {
  return template.blocks.find(b => b.type === 'cover')
}

export function TemplatePreview({ template, className }: { template: SystemTemplate; className?: string }) {
  const { bg, accent, dark } = palette(template.colorScheme)
  const cover = coverBlock(template)
  const view = cover?.view ?? 'center'
  const data = (cover?.data ?? {}) as { number?: string; subtitle?: string }

  const ink = dark ? 'rgba(255,255,255,0.92)' : 'rgba(17,17,20,0.9)'
  const soft = dark ? 'rgba(255,255,255,0.14)' : 'rgba(17,17,20,0.10)'
  const card = dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.75)'

  return (
    <div
      className={cn('flex flex-col overflow-hidden rounded-xl', className)}
      style={{ backgroundColor: bg, color: ink }}
      aria-hidden
    >
      <div className="flex-1 p-3">
        {view === 'number' && (
          <div className="flex flex-col items-center text-center">
            <span className="text-4xl font-extrabold leading-none tracking-tighter" style={{ color: accent }}>
              {data.number ?? '7'}
            </span>
            <span className="mt-1.5 text-[11px] font-extrabold line-clamp-1">{template.sampleTitle}</span>
          </div>
        )}

        {view === 'circle' && (
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="w-12 h-12 rounded-full" style={{ backgroundColor: soft }} />
            <span className="text-[12px] font-extrabold tracking-tight line-clamp-1">{template.sampleTitle}</span>
          </div>
        )}

        {view === 'left' && (
          <div className="flex flex-col gap-2">
            <span className="text-[15px] font-extrabold leading-tight tracking-tighter line-clamp-2" style={{ color: accent }}>
              {template.sampleTitle}
            </span>
            <span className="h-6 rounded-md" style={{ backgroundColor: soft }} />
          </div>
        )}

        {view === 'photo' && (
          <div className="flex flex-col gap-2">
            <span className="h-14 rounded-md" style={{ backgroundColor: soft }} />
            <span className="text-[12px] font-extrabold tracking-tight line-clamp-1">{template.sampleTitle}</span>
          </div>
        )}

        {view === 'arch' && (
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-[12px] font-extrabold tracking-tight line-clamp-1">{template.sampleTitle}</span>
            <span className="w-16 h-9 rounded-t-full" style={{ backgroundColor: soft }} />
          </div>
        )}

        {view === 'center' && (
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="flex w-full h-9 overflow-hidden rounded-md">
              <span className="flex-1" style={{ backgroundColor: soft }} />
              <span className="flex-1" style={{ backgroundColor: accent, opacity: 0.35 }} />
            </span>
            <span className="text-[12px] font-extrabold tracking-tight line-clamp-1">{template.sampleTitle}</span>
          </div>
        )}
      </div>

      {/* Три полоски — блоки страницы: миниатюра показывает не только обложку */}
      <div className="flex flex-col gap-1 p-2 pt-0">
        {[100, 100, 70].map((width, index) => (
          <span
            key={index}
            className="h-4 rounded"
            style={{ width: `${width}%`, backgroundColor: card, border: `1px solid ${soft}` }}
          />
        ))}
      </div>
    </div>
  )
}

/** Телефон с блоками шаблона — для правой колонки страницы выбора. */
export function TemplatePhonePreview({ template }: { template: SystemTemplate }) {
  const { bg, accent, dark } = palette(template.colorScheme)
  const ink = dark ? 'rgba(255,255,255,0.92)' : 'rgba(17,17,20,0.9)'
  const soft = dark ? 'rgba(255,255,255,0.14)' : 'rgba(17,17,20,0.10)'
  const muted = dark ? 'rgba(255,255,255,0.55)' : 'rgba(17,17,20,0.5)'

  return (
    <div
      className="w-[150px] shrink-0 overflow-hidden rounded-2xl border-4 p-2"
      style={{ backgroundColor: bg, color: ink, borderColor: soft }}
      aria-hidden
    >
      <div className="py-2 text-center text-[13px] font-extrabold tracking-tight line-clamp-1" style={{ color: accent }}>
        {template.sampleTitle}
      </div>
      <div className="flex flex-col gap-1">
        {template.blocks.slice(0, 7).map(block => (
          <span
            key={block.id || `${block.row}-${block.col}`}
            className="flex h-5 items-center truncate rounded px-1.5 text-[8px]"
            style={{ backgroundColor: soft, color: muted }}
          >
            {block.caption || blockLabel(block.type)}
          </span>
        ))}
      </div>
    </div>
  )
}

const BLOCK_LABELS: Record<string, string> = {
  cover: 'Обложка',
  text: 'Текст',
  quote: 'Цитата',
  media: 'Фото',
  video: 'Видео',
  list: 'Список',
  location: 'Место',
  color_scheme: 'Дресс-код',
  contact: 'Контакты',
  wishlist: 'Вишлист',
  rsvp: 'Ответ гостя',
  poll: 'Голосование',
  playlist: 'Плейлист',
  guestbook: 'Поздравления',
  timing: 'Таймер',
  date: 'Дата',
  divider: 'Разделитель',
}

export function blockLabel(type: string): string {
  return BLOCK_LABELS[type] ?? type
}
