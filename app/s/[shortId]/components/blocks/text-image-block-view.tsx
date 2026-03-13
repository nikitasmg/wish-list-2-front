import { Block } from '@/shared/types'
import DOMPurify from 'isomorphic-dompurify'
import Image from 'next/image'
import React from 'react'

const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 'p', 'br']

export function TextImageBlockView({ block }: { block: Block }) {
  const html = block.data.html as string | undefined
  const content = block.data.content as string | undefined
  const imageUrl = block.data.imageUrl as string

  if (!html && !content && !imageUrl) return null

  const textContent = html
    ? DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: [] })
    : null

  return (
    <div className="grid md:grid-cols-2 gap-6 items-center">
      {(textContent || content) && (
        <div className="pl-8 border-l-4 border-accent text-xl leading-relaxed">
          {textContent ? (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: textContent }}
            />
          ) : (
            <span className="whitespace-pre-wrap">{content}</span>
          )}
        </div>
      )}
      {imageUrl && (
        <div className="rounded-2xl overflow-hidden">
          <Image src={imageUrl} alt="block image" width={600} height={400} className="w-full object-cover" unoptimized />
        </div>
      )}
    </div>
  )
}
