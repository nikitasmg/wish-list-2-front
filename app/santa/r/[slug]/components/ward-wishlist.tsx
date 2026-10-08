import { Button } from '@/components/ui/button'
import { guestWishlistHref, serviceWishlistShortId } from '@/shared/santa'
import { MAIN_ORIGIN } from '@/shared/santa-route'
import { ChevronRight, ExternalLink, Gift } from 'lucide-react'

const isHttpUrl = (value: string) => /^https?:\/\/[^\s/]+/i.test(value)

/**
 * Вишлист с нашего сервиса — гостевой страницей с анонимной бронью (from=santa);
 * чужая ссылка — как есть.
 */
export function WardWishlist({ name, url }: { name: string; url: string }) {
  if (!url || !isHttpUrl(url)) return null
  const shortId = serviceWishlistShortId(url)
  if (!shortId) {
    return (
      <Button asChild variant="secondary" size="lg">
        <a href={url} target="_blank" rel="noopener noreferrer nofollow">
          <ExternalLink aria-hidden />
          Открыть вишлист
        </a>
      </Button>
    )
  }
  return (
    <a
      href={guestWishlistHref(shortId, MAIN_ORIGIN)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3.5 rounded-card border border-tone-cyan/40 bg-card p-4 transition-colors duration-fast hover:border-tone-cyan"
    >
      <span className="flex size-control-lg shrink-0 items-center justify-center rounded-control-lg bg-tone-cyan/15 text-tone-cyan">
        <Gift className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">Вишлист: {name}</span>
        <span className="block text-body-sm text-muted-foreground">Забронируйте подарок — {name} не узнает от кого</span>
      </span>
      <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
    </a>
  )
}
