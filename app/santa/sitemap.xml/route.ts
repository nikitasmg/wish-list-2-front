import { SANTA_ORIGIN } from '@/shared/santa-route'

export const dynamic = 'force-static'

// Карта поддомена Санты: пока только лендинг. Комнаты и приглашения закрыты в robots.txt.
export function GET(request: Request) {
  const origin = SANTA_ORIGIN || new URL(request.url).origin
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${origin}/</loc></url>
</urlset>
`
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
