import { Block } from '@/shared/types'
import Image from 'next/image'
import React from 'react'

export function TextImageBlockView({ block }: { block: Block }) {
  const content = block.data.content as string
  const imageUrl = block.data.imageUrl as string
  if (!content && !imageUrl) return null
  return (
    <div className="grid md:grid-cols-2 gap-6 items-center">
      {content && (
        <div className="pl-8 border-l-4 border-accent text-xl leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      )}
      {imageUrl && (
        <div className="rounded-2xl overflow-hidden">
          <Image src={imageUrl} alt="block image" width={600} height={400} className="w-full object-cover" />
        </div>
      )}
    </div>
  )
}
