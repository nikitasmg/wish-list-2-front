'use client'

import { BlockEditorModal } from '@/app/wishlist/components/constructor/block-editor-modal'
import { BlockToolbar } from '@/app/wishlist/components/constructor/block-toolbar'
import { Block } from '@/shared/types'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import React, { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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
  index: number
  focused: boolean
  onFocusChange: (focused: boolean) => void
  onUpdate: (data: Record<string, unknown>) => void
  onResize: (colSpan: 1 | 2) => void
  onDelete: () => void
}

export function BlockItem({ block, id, index, focused, onFocusChange, onUpdate, onResize, onDelete }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id,
    data: { index, block },
  })

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `block-${id}`,
    data: { row: block.row, col: block.col, occupied: true },
  })

  const style: React.CSSProperties = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.4 : 1,
    gridRow: block.row + 1,
    gridColumn: `${block.col + 1} / span ${block.colSpan ?? 1}`,
    zIndex: isDragging ? 50 : undefined,
  }

  const preview = getPreview(block)
  const label = BLOCK_LABELS[block.type] ?? block.type

  return (
    <>
      <div
        ref={(node) => { setDragRef(node); setDropRef(node) }}
        style={style}
        className={`relative rounded-lg border bg-card p-4 min-h-[80px] transition-all select-none md:cursor-grab ${
          isDragging
            ? 'cursor-grabbing shadow-lg border-primary/60'
            : isOver
              ? 'border-yellow-500/60 bg-yellow-500/5'
              : focused
                ? 'border-primary shadow-md'
                : 'border-border hover:border-primary/50'
        }`}
        onClick={() => onFocusChange(!focused)}
        onBlur={(e) => {
          if (isDragging) return
          const related = e.relatedTarget
          if (!e.currentTarget.contains(related)) {
            setTimeout(() => onFocusChange(false), 0)
          }
        }}
        {...listeners}
        {...attributes}
      >
        {focused && (
          <BlockToolbar
            block={block}
            onResize={onResize}
            onEdit={() => { setEditOpen(true); onFocusChange(false) }}
            onDeleteRequest={() => setDeleteConfirmOpen(true)}
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

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить блок?</AlertDialogTitle>
            <AlertDialogDescription>Это действие нельзя отменить.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function getPreview(block: Block): React.ReactNode {
  const d = block.data
  switch (block.type) {
    case 'text': {
      if (d.html as string) {
        const plain = (d.html as string).replace(/<[^>]*>/g, '').trim()
        return plain || 'Нет текста'
      }
      return (d.content as string) || 'Нет текста'
    }
    case 'text_image': {
      const plain = d.html
        ? (d.html as string).replace(/<[^>]*>/g, '').trim()
        : (d.content as string) ?? ''
      return (
        <div className="flex items-start gap-2">
          {d.imageUrl && (
            <img
              src={d.imageUrl as string}
              alt=""
              className="w-10 h-10 object-cover rounded flex-shrink-0"
            />
          )}
          <span>{plain || 'Текст + картинка'}</span>
        </div>
      )
    }
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
