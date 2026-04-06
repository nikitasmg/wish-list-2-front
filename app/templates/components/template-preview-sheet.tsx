'use client'

import * as React from 'react'
import { Block, BlockType, Template } from '@/shared/types'
import { colorSchema } from '@/shared/constants'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  CheckSquare,
  FileImage,
  FileText,
  Image,
  LayoutGrid,
  List,
  Loader2,
  MapPin,
  Minus,
  Palette,
  Quote,
  Timer,
  User,
  Video,
} from 'lucide-react'

const BLOCK_META: Record<BlockType, { label: string; icon: React.ElementType }> = {
  text: { label: 'Текст', icon: FileText },
  text_image: { label: 'Текст + фото', icon: FileImage },
  image: { label: 'Изображение', icon: Image },
  date: { label: 'Дата', icon: Calendar },
  location: { label: 'Место', icon: MapPin },
  color_scheme: { label: 'Цветовая схема', icon: Palette },
  timing: { label: 'Обратный отсчёт', icon: Timer },
  agenda: { label: 'Программа', icon: List },
  gallery: { label: 'Галерея', icon: LayoutGrid },
  quote: { label: 'Цитата', icon: Quote },
  divider: { label: 'Разделитель', icon: Minus },
  contact: { label: 'Контакт', icon: User },
  video: { label: 'Видео', icon: Video },
  checklist: { label: 'Чеклист', icon: CheckSquare },
}

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim()

const getSnippet = (block: Block): string | null => {
  const d = block.data
  switch (block.type) {
    case 'text': return stripHtml((d.html as string) || (d.content as string) || '').slice(0, 60) || null
    case 'text_image': return ((d.content as string) || '').slice(0, 60) || null
    case 'date': return (d.label as string) || null
    case 'location': return (d.name as string) || null
    case 'quote': return ((d.text as string) || '').slice(0, 60) || null
    case 'contact': return (d.name as string) || null
    case 'video': return (d.title as string) || null
    case 'checklist': return (d.title as string) || null
    default: return null
  }
}

type Props = {
  template: Template | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUse: (template: Template) => void
  isPending: boolean
}

export function TemplatePreviewSheet({ template, open, onOpenChange, onUse, isPending }: Props) {
  if (!template) return null

  const scheme = colorSchema.find((s) => s.value === template.settings?.colorScheme)
  const [bg, accent] = scheme?.colors ?? ['hsl(var(--muted))', 'hsl(var(--primary))']

  const sorted = [...(template.blocks ?? [])].sort((a, b) => a.row - b.row || a.col - b.col)
  const rowMap = sorted.reduce<Record<number, Block[]>>((acc, block) => {
    if (!acc[block.row]) acc[block.row] = []
    acc[block.row].push(block)
    return acc
  }, {})
  const rows = Object.values(rowMap)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0 overflow-y-auto">
        {/* Цветной заголовок */}
        <div
          className="px-6 py-8 shrink-0"
          style={{ background: `linear-gradient(135deg, ${bg}, ${accent}30)` }}
        >
          <SheetTitle className="text-xl mb-1">{template.name}</SheetTitle>
          {template.userDisplayName && (
            <p className="text-sm opacity-60">от {template.userDisplayName}</p>
          )}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs bg-black/10 dark:bg-white/10 rounded-full px-2.5 py-0.5">
              {template.blocks?.length ?? 0} блоков
            </span>
            {scheme && (
              <span className="text-xs bg-black/10 dark:bg-white/10 rounded-full px-2.5 py-0.5 flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: accent }} />
                {scheme.name}
              </span>
            )}
          </div>
        </div>

        {/* Структура блоков */}
        <div className="px-6 py-5 flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            Структура шаблона
          </p>

          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Блоков нет</p>
          ) : (
            <div className="space-y-2">
              {rows.map((rowBlocks, rowIdx) => (
                <div key={rowIdx} className="grid grid-cols-2 gap-2">
                  {rowBlocks.map((block) => {
                    const meta = BLOCK_META[block.type]
                    const Icon = meta?.icon
                    const snippet = getSnippet(block)
                    return (
                      <div
                        key={`${block.row}-${block.col}`}
                        className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 flex flex-col gap-1 min-w-0"
                        style={{ gridColumn: block.colSpan === 2 ? 'span 2' : undefined }}
                      >
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          {Icon && <Icon size={13} className="shrink-0" />}
                          <span className="text-[11px] font-medium truncate">{meta?.label}</span>
                        </div>
                        {snippet && (
                          <p className="text-xs text-foreground/60 line-clamp-1">{snippet}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Кнопка использовать */}
        <div className="px-6 pb-6 pt-2 shrink-0 border-t border-border">
          <Button className="w-full" onClick={() => onUse(template)} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Использовать шаблон
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
