'use client'

import { ImageUpload, ImageUploadValue } from '@/components/image-upload'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function TextImageBlockEditor({ data, onChange }: Props) {
  const handleImage = (val: ImageUploadValue | null) => {
    if (val?.type === 'url') {
      onChange({ ...data, imageUrl: val.value })
    } else if (val?.type === 'file') {
      onChange({ ...data, imageUrl: URL.createObjectURL(val.value) })
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Текст</Label>
        <Textarea
          className="resize-none h-24"
          placeholder="Введи текст..."
          value={(data.content as string) ?? ''}
          onChange={(e) => onChange({ ...data, content: e.target.value })}
        />
      </div>
      <ImageUpload
        label="Картинка"
        onChange={handleImage}
        previewUrl={(data.imageUrl as string) || undefined}
      />
    </div>
  )
}
