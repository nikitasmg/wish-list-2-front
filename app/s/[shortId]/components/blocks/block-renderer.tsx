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
import { cn } from '@/lib/utils'
import { Block, RowSettings, Wishlist, Present } from '@/shared/types'
import { CoverBlockView } from './cover-block-view'
import { ListBlockView } from './list-block-view'
import { MediaBlockView } from './media-block-view'
import { SecretBlockView } from './secret-block-view'
import { GuestBlockView } from './guest-block-view'
import { GiftsSection } from '../gifts-section'
import { BLOCK_CATALOG, isSecretLocked } from '@/shared/editor-model'
import { columnTemplate, layoutRows, normalizeLayout } from '@/shared/layout'
import React from 'react'

type Props = {
  blocks: Block[]
  rows?: RowSettings[] | null
  wishlist?: Wishlist
  presents?: Present[]
  preview?: boolean
  owner?: boolean
  isExample?: boolean
}

const GAP: Record<string, string> = { s: 'md:gap-x-4', m: 'md:gap-x-7', l: 'md:gap-x-11', '': 'md:gap-x-7' }

/**
 * Страница из рядов. На компьютере ряд — сетка с пропорциями колонок, на
 * телефоне колонки встают друг под другом («правая — первой» переворачивает
 * порядок).
 *
 * Скрытые блоки сюда не доходят: бэк их не отдаёт, а в предпросмотре они
 * отфильтрованы. Колонка, оставшаяся пустой, у гостя схлопывается — иначе
 * на странице висела бы дыра на месте спрятанного блока.
 */
export function BlockRenderer({ blocks, rows, ...context }: Props) {
  const visible = blocks.filter(block => !block.hidden)
  const layout = normalizeLayout(visible, rows ?? [])

  return (
    <div className="space-y-14 md:space-y-20">
      {layoutRows(layout).map(row => {
        const cells = row.cells.filter((cell): cell is Block => Boolean(cell))
        const settings = cells.length === row.cells.length ? row.settings : { ...row.settings, columns: cells.length, ratio: '' as const }
        const single = cells.length === 1
        return (
          <div
            key={row.index}
            className={cn(
              'flex gap-10 md:grid md:gap-y-0 md:[grid-template-columns:var(--row-template)]',
              settings.mobileReverse ? 'flex-col-reverse' : 'flex-col',
              GAP[row.settings.gap ?? ''],
              row.settings.height === 'equal' ? 'md:items-stretch' : 'md:items-start',
            )}
            style={{ '--row-template': columnTemplate(settings) } as React.CSSProperties}
          >
            {cells.map(block => (
              <div
                key={block.id}
                id={`b-${block.id}`}
                className={cn('min-w-0', single && block.width === 'narrow' && 'mx-auto w-full max-w-[640px]')}
              >
                <BlockContent block={block} {...context} />
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

/** Блоки, которые на странице лежат карточкой, а не прямо на фоне. */
const CARD_TYPES = new Set(['list', 'location', 'color_scheme', 'contact', 'rsvp', 'poll', 'playlist', 'guestbook', 'timing', 'date', 'agenda', 'checklist'])

export function BlockHeader({ block, className }: { block: Block; className?: string }) {
  if (!block.caption && !block.title) return null
  return (
    <header className={cn('space-y-1.5', className)}>
      {block.caption && <p className="text-sm font-semibold text-primary">{block.caption}</p>}
      {block.title && <h2 className="heading text-[26px] font-extrabold leading-tight tracking-tight md:text-[32px]">{block.title}</h2>}
    </header>
  )
}

export function BlockContent({ block, wishlist, presents = [], preview, owner, isExample }: Omit<Props, 'blocks' | 'rows'> & { block: Block }) {
  if (isSecretLocked(block)) return <SecretBlockView block={block} />
  const interactive = ['rsvp', 'poll', 'playlist', 'guestbook'].includes(block.type)
  const known = BLOCK_CATALOG.some(item => item.type === block.type) || ['text_image', 'image', 'gallery', 'agenda', 'checklist'].includes(block.type)
  const card = CARD_TYPES.has(block.type)
  // Шапку «Вишлиста» рисует сам GiftsSection: у него рядом с заголовком счётчик.
  const ownHeader = block.type === 'cover' || block.type === 'wishlist'
  return (
    <div className={cn('min-w-0 space-y-5', card && 'h-full rounded-[22px] border bg-card p-6 text-card-foreground md:p-8')}>
      {!ownHeader && <BlockHeader block={block} />}
      {block.type === 'cover' && <CoverBlockView block={block} wishlist={wishlist} preview={preview} />}
      {block.type === 'list' && <ListBlockView block={block} />}
      {block.type === 'media' && <MediaBlockView block={block} />}
      {/* id="gifts" — цель кнопки «Смотреть подарки» из обложки */}
      {block.type === 'wishlist' && wishlist && <div id="gifts" className="scroll-mt-6"><GiftsSection wishlist={wishlist} presents={presents} owner={owner} preview={preview} view={block.view} isExample={isExample} block={block} /></div>}
      {interactive && (preview || !wishlist
        ? <div className="rounded-xl border border-dashed p-6 text-muted-foreground">{BLOCK_CATALOG.find(item => item.type === block.type)?.label}. Ответы гостей доступны на опубликованной странице.</div>
        : <GuestBlockView block={block} wishlistId={wishlist.id} owner={owner} />)}
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
  )
}
