'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function VideoBlockEditor({ data, onChange }: Props) {
  const url = (data.url as string) ?? ''
  const caption = (data.caption as string) ?? ''

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Ссылка на видео</Label>
        <Input
          placeholder="https://youtube.com/watch?v=..."
          value={url}
          onChange={(e) => onChange({ ...data, url: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">Поддерживаются YouTube и VK Video</p>
      </div>
      <div className="space-y-1.5">
        <Label>Подпись (необязательно)</Label>
        <Input
          placeholder="Наше видео-приглашение"
          value={caption}
          onChange={(e) => onChange({ ...data, caption: e.target.value })}
        />
      </div>
    </div>
  )
}
