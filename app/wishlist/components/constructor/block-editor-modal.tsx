'use client'

import { AgendaBlockEditor } from '@/app/wishlist/components/constructor/blocks/agenda-block-editor'
import { ChecklistBlockEditor } from '@/app/wishlist/components/constructor/blocks/checklist-block-editor'
import { ColorSchemeBlockEditor } from '@/app/wishlist/components/constructor/blocks/color-scheme-block-editor'
import { ContactBlockEditor } from '@/app/wishlist/components/constructor/blocks/contact-block-editor'
import { DateBlockEditor } from '@/app/wishlist/components/constructor/blocks/date-block-editor'
import { DividerBlockEditor } from '@/app/wishlist/components/constructor/blocks/divider-block-editor'
import { GalleryBlockEditor } from '@/app/wishlist/components/constructor/blocks/gallery-block-editor'
import { ImageBlockEditor } from '@/app/wishlist/components/constructor/blocks/image-block-editor'
import { LocationBlockEditor } from '@/app/wishlist/components/constructor/blocks/location-block-editor'
import { QuoteBlockEditor } from '@/app/wishlist/components/constructor/blocks/quote-block-editor'
import { TextBlockEditor } from '@/app/wishlist/components/constructor/blocks/text-block-editor'
import { TextImageBlockEditor } from '@/app/wishlist/components/constructor/blocks/text-image-block-editor'
import { TimingBlockEditor } from '@/app/wishlist/components/constructor/blocks/timing-block-editor'
import { VideoBlockEditor } from '@/app/wishlist/components/constructor/blocks/video-block-editor'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Block } from '@/shared/types'
import React, { useState } from 'react'

const BLOCK_LABELS: Record<string, string> = {
  text: 'Текст',
  text_image: 'Текст + картинка',
  image: 'Картинка',
  date: 'Дата',
  location: 'Место',
  color_scheme: 'Дресс-код / Цвета',
  timing: 'Таймер',
  agenda: 'Программа',
  gallery: 'Галерея',
  quote: 'Цитата',
  divider: 'Разделитель',
  contact: 'Контакт',
  video: 'Видео',
  checklist: 'Чеклист',
}

type Props = {
  block: Block
  open: boolean
  onClose: () => void
  onSave: (data: Record<string, unknown>) => void
}

export function BlockEditorModal({ block, open, onClose, onSave }: Props) {
  const [data, setData] = useState<Record<string, unknown>>(block.data)

  // Re-sync state when block data changes (e.g. modal reopened for an updated block)
  React.useEffect(() => {
    setData(block.data)
  }, [block])

  const handleSave = () => {
    onSave(data)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Редактировать: {BLOCK_LABELS[block.type] ?? block.type}</DialogTitle>
        </DialogHeader>

        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {block.type === 'text' && <TextBlockEditor data={data} onChange={setData} />}
          {block.type === 'text_image' && <TextImageBlockEditor data={data} onChange={setData} />}
          {block.type === 'image' && <ImageBlockEditor data={data} onChange={setData} />}
          {block.type === 'date' && <DateBlockEditor data={data} onChange={setData} />}
          {block.type === 'location' && <LocationBlockEditor data={data} onChange={setData} />}
          {block.type === 'color_scheme' && <ColorSchemeBlockEditor data={data} onChange={setData} />}
          {block.type === 'timing' && <TimingBlockEditor data={data} onChange={setData} />}
          {block.type === 'agenda' && <AgendaBlockEditor data={data} onChange={setData} />}
          {block.type === 'gallery' && <GalleryBlockEditor data={data} onChange={setData} />}
          {block.type === 'quote' && <QuoteBlockEditor data={data} onChange={setData} />}
          {block.type === 'divider' && <DividerBlockEditor data={data} onChange={setData} />}
          {block.type === 'contact' && <ContactBlockEditor data={data} onChange={setData} />}
          {block.type === 'video' && <VideoBlockEditor data={data} onChange={setData} />}
          {block.type === 'checklist' && <ChecklistBlockEditor data={data} onChange={setData} />}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSave}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
