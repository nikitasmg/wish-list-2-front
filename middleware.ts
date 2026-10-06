import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { loginUrl, needsLogin, resolveSantaRoute } from '@/shared/santa-route'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const { pathname, search } = request.nextUrl
  const route = resolveSantaRoute(host, pathname, process.env.NEXT_PUBLIC_SANTA_ORIGIN ?? '')

  if (route.type === 'redirect') return NextResponse.redirect(new URL(`${route.url}${search}`, request.url), 308)

  const effective = route.type === 'rewrite' ? route.pathname : pathname
  if (needsLogin(effective) && !request.cookies.get('token')?.value) {
    // Возвращаем на адрес, который видел человек, а не на внутренний /santa/…
    const proto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim() || request.nextUrl.protocol.replace(':', '')
    return NextResponse.redirect(loginUrl(`${proto}://${host}${pathname}${search}`))
  }

  if (route.type === 'rewrite') {
    const url = request.nextUrl.clone()
    url.pathname = route.pathname
    return NextResponse.rewrite(url)
  }
  return NextResponse.next()
}

export const config = {
  // Всё, кроме статики Next и файлов с расширением: поддомен переписывается целиком.
  matcher: ['/((?!_next/|.*\\.[a-zA-Z0-9]+$).*)'],
}
