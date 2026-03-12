import { Block } from '@/shared/types'
import React from 'react'

export function GalleryBlockView({ block }: { block: Block }) {
  const images = block.data.images as string[] | undefined
  const caption = block.data.caption as string | undefined

  if (!images?.length) return null

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {images.map((src, i) => (
          <div key={i} className="aspect-square overflow-hidden rounded-lg">
            <img
              src={src}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
      {caption && (
        <p className="text-sm text-muted-foreground text-center">{caption}</p>
      )}
    </div>
  )
}
