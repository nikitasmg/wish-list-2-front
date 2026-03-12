'use client'

import { ImageUpload, ImageUploadValue } from '@/components/image-upload'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function ImageBlockEditor({ data, onChange }: Props) {
  const handleChange = (val: ImageUploadValue | null) => {
    if (val?.type === 'url') {
      onChange({ ...data, url: val.value })
    } else if (val?.type === 'file') {
      const url = URL.createObjectURL(val.value)
      onChange({ ...data, url })
    }
  }

  return (
    <ImageUpload
      label="Картинка"
      onChange={handleChange}
      previewUrl={(data.url as string) || undefined}
    />
  )
}
