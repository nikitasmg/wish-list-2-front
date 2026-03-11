import { Block } from '@/shared/types'
import React from 'react'

export function TextBlockView({ block }: { block: Block }) {
  const content = block.data.content as string
  if (!content) return null
  return (
    <div className="pl-8 md:pl-12 border-l-4 border-accent">
      <div className="text-xl md:text-2xl leading-relaxed text-foreground max-w-3xl whitespace-pre-wrap">
        {content}
      </div>
    </div>
  )
}
