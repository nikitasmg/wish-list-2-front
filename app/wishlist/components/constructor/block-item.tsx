// app/wishlist/components/constructor/block-item.tsx
'use client'

import { BlockEditorModal } from '@/app/wishlist/components/constructor/block-editor-modal'
import { BlockToolbar } from '@/app/wishlist/components/constructor/block-toolbar'
import { Block } from '@/shared/types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import React, { useState } from 'react'

const BLOCK_LABELS: Record<string, string> = {
  text: 'Текст',
  text_image: 'Текст + картинка',
  image: 'Картинка',
  date: 'Дата',
  location: 'Место',
  color_scheme: 'Дресс-код / Цвета',
  timing: 'Таймер',
  agenda: 'Программа вечера',
  gallery: 'Галерея',
  quote: 'Цитата',
  divider: 'Разделитель',
  contact: 'Контакт',
  video: 'Видео',
  checklist: 'Чеклист',
}

type Props = {
  block: Block
  id: string
  viewMode: 'desktop' | 'mobile'
  isMobileDevice: boolean
  focused: boolean
  onFocusChange: (focused: boolean) => void
  onUpdate: (data: Record<string, unknown>) => void
  onResize: (colSpan: 1 | 2, rowSpan: 1 | 2 | 3) => void
  onDelete: () => void
  gridStyle?: React.CSSProperties
}

export function BlockItem({ block, id, viewMode, isMobileDevice, focused, onFocusChange, onUpdate, onResize, onDelete, gridStyle }: Props) {
  const [editOpen, setEditOpen] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    ...gridStyle,
  }

  const preview = getPreview(block)
  const label = BLOCK_LABELS[block.type] ?? block.type

  // ── Mobile device layout (both tabs) ────────────────────────────
  // Long-press anywhere → drag. Quick tap → focus (compact inline toolbar).
  if (isMobileDevice) {
    return (
      <>
        <div
          ref={setNodeRef}
          style={style}
          className={`rounded-lg border bg-card overflow-hidden touch-none select-none transition-shadow ${
            focused
              ? 'border-primary shadow-md'
              : isDragging
                ? 'border-primary/60 shadow-lg'
                : 'border-border'
          }`}
          onClick={() => onFocusChange(!focused)}
          {...attributes}
          {...listeners}
        >
          {/* Compact inline toolbar — tap to show */}
          {focused && (
            <div
              className="flex items-center gap-1 px-2 py-1.5 border-b border-border/60 bg-muted/40"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => { setEditOpen(true); onFocusChange(false) }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Pencil size={12} />
                Изменить
              </button>
              <div className="w-px h-4 bg-border/60" />
              <button
                type="button"
                onClick={() => { onDelete(); onFocusChange(false) }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 size={12} />
                Удалить
              </button>
            </div>
          )}

          {/* Card content */}
          <div className="flex items-start gap-2 px-3 py-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 truncate">
                {label}
              </p>
              <div className="text-sm text-foreground line-clamp-2">{preview}</div>
            </div>
            {!focused && (
              <GripVertical size={16} className="text-muted-foreground/60 shrink-0 mt-0.5" />
            )}
          </div>
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

  // ── Desktop device layout ───────────────────────────────────────
  // Click to focus → floating toolbar appears above the card.
  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`relative rounded-lg border bg-card p-4 min-h-[80px] cursor-pointer transition-shadow ${
          focused ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'
        }`}
        onClick={() => onFocusChange(!focused)}
        onBlur={(e) => {
          const related = e.relatedTarget
          if (!e.currentTarget.contains(related)) {
            setTimeout(() => onFocusChange(false), 0)
          }
        }}
        tabIndex={0}
      >
        {focused && (
          <BlockToolbar
            block={block}
            dragListeners={listeners}
            dragAttributes={attributes}
            onResize={onResize}
            onEdit={() => { setEditOpen(true); onFocusChange(false) }}
            onDelete={onDelete}
          />
        )}

        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          {label}
        </p>
        <div className="text-sm text-foreground line-clamp-3">{preview}</div>
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

function getPreview(block: Block): React.ReactNode {
  const d = block.data
  switch (block.type) {
    case 'text':
      return (d.html as string)
        ? <span className="text-muted-foreground italic text-xs">Текст (HTML)</span>
        : ((d.content as string) || 'Нет текста')
    case 'text_image':
      return (d.content as string) || 'Текст + картинка'
    case 'image':
      return (d.url as string)
        ? <img src={d.url as string} alt="preview" className="w-full h-20 object-cover rounded mt-1" />
        : <span className="text-muted-foreground">Нет картинки</span>
    case 'date':
      return (d.datetime as string) || 'Дата не указана'
    case 'location':
      return (d.name as string) || 'Место не указано'
    case 'color_scheme': {
      const colors = d.colors as string[] | undefined
      if (!colors?.length) return <span className="text-muted-foreground">Нет цветов</span>
      return (
        <div className="flex gap-1 flex-wrap mt-1">
          {colors.map((c, i) => (
            <div key={i} className="w-5 h-5 rounded-full border border-border" style={{ background: c }} />
          ))}
        </div>
      )
    }
    case 'timing':
      return (d.start as string) ? `До: ${new Date(d.start as string).toLocaleString('ru-RU')}` : 'Время не указано'
    case 'agenda': {
      const items = d.items as { time: string; text: string }[] | undefined
      return items?.length ? `${items.length} пунктов программы` : 'Нет пунктов'
    }
    case 'gallery': {
      const imgs = d.images as string[] | undefined
      if (!imgs?.length) return <span className="text-muted-foreground">Нет фото</span>
      return (
        <div className="flex gap-1 mt-1">
          {imgs.slice(0, 4).map((url, i) => (
            <img key={i} src={url} alt="" className="w-10 h-10 object-cover rounded" />
          ))}
          {imgs.length > 4 && <span className="text-xs text-muted-foreground self-center">+{imgs.length - 4}</span>}
        </div>
      )
    }
    case 'quote':
      return (d.text as string) || 'Нет текста'
    case 'divider':
      return `Разделитель: ${(d.style as string) || 'line'}`
    case 'contact':
      return (d.name as string) || 'Нет имени'
    case 'video':
      return (d.url as string) ? `Видео: ${d.url as string}` : 'Нет ссылки'
    case 'checklist': {
      const items = d.items as string[] | undefined
      return items?.length ? `${items.length} пунктов` : 'Нет пунктов'
    }
    default:
      return ''
  }
}
