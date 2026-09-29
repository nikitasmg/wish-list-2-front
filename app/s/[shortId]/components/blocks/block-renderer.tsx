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
import { Block, Wishlist, Present } from '@/shared/types'
import { CoverBlockView } from './cover-block-view'
import { ListBlockView } from './list-block-view'
import { MediaBlockView } from './media-block-view'
import { SecretBlockView } from './secret-block-view'
import { GuestBlockView } from './guest-block-view'
import { GiftsSection } from '../gifts-section'
import { BLOCK_CATALOG, isSecretHidden } from '@/shared/editor-model'
import React from 'react'

type Props = {
  blocks: Block[]
  wishlist?: Wishlist
  presents?: Present[]
  preview?: boolean
  owner?: boolean
  isExample?: boolean
}

export function BlockRenderer({ blocks, ...context }: Props) {
  // Порядок — координаты сетки: сверху вниз, слева направо.
  const sorted = [...blocks].sort((a, b) => a.row - b.row || a.col - b.col)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:auto-rows-[minmax(100px,auto)]">
      {sorted.filter(block => !block.hidden).map((block, idx) => (
        <div
          key={block.id || `${block.row}-${block.col}`}
          className="block-grid-item"
          style={{
            '--mobile-order': idx,
            '--col-span': `${block.col + 1} / span ${block.colSpan ?? 1}`,
            '--row-span': `${block.row + 1}`,
          } as React.CSSProperties}
        >
          <BlockContent block={block} {...context} />
        </div>
      ))}
    </div>
  )
}

export function BlockContent({ block, wishlist, presents = [], preview, owner, isExample }: Omit<Props, 'blocks'> & { block: Block }) {
  if (block.revealAt && isSecretHidden(block)) return <SecretBlockView revealAt={block.revealAt} />
  const interactive = ['rsvp', 'poll', 'playlist', 'guestbook'].includes(block.type)
  const known = BLOCK_CATALOG.some(item => item.type === block.type) || ['text_image', 'image', 'gallery', 'agenda', 'checklist'].includes(block.type)
  return <div className="space-y-4 min-w-0">
          {block.type !== 'cover' && <>{block.caption && <p className="text-sm text-primary">{block.caption}</p>}{block.title && <h2 className="text-2xl font-bold">{block.title}</h2>}</>}
          {block.type === 'cover' && <CoverBlockView block={block} wishlist={wishlist} preview={preview} />}
          {block.type === 'list' && <ListBlockView block={block} />}
          {block.type === 'media' && <MediaBlockView block={block} />}
          {/* id="gifts" — цель кнопки «Смотреть подарки» из обложки */}
          {block.type === 'wishlist' && wishlist && <div id="gifts" className="scroll-mt-6"><GiftsSection wishlist={wishlist} presents={presents} owner={owner} preview={preview} view={block.view} isExample={isExample} /></div>}
          {interactive && (preview || !wishlist ? <div className="rounded-xl border border-dashed p-6 text-muted-foreground">{BLOCK_CATALOG.find(item => item.type === block.type)?.label}. Ответы гостей доступны на опубликованной странице.</div> : <GuestBlockView block={block} wishlistId={wishlist.id} owner={owner} />)}
          {!known && <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Блок из другой версии. Владелец может заменить его в редакторе.</div>}
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
}
