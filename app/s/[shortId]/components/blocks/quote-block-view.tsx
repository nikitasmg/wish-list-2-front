import { Block } from '@/shared/types'
import React from 'react'

/** Цитата — крупно и по центру, как в макете: это пауза между блоками. */
export function QuoteBlockView({ block }: { block: Block }) {
  const text = String(block.data.text ?? '').trim()
  const author = String(block.data.author ?? '').trim()
  if (!text) return null
  return (
    <figure className="mx-auto max-w-3xl space-y-4 text-center">
      <blockquote className="heading text-2xl font-semibold leading-snug md:text-[32px]">
        «{text.replace(/^[«"]|[»"]$/g, '')}»
      </blockquote>
      {author && <figcaption className="text-sm text-muted-foreground">— {author}</figcaption>}
    </figure>
  )
}
