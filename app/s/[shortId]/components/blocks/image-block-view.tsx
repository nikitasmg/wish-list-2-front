import { Block } from '@/shared/types'
import Image from 'next/image'
import React from 'react'

export function ImageBlockView({ block }: { block: Block }) {
  const url = block.data.url as string
  if (!url) return null
  return (
    <div className="rounded-2xl overflow-hidden max-w-2xl">
      <Image src={url} alt="block image" width={800} height={450} className="w-full object-cover" unoptimized />
    </div>
  )
}
