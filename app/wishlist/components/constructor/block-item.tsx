// app/wishlist/components/constructor/block-item.tsx
'use client'

import { BlockEditorModal } from '@/app/wishlist/components/constructor/block-editor-modal'
import { BlockToolbar } from '@/app/wishlist/components/constructor/block-toolbar'
import { Block } from '@/shared/types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import React, { useState } from 'react'

const BLOCK_LABELS: Record<string, string> = {
  text: 'Текст',
  text_image: 'Текст + картинка',
  image: 'Картинка',
  date: 'Дата',
  location: 'Место',
  color_scheme: 'Цветовая схема',
  timing: 'Таймер',
}

/**
 * onUpdate — replaces the entire block.data object.
 * The caller (BlockEditorModal.onSave) must always provide the full data object.
 */
type Props = {
  block: Block
  id: string
  onUpdate: (data: Record<string, unknown>) => void
  onResize: (colSpan: 1 | 2, rowSpan: 1 | 2 | 3) => void
  onDelete: () => void
}

export function BlockItem({ block, id, onUpdate, onResize, onDelete }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [focused, setFocused] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    gridColumn: `span ${block.colSpan ?? 1}`,
    gridRow: `span ${block.rowSpan ?? 1}`,
  }

  const preview = getPreview(block)

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`relative rounded-lg border bg-card p-4 min-h-[80px] cursor-pointer transition-shadow ${
          focused ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'
        }`}
        onClick={() => setFocused((v) => !v)}
        onBlur={(e) => {
          const related = e.relatedTarget
          if (!e.currentTarget.contains(related)) {
            setTimeout(() => setFocused(false), 0)
          }
        }}
        tabIndex={0}
      >
        {/* Contextual toolbar — visible when focused */}
        {focused && (
          <BlockToolbar
            block={block}
            dragListeners={listeners}
            dragAttributes={attributes}
            onResize={onResize}
            onEdit={() => { setEditOpen(true); setFocused(false) }}
            onDelete={onDelete}
          />
        )}

        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          {BLOCK_LABELS[block.type] ?? block.type}
        </p>
        <p className="text-sm text-foreground line-clamp-3">{preview}</p>
      </div>

      <BlockEditorModal
        block={block}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={onUpdate}
      />
    </>
  )
}

function getPreview(block: Block): string {
  const d = block.data
  switch (block.type) {
    case 'text': return (d.content as string) || 'Нет текста'
    case 'text_image': return (d.content as string) || 'Текст + картинка'
    case 'image': return (d.url as string) ? 'Картинка загружена' : 'Нет картинки'
    case 'date': return (d.datetime as string) || 'Дата не указана'
    case 'location': return (d.name as string) || 'Место не указано'
    case 'color_scheme': return (d.scheme as string) || 'main'
    case 'timing': return (d.start as string) || 'Время не указано'
    default: return ''
  }
}
