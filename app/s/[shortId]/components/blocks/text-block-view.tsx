import { Block } from '@/shared/types'
import DOMPurify from 'isomorphic-dompurify'
import { CardCover } from '@/components/card-cover'
import { cn } from '@/lib/utils'
export function TextBlockView({ block }: { block: Block }) {
  const data = block.data
  const safe = DOMPurify.sanitize(String(data.html ?? ''), { ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 'h2', 'h3', 'p', 'br', 'ul', 'ol', 'li', 'a', 'mark'], ALLOWED_ATTR: ['href', 'target', 'rel'] })
  return <div className={cn('flex gap-6', data.imagePosition === 'side' ? 'flex-col sm:flex-row' : 'flex-col')}>
    {Boolean(data.imageUrl) && <CardCover cover={String(data.imageUrl)} className={cn('h-56 shrink-0', data.imagePosition === 'side' && 'sm:w-1/3')} />}
    <div className={cn('wishlist-prose min-w-0 break-words', data.width === 'narrow' && 'max-w-xl mx-auto', data.align === 'center' && 'text-center', data.size === 'sm' ? 'text-sm' : data.size === 'lg' ? 'text-xl' : 'text-base')}>
      {safe ? <div dangerouslySetInnerHTML={{ __html: safe }} /> : <p className="whitespace-pre-wrap">{String(data.content ?? '')}</p>}
    </div>
  </div>
}
