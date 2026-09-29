'use client'
import { useApiGetMe } from '@/api/user'
import { Logo } from '@/components/logo'
import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/ui/mode-toggle'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import * as React from 'react'

export const Header = () => {
  const { data } = useApiGetMe()
  const user = data?.user
  const navigate = useRouter()
  return (
    <header className="flex justify-between py-2 items-center px-2 md:px-5 gap-4">
      <div className="flex items-center gap-6 min-w-0">
        <Logo />
        {/* Навигация только для вошедших: гостю на странице подарков она
            ни к чему, а «Мои вишлисты» без аккаунта ведут на вход. */}
        {user && (
          <nav className="hidden sm:flex gap-5 text-sm font-semibold" aria-label="Разделы">
            <Link href="/wishlist" className="text-muted-foreground hover:text-foreground">Мои вишлисты</Link>
            <Link href="/templates" className="text-muted-foreground hover:text-foreground">Шаблоны</Link>
          </nav>
        )}
      </div>
      <div className="flex gap-2 items-center">
        <ModeToggle />
        {
          user
            ? <UserAvatar user={user} />
            : <div className="flex gap-2">
              <Button className="max-w-max" variant="ghost" size="sm" onClick={() => navigate.push('/login')}>
                Войти
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate.push('/registration')}>
                Зарегистрироваться
              </Button>
            </div>
        }
      </div>
    </header>
  )
}