'use client'

import { ImageUpload, ImageUploadValue } from '@/components/image-upload'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function GalleryBlockEditor({ data, onChange }: Props) {
  const images = (data.images as string[]) ?? []

  const updateImage = (index: number, val: ImageUploadValue | null) => {
    let url = ''
    if (val?.type === 'url') url = val.value
    else if (val?.type === 'file') url = URL.createObjectURL(val.value)
    const next = images.map((img, i) => (i === index ? url : img))
    onChange({ ...data, images: next })
  }

  const addSlot = () => {
    onChange({ ...data, images: [...images, ''] })
  }

  const removeSlot = (index: number) => {
    onChange({ ...data, images: images.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      {images.map((url, i) => (
        <div key={i} className="relative">
          <ImageUpload
            label={`Фото ${i + 1}`}
            onChange={(val) => updateImage(i, val)}
            previewUrl={url || undefined}
          />
          <button
            type="button"
            onClick={() => removeSlot(i)}
            className="absolute top-0 right-0 p-1 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addSlot}>
        <Plus size={14} className="mr-1" /> Добавить фото
      </Button>
    </div>
  )
}
