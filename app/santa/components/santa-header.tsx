'use client'

import { useApiGetMyProfile } from '@/api/user'
import { Button } from '@/components/ui/button'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { UserAvatar } from '@/components/user-avatar'
import { MAIN_ORIGIN, loginUrl, santaHref } from '@/shared/santa-route'
import { Star } from 'lucide-react'
import Link from 'next/link'

export function SantaHeader() {
  const { data, isPending } = useApiGetMyProfile()
  const signedIn = Boolean(data?.user)

  const create = (
    <Button asChild variant="festive">
      {/* На телефоне рядом с логотипом и аватаркой помещается только короткая подпись. */}
      <Link href={santaHref('/rooms/new')}>Создать<span className="hidden sm:inline">&nbsp;комнату</span></Link>
    </Button>
  )

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 md:px-16">
        <Link href={santaHref('/')} className="flex items-center gap-2.5 text-foreground">
          <Star className="size-6 text-tone-gold" fill="currentColor" aria-hidden />
          <span className="flex flex-col">
            <span className="text-micro text-muted-foreground">просто намекни</span>
            <span className="text-title-xs">тайный санта</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          {isPending ? (
            // Пока неизвестно, вошёл ли человек, место занимают те же кнопка и
            // аватарка, только невидимые: шапка не прыгает, «Войти» не мигает.
            <div className="invisible flex items-center gap-3" aria-hidden>
              {create}
              <div className="size-10" />
            </div>
          ) : signedIn && data ? (
            <>
              {create}
              {/* Меню аккаунта то же, что на основном сайте; ссылки ведут туда. */}
              <UserAvatar
                user={data.user}
                origin={MAIN_ORIGIN}
                contentClassName="dark santa"
                menuStart={
                  <DropdownMenuItem asChild>
                    <Link href={santaHref('/rooms')}>Мои комнаты</Link>
                  </DropdownMenuItem>
                }
              />
            </>
          ) : (
            // Дойти сюда можно только на клиенте: на сервере запрос всегда в ожидании.
            <Button asChild variant="secondary">
              <a href={loginUrl(window.location.href)}>Войти</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
