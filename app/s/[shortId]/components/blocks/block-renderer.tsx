import { AgendaBlockView } from '@/app/s/[shortId]/components/blocks/agenda-block-view'
import { ChecklistBlockView } from '@/app/s/[shortId]/components/blocks/checklist-block-view'
import { ColorSchemeBlockView } from '@/app/s/[shortId]/components/blocks/color-scheme-block-view'
import { ContactBlockView } from '@/app/s/[shortId]/components/blocks/contact-block-view'
import { DateBlockView } from '@/app/s/[shortId]/components/blocks/date-block-view'
import { DividerBlockView } from '@/app/s/[shortId]/components/blocks/divider-block-view'
import { GalleryBlockView } from '@/app/s/[shortId]/components/blocks/gallery-block-view'
import { ImageBlockView } from '@/app/s/[shortId]/components/blocks/image-block-view'
import { LocationBlockView } from '@/app/s/[shortId]/components/blocks/location-block-view'
import { QuoteBlockView } from '@/app/s/[shortId]/components/blocks/quote-block-view'
import { TextBlockView } from '@/app/s/[shortId]/components/blocks/text-block-view'
import { TextImageBlockView } from '@/app/s/[shortId]/components/blocks/text-image-block-view'
import { TimingBlockView } from '@/app/s/[shortId]/components/blocks/timing-block-view'
import { VideoBlockView } from '@/app/s/[shortId]/components/blocks/video-block-view'
import { Block } from '@/shared/types'
import React from 'react'

type Props = {
  blocks: Block[]
}

export function BlockRenderer({ blocks }: Props) {
  const sorted = [...blocks].sort((a, b) => a.position - b.position)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:auto-rows-[minmax(100px,auto)]">
      {sorted.map((block) => (
        <div
          key={block.position}
          className="block-grid-item"
          style={{
            '--mobile-order': block.mobilePosition ?? block.position,
            '--col-span': `span ${block.colSpan ?? 1}`,
            '--row-span': `span ${block.rowSpan ?? 1}`,
          } as React.CSSProperties}
        >
          {block.type === 'text' && <TextBlockView block={block} />}
          {block.type === 'text_image' && <TextImageBlockView block={block} />}
          {block.type === 'image' && <ImageBlockView block={block} />}
          {block.type === 'date' && <DateBlockView block={block} />}
          {block.type === 'location' && <LocationBlockView block={block} />}
          {block.type === 'color_scheme' && <ColorSchemeBlockView block={block} />}
          {block.type === 'timing' && <TimingBlockView block={block} />}
          {block.type === 'agenda' && <AgendaBlockView block={block} />}
          {block.type === 'gallery' && <GalleryBlockView block={block} />}
          {block.type === 'quote' && <QuoteBlockView block={block} />}
          {block.type === 'divider' && <DividerBlockView block={block} />}
          {block.type === 'contact' && <ContactBlockView block={block} />}
          {block.type === 'video' && <VideoBlockView block={block} />}
          {block.type === 'checklist' && <ChecklistBlockView block={block} />}
        </div>
      ))}
    </div>
  )
}
