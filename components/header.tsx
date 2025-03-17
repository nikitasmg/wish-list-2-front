'use client'
import { useApiGetMe } from '@/api/user'
import { Logo } from '@/components/logo'
import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/ui/mode-toggle'
import { useRouter } from 'next/navigation'

import * as React from 'react'

export const Header = () => {
  const { data } = useApiGetMe()
  const user = data?.user
  const navigate = useRouter()
  return (
    <header className="flex justify-between py-2 items-center md:mb-10 px-2 md:px-5">
      <Logo />
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