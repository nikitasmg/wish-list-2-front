import { Block } from '@/shared/types'
import React from 'react'

export function QuoteBlockView({ block }: { block: Block }) {
  const text = block.data.text as string | undefined
  const author = block.data.author as string | undefined

  if (!text) return null

  return (
    <figure className="pl-8 md:pl-12 border-l-4 border-accent space-y-2">
      <blockquote className="text-xl md:text-2xl italic text-foreground leading-relaxed">
        {text}
      </blockquote>
      {author && (
        <figcaption className="text-sm text-muted-foreground">— {author}</figcaption>
      )}
    </figure>
  )
}
