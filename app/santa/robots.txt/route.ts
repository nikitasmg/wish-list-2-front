import { SANTA_ORIGIN } from '@/shared/santa-route'

export const dynamic = 'force-static'

// robots.txt поддомена Санты: middleware переписывает на него /robots.txt с santa.*.
export function GET(request: Request) {
  const origin = SANTA_ORIGIN || new URL(request.url).origin
  const body = ['User-agent: *', 'Allow: /', 'Disallow: /rooms', 'Disallow: /r/', `Sitemap: ${origin}/sitemap.xml`, ''].join('\n')
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
