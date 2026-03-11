import { Block } from '@/shared/types'
import DOMPurify from 'isomorphic-dompurify'
import React from 'react'

const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 'h2', 'h3', 'p', 'br']

export function TextBlockView({ block }: { block: Block }) {
  const html = block.data.html as string | undefined
  const content = block.data.content as string | undefined

  if (html) {
    const safe = DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: [] })
    return (
      <div className="pl-8 md:pl-12 border-l-4 border-accent">
        <div
          className="prose prose-sm max-w-3xl"
          dangerouslySetInnerHTML={{ __html: safe }}
        />
      </div>
    )
  }

  if (content) {
    return (
      <div className="pl-8 md:pl-12 border-l-4 border-accent">
        <div className="text-xl md:text-2xl leading-relaxed text-foreground max-w-3xl whitespace-pre-wrap">
          {content}
        </div>
      </div>
    )
  }

  return null
}
