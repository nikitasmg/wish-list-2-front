'use client'

import { ColorSchemeBlockEditor } from '@/app/wishlist/components/constructor/blocks/color-scheme-block-editor'
import { DateBlockEditor } from '@/app/wishlist/components/constructor/blocks/date-block-editor'
import { ImageBlockEditor } from '@/app/wishlist/components/constructor/blocks/image-block-editor'
import { LocationBlockEditor } from '@/app/wishlist/components/constructor/blocks/location-block-editor'
import { TextBlockEditor } from '@/app/wishlist/components/constructor/blocks/text-block-editor'
import { TextImageBlockEditor } from '@/app/wishlist/components/constructor/blocks/text-image-block-editor'
import { TimingBlockEditor } from '@/app/wishlist/components/constructor/blocks/timing-block-editor'
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
  color_scheme: 'Цветовая схема',
  timing: 'Таймер',
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

        <div className="py-4">
          {block.type === 'text' && <TextBlockEditor data={data} onChange={setData} />}
          {block.type === 'text_image' && <TextImageBlockEditor data={data} onChange={setData} />}
          {block.type === 'image' && <ImageBlockEditor data={data} onChange={setData} />}
          {block.type === 'date' && <DateBlockEditor data={data} onChange={setData} />}
          {block.type === 'location' && <LocationBlockEditor data={data} onChange={setData} />}
          {block.type === 'color_scheme' && <ColorSchemeBlockEditor data={data} onChange={setData} />}
          {block.type === 'timing' && <TimingBlockEditor data={data} onChange={setData} />}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSave}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
