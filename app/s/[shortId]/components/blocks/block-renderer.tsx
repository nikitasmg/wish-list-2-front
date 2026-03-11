import { ColorSchemeBlockView } from '@/app/s/[shortId]/components/blocks/color-scheme-block-view'
import { DateBlockView } from '@/app/s/[shortId]/components/blocks/date-block-view'
import { ImageBlockView } from '@/app/s/[shortId]/components/blocks/image-block-view'
import { LocationBlockView } from '@/app/s/[shortId]/components/blocks/location-block-view'
import { TextBlockView } from '@/app/s/[shortId]/components/blocks/text-block-view'
import { TextImageBlockView } from '@/app/s/[shortId]/components/blocks/text-image-block-view'
import { TimingBlockView } from '@/app/s/[shortId]/components/blocks/timing-block-view'
import { Block } from '@/shared/types'
import React from 'react'

type Props = {
  blocks: Block[]
}

export function BlockRenderer({ blocks }: Props) {
  const sorted = [...blocks].sort((a, b) => a.position - b.position)

  return (
    <div className="space-y-12">
      {sorted.map((block, i) => (
        <div key={i}>
          {block.type === 'text' && <TextBlockView block={block} />}
          {block.type === 'text_image' && <TextImageBlockView block={block} />}
          {block.type === 'image' && <ImageBlockView block={block} />}
          {block.type === 'date' && <DateBlockView block={block} />}
          {block.type === 'location' && <LocationBlockView block={block} />}
          {block.type === 'color_scheme' && <ColorSchemeBlockView block={block} />}
          {block.type === 'timing' && <TimingBlockView block={block} />}
        </div>
      ))}
    </div>
  )
}
