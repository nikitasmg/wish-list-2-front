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

// Класс схемы задаёт роли (фон, карточка, линия, текст, акцент) — миниатюра
// красится так же, как настоящая страница, без своих цветов.
function schemeClass(colorScheme: string): string {
  const value = normalizeScheme(colorScheme)
  return (colorSchema.find(s => s.value === value) ?? colorSchema[0]).value
}

function coverBlock(template: SystemTemplate) {
  return template.blocks.find(b => b.type === 'cover')
}

export function TemplatePreview({ template, className }: { template: SystemTemplate; className?: string }) {
  const cover = coverBlock(template)
  const view = cover?.view ?? 'center'
  const data = (cover?.data ?? {}) as { number?: string; subtitle?: string }

  // Рамка выбора приходит снаружи и красится цветом интерфейса, поэтому класс
  // схемы — на внутреннем слое, а не на том, где ring.
  return (
    <div className={cn('overflow-hidden rounded-control-lg', className)} aria-hidden>
      <div className={cn(schemeClass(template.colorScheme), 'flex h-full flex-col bg-background text-foreground')}>
        <div className="flex-1 p-3">
          {view === 'number' && (
            <div className="flex flex-col items-center text-center">
              <span className="text-title-lg font-extrabold leading-none text-primary">
                {data.number ?? '7'}
              </span>
              <span className="mt-1.5 text-micro font-extrabold line-clamp-1">{template.sampleTitle}</span>
            </div>
          )}
  
          {view === 'circle' && (
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="w-12 h-12 rounded-full bg-border" />
              <span className="text-caption font-extrabold line-clamp-1">{template.sampleTitle}</span>
            </div>
          )}
  
          {view === 'left' && (
            <div className="flex flex-col gap-2">
              <span className="text-body font-extrabold leading-tight line-clamp-2 text-primary">
                {template.sampleTitle}
              </span>
              <span className="h-6 rounded-control bg-border" />
            </div>
          )}
  
          {view === 'photo' && (
            <div className="flex flex-col gap-2">
              <span className="h-14 rounded-control-lg bg-border" />
              <span className="text-caption font-extrabold line-clamp-1">{template.sampleTitle}</span>
            </div>
          )}
  
          {view === 'arch' && (
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="text-caption font-extrabold line-clamp-1">{template.sampleTitle}</span>
              <span className="w-16 h-9 rounded-t-full bg-border" />
            </div>
          )}
  
          {view === 'center' && (
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="flex w-full h-9 overflow-hidden rounded-control">
                <span className="flex-1 bg-border" />
                <span className="flex-1 bg-primary/35" />
              </span>
              <span className="text-caption font-extrabold line-clamp-1">{template.sampleTitle}</span>
            </div>
          )}
        </div>
  
        {/* Три полоски — блоки страницы: миниатюра показывает не только обложку */}
        <div className="flex flex-col gap-1 p-2 pt-0">
          {[100, 100, 70].map((width, index) => (
            <span
              key={index}
              className="h-4 rounded-xs border border-border bg-card"
              style={{ width: `${width}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/** Телефон с блоками шаблона — для правой колонки страницы выбора. */
export function TemplatePhonePreview({ template }: { template: SystemTemplate }) {
  return (
    <div
      className={cn(schemeClass(template.colorScheme), 'w-[150px] shrink-0 overflow-hidden rounded-card border-4 border-border bg-background p-2 text-foreground')}
      aria-hidden
    >
      <div className="py-2 text-center text-label font-extrabold line-clamp-1 text-primary">
        {template.sampleTitle}
      </div>
      <div className="flex flex-col gap-1">
        {template.blocks.slice(0, 7).map(block => (
          <span
            key={block.id || `${block.row}-${block.col}`}
            className="flex h-5 items-center truncate rounded-xs bg-border px-1.5 text-micro text-muted-foreground"
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
