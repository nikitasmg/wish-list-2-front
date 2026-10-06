'use client'

import { useApiGetMyProfile } from '@/api/user'
import { Button } from '@/components/ui/button'
import { MAIN_ORIGIN, loginUrl, santaHref } from '@/shared/santa-route'
import { Star } from 'lucide-react'
import Link from 'next/link'

export function SantaHeader() {
  const { data } = useApiGetMyProfile()
  const signedIn = Boolean(data?.user)

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4 md:px-16">
        <Link href={santaHref('/')} className="flex items-center gap-2.5 text-foreground">
          <Star className="size-6 text-tone-gold" fill="currentColor" aria-hidden />
          <span className="flex flex-col">
            <span className="text-micro text-muted-foreground">просто намекни</span>
            <span className="text-title-xs">тайный санта</span>
          </span>
        </Link>
        <nav className="flex gap-6 text-body-sm font-semibold text-muted-foreground">
          <Link href={santaHref('/rooms')} className="hover:text-foreground">Мои комнаты</Link>
          <a href={`${MAIN_ORIGIN}/wishlist`} className="hover:text-foreground">Вишлисты</a>
        </nav>
        <div className="ml-auto">
          {signedIn ? (
            <Button asChild variant="festive">
              <Link href={santaHref('/rooms/new')}>Создать комнату</Link>
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => window.location.assign(loginUrl(window.location.href))}>
              Войти
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
